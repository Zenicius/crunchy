// packages
import request from 'request-promise-native';
import cheerio from 'cheerio';
import querystring from 'querystring';
import {M3U} from 'playlist-parser';
import axios from 'axios';
import electron from 'electron';
import React from 'react';
// db
import db from '../db';
//ui
import {Button, Icon, Card} from 'semantic-ui-react';
//subtitles
import parseXml from './parseXml';
import decode from './subtitles';
import bytesToAss from './subtitles/ass';

// URL
const baseURL = 'http://www.crunchyroll.com';

// API
class Crunchyroll {
  constructor() {
    this.isLoading = false;
    this.authCookies = null;
    this.init();
  }

  async init() {
    //load auth
    try {
      this.authCookies = await db.auth.get('crunchyroll');
    } catch (e) {
      if (e.name === 'not_found') {
        this.authCookies = null;
      }
    }
  }

  auth() {
    if (this.authCookies !== null) {
      console.log('Logged in!');
      return;
    }

    //new window
    const remote = electron.remote;
    const BrowserWindow = remote.BrowserWindow;
    let loginWin = new BrowserWindow({width: 800, height: 600});
    //disable menu
    loginWin.setMenu(null);
    //cleanup
    loginWin.on('closed', () => {
      loginWin = null;
    });
    //wait page finish loading
    loginWin.webContents.on('did-finish-load', () => {
      console.log(loginWin.webContents.getURL());
      //auth suceccesful
      if (loginWin.webContents.getURL() === 'https://www.crunchyroll.com/') {
        loginWin.webContents.session.cookies.get({}, async (error, cookies) => {
          if (error) {
            console.log('Error: Failed to get cookies');
            return;
          }
          console.log('cookies', error, cookies);
          //Store auth cookies
          this.authCookies = cookies;
          await db.auth.put({_id: 'crunchyroll', cookies});
          console.log('Saved cookies');
          loginWin.close();
        });
      }
    });

    //loads url
    loginWin.loadURL(`${baseURL}/login?next=%2F`);
  }

  async getAllSeries(page = 0) {
    //TODO: ERROR PAGES
    console.log('Getting popular series');
    //Loading
    this.isLoading = true;
    // load catalogue
    const data = await request(`${baseURL}/videos/anime/popular/ajax_page?pg=${page}`).catch(function(err) {
      console.log('Failed');
      return;
    });
    // create cheerio cursor
    let $;
    //series
    let series;
    if (data !== undefined || null) {
      $ = cheerio.load(data);
      series = $('li.group-item')
        .map((index, el) => {
          const element = $(el);
          // get title & url
          const title = $('a', element).attr('title');
          const _id = $('a', element).attr('href');
          const url = `${baseURL}${_id}`;
          // get image
          const image = $('img', element).attr('src');
          // get videos count
          const seriesData = $('.series-data', element);
          const count = parseInt(seriesData.text().trim().replace('Videos', '').trim(), 10);
          // return series data
          return {
            _id,
            source: 'crunchyroll',
            title,
            url,
            image,
            count,
          };
        })
        .get();

      //add to database
      await db.series.bulkDocs(series);
    } else {
      console.log('failed again');
      series = null;
    }
    //Ends loading
    this.isLoading = false;
    return series;
  }

  async getEpisodes(series) {
    //TODO: Loading
    console.log('Getting episodes for ', series.url);
    // load episodes
    const data = await request(series.url);
    const $ = cheerio.load(data);

    // episodes
    const episodes = $('.group-item', '.list-of-seasons ul.portrait-grid')
      .map((index, el) => {
        const element = $(el);
        // img
        const img_container = $('img', element);

        const _id = $('a.episode', element).attr('href');
        const url = `${baseURL}${_id}`;
        const image = img_container.attr('src') || img_container.attr('data-thumbnailurl');
        const title = $('.series-title', element).text().trim();
        const description = $('.short-desc', element).text().trim();
        var season = $('a.episode', element).attr('title').replace(title, '');

        //unique season or no seasons
        if (series.title.trim() === season.trim()) {
          season = 'unique';
        }

        return {
          _id,
          url,
          image,
          title,
          description,
          season,
          series: series._id,
        };
      })
      .get();

    // console.log(episodes);
    // store in the db
    await db.episodes.bulkDocs(episodes);
    return episodes;
  }

  async getInfo(series) {
    console.log('Getting info for ', series.url);
    // load info
    const data = await request(series.url);
    const $ = cheerio.load(data);
    // info
    const sidebar = $('ul.list-block');
    const image = $('img', sidebar).attr('src');
    const description = $('span.more', sidebar).text().trim();
    const rating = $('span.rating-widget-static-large', sidebar).attr('content');
    // anime
    const anime = {
      image,
      description,
      rating,
    };

    // console.log(anime);
    await db.info.bulkDocs(anime);
    return anime;
  }

  async getEpisode(episode) {
    console.log('Loading episode: ', episode);
    //load episode page
    const {data} = await axios.get(episode.url);
    //cheerio
    const $ = cheerio.load(data);
    //available formats
    const formats = [];
    $('a[token^=showmedia]').each((index, el) => {
      const token = $(el).attr('token');
      if (!token.includes('showmedia.')) return;
      const formatId = token.replace('shomedia.', '').replace(/p$/, '');
      formats.push(formatId);
    });

    const format = formats[0];
    const idRegex = /([0-9]+)$/g;
    const idMatches = idRegex.exec(episode.url);
    const id = idMatches[0];

    const xmlUrl = `http://www.crunchyroll.com/xml/?req=RpcApiVideoPlayer_GetStandardConfig&` +
      `media_id=${id}&video_format=${format}&video_quality=${format}`;

    const {data: xmlData} = await axios({
      url: xmlUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: querystring.stringify({
        current_page: episode.url,
      }),
    });

    const xmlObj = await parseXml(xmlData);
    const preload = xmlObj['config:Config']['default:preload'][0];
    const subtitlesInfo = preload.subtitles[0].subtitle;
    const streamInfo = preload.stream_info[0];
    const streamFile = streamInfo.file[0];

    //load stream urls playlist
    const {data: streamFileData} = await axios.get(streamFile);
    const playlist = M3U.parse(streamFileData);

    console.log(subtitlesInfo);
    //subtitles
    const englishSubs = subtitlesInfo.map(s => s.$).filter(s => s.title.includes('Brasil')).pop();
    const {data: subData} = await axios.get(englishSubs.link);
    const subsObj = await parseXml(subData);
    const subsId = parseInt(subsObj.subtitle.$.id, 10);
    const subsIv = subsObj.subtitle.iv.pop();
    const subsData = subsObj.subtitle.data.pop();

    const subBytes = await decode(subsId, subsIv, subsData);
    const subtitlesText = await bytesToAss(subBytes);
    const subBlob = new Blob([subtitlesText], {
      type: 'application/octet-binary',
    });

    //final
    const subtitles = URL.createObjectURL(subBlob);
    const url = playlist.pop().file;
    const type = 'application/x-mpegURL';

    return {type, url, subtitles};
  }

  search(query) {}

  async logout() {
    //Reset cookies from db
    this.authCookies = null;
    await db.auth.put({_id: 'crunchyroll', cookies: null});
  }

  renderSettings() {
    const loggedIn = this.authCookies !== null;
    console.log(loggedIn);
    console.log(this.authCookies);

    return (
      <div className="settings">
        <Card color="yellow">
          <Card.Content>
            <Card.Header>Crunchyroll</Card.Header>
            <Card.Description>

              Login at Crunchyroll to see premimum videos and quality!
            </Card.Description>
          </Card.Content>
          <Card.Content extra>
            {loggedIn
              ? <Button icon labelPosition="left" color="grey" className="button" onClick={() => this.logout()}>
                  <Icon name="log out" />
                  Logout
                </Button>
              : <Button icon labelPosition="left" color="grey" className="button" onClick={() => this.auth()}>
                  <Icon name="user" />
                  Login
                </Button>}
          </Card.Content>
        </Card>

      </div>
    );
  }
}

export default new Crunchyroll();
