// packages
import request from 'request-promise-native';
import cheerio from 'cheerio';
import {M3U} from 'playlist-parser';
import electron from 'electron';
import React from 'react';
// db
import db from '../db';
//subtitles
import parseXml from './parseXml';
import decode from './subtitles';
import bytesToAss from './subtitles/ass';

// URL
const baseURL = 'https://www.crunchyroll.com';

// API
class Crunchyroll {
  constructor() {
    this.isLoading = false;

    this.authCookies = null;
    this.isInited = this.init();
  }

  async init() {
    if (this.authCookies) {
      return;
    }
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
          //console.log('cookies', error, cookies);
          //Store auth cookies (filter for crunchyroll cookies only)
          this.authCookies = cookies.filter(c => c.domain.includes('crunchyroll.com'));
          await db.auth.put({_id: 'crunchyroll', cookies: this.authCookies});
          this.authCookies = await db.auth.get('crunchyroll');
          console.log('Saved cookies');
          //closes window
          loginWin.close();
        });
      }
    });

    //loads url
    loginWin.loadURL(`${baseURL}/login?next=%2F`);
  }

  async logout() {
    //Reset cookies from db
    await db.auth.remove(this.authCookies);
    this.authCookies = null;
  }

  async getAllSeries(page = 0) {
    //Loading
    this.isLoading = true;
    // wait for auth
    await this.isInited;

    // load catalogue
    console.log('Getting popular series');

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
    // wait for auth
    await this.isInited;

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
        const number = title.replace(/^\D+/g, '');
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
          number,
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
    // wait for auth
    await this.isInited;

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
    // wait for auth
    await this.isInited;

    console.log('Loading episode: ', episode.url);
    //load episode page
    const data = await request(episode.url);
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

    const xmlUrl = `https://www.crunchyroll.com/xml/?req=RpcApiVideoPlayer_GetStandardConfig&` +
      `media_id=${id}&video_format=${format}&video_quality=${format}`;

    // add auth cookies
    const jar = request.jar();
    if (this.authCookies !== null) {
      this.authCookies.cookies.forEach(data => {
        const cookie = request.cookie(`${data.name}=${data.value}`);
        jar.setCookie(cookie, `${baseURL}${data.path}`);
      });
    }
    const xmlData = await request({
      url: xmlUrl,
      jar,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: {
        current_page: episode.url,
      },
    });

    //file to be returned
    let subtitles = null, url = null, type = null;
    //error
    let err = null;

    const xmlObj = await parseXml(xmlData);
    const preload = xmlObj['config:Config']['default:preload'][0];

    //try get subtitles from preload, if cant, episode is premium
    let subtitlesInfo;
    try {
      subtitlesInfo = preload.subtitles[0].subtitle;
    } catch (e) {
      err = 'Failed to load episode';
      console.log('Failed to load episode (episode is probably premium)');
      return {subtitles, url, type, err};
    }

    const streamInfo = preload.stream_info[0];
    const streamFile = streamInfo.file[0];

    //load stream urls playlist
    const streamFileData = await request(streamFile);
    const playlist = M3U.parse(streamFileData);

    console.log(subtitlesInfo);
    //subtitles
    const englishSubs = subtitlesInfo.map(s => s.$).filter(s => s.title.includes('Brasil')).pop();
    const subData = await request(englishSubs.link);
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
    subtitles = URL.createObjectURL(subBlob);
    url = playlist.pop().file;
    type = 'application/x-mpegURL';

    return {type, url, subtitles, err};
  }

  async getMySeries() {
    await this.isInited;

    //not logged in
    if (this.authCookies == null) {
      return;
    }
    // add auth cookies
    const jar = request.jar();
    this.authCookies.cookies.forEach(data => {
      const cookie = request.cookie(`${data.name}=${data.value}`);
      jar.setCookie(cookie, `${baseURL}${data.path}`);
    });

    // force english language
    //jar.setCookie(request.cookie(`c_locale=enUS`), baseURL);

    // request page html
    const data = await request({
      url: `${baseURL}/home/queue`,
      jar,
    });

    //cheerio cursor
    const $ = cheerio.load(data);
    //main contents
    const mainContent = $('#main_content');
    const items = $('li.queue-item', mainContent)
      .map((index, el) => {
        const element = $(el);
        //image
        const imageContainer = $('div.episode-img', element);
        const image = $('img', imageContainer).attr('src');
        //episode title and link
        const episodeTitle = $('a.episode', element).attr('title');
        const episodeUrl = $('a.episode', element).attr('href');
        //series info
        const seriesInfo = $('.series-info', element);
        const seriesTitle = $('.series-title', seriesInfo).text().trim();
        const seriesNext = $('.series-data', seriesInfo).text().trim();
        const seriesUrl = $('div.queue-controls > a.left', element).attr('href');
        const description = $('.short-desc', seriesInfo).text().trim();
        //id
        const _id = episodeUrl;

        return {
          _id,
          image,
          episodeTitle,
          episodeUrl,
          seriesTitle,
          seriesNext,
          seriesUrl,
          description,
        };
      })
      .toArray();

    //remove series no longer bookmarked from db
    const dbItems = await db.bookmarkSeries.allDocs({
      include_docs: true,
    });
    if (dbItems.rows.length > items.length) {
      //deletes item no longer bookmakerd
      dbItems.rows.forEach(async dbItem => {
        let found = true;
        let stop = false;
        items.forEach(item => {
          if (!stop) {
            if (dbItem.id == item._id) {
              found = true;
              stop = true;
            } else {
              found = false;
              stop = false;
            }
          }
        });
        if (found == false) {
          //get and delete no longer bookmarked
          const toBeDeleted = await db.bookmarkSeries.get(dbItem.id);
          await db.bookmarkSeries.remove(toBeDeleted);
        }
      });
    }

    //store in db
    await db.bookmarkSeries.bulkDocs(items);

    console.log('My series: ', items);
    return items;
  }
  async search(query) {
    //search catalogue
    const data = await request(`${baseURL}/ajax/?req=RpcApiSearch_GetSearchCandidates`);

    //data to json
    const lines = data.split('\n');
    const dataJson = lines[1];
    const catalogue = JSON.parse(dataJson);

    //series filter
    const series = catalogue.data.filter(it => it.type === 'Series');

    const matches = series.filter(it => it.name.toLowerCase().includes(query.toLowerCase())).map(it => ({
      _id: it.link,
      source: 'crunchyroll',
      title: it.name,
      url: `${baseURL}${it.link}`,
      image: it.image,
      count: '',
    }));

    return matches;
  }
}

export default new Crunchyroll();
