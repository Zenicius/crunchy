// packages
import request from 'request-promise-native';
import cheerio from 'cheerio';
import {M3U} from 'playlist-parser';
import electron from 'electron';
import _ from 'lodash';
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
    this.authCookies = null;
    this.isInited = this.init();
  }

  async init() {
    if (this.authCookies) {
      return;
    }
    // load auth
    try {
      this.authCookies = await db.auth.get('crunchyroll');
    } catch (e) {
      if (e.name === 'not_found') {
        this.authCookies = null;
      }
    }
  }

  auth(component) {
    if (this.authCookies !== null) {
      console.log('Auth: Logged in!');
      return;
    }

    const remote = electron.remote;
    // main window
    const mainWindow = remote.getCurrentWindow();
    const BrowserWindow = remote.BrowserWindow;
    // creat new window
    let loginWin = new BrowserWindow({width: 800, height: 600, parent: mainWindow, modal: true});
    // disable menu
    loginWin.setMenu(null);
    // cleanup
    loginWin.on('closed', () => {
      loginWin = null;
      // Handle login complete at navbar
      component.handleLoginCompleted();
    });
    // wait page finish loading
    loginWin.webContents.on('did-finish-load', () => {
      console.log('Current URL: ', loginWin.webContents.getURL());
      // auth suceccesful
      if (loginWin.webContents.getURL() === 'https://www.crunchyroll.com/') {
        loginWin.webContents.session.cookies.get({}, async (error, cookies) => {
          if (error) {
            console.log('Error: Failed to get cookies');
            return;
          }
          // Store auth cookies (filter for crunchyroll cookies only)
          this.authCookies = cookies.filter(c => c.domain.includes('crunchyroll.com'));
          await db.auth.put({_id: 'crunchyroll', cookies: this.authCookies});
          this.authCookies = await db.auth.get('crunchyroll');
          console.log('Auth: Saved cookies');
          // closes window
          loginWin.close();
        });
      }
    });

    // loads url
    loginWin.loadURL(`${baseURL}/login?next=%2F`);
  }

  async logout() {
    // remover user from db
    const user = await db.current.get('user');
    await db.current.remove(user);

    // Remove cookies from db
    await db.auth.remove(this.authCookies);
    this.authCookies = null;
  }

  async getUser() {
    // wait for auth
    await this.isInited;

    if (this.authCookies == null) return;

    // add auth cookies
    const jar = request.jar();
    this.authCookies.cookies.forEach(data => {
      const cookie = request.cookie(`${data.name}=${data.value}`);
      jar.setCookie(cookie, `${baseURL}${data.path}`);
    });

    // request page html
    const data = await request({
      url: baseURL,
      jar,
    });

    let $ = cheerio.load(data);
    // get username and profile page
    const link = $('a', 'li.username').attr('href');
    const name = $('a', 'li.username').text().trim();

    const dataProfile = await request({
      url: `${baseURL}${link}`,
      jar,
    });

    $ = cheerio.load(dataProfile);
    // get user image and account type
    const image = $('img.library-poster').attr('src');
    let type = $('img.cr-star-tiny').attr('title');

    if (type == undefined) {
      type = 'Normal Member';
    }

    const user = {
      link,
      name,
      image,
      type,
    };

    // store in db
    await db.current.put({_id: 'user', link: user.link, name: user.name, image: user.image, type: user.type});

    return user;
  }

  async getAllSeries(page = 0) {
    // wait for auth
    await this.isInited;

    // load home series
    console.log('Crunchy: Getting popular series');

    // get page
    const data = await request(`${baseURL}/videos/anime/popular/ajax_page?pg=${page}`);
    // create cheerio cursor
    const $ = cheerio.load(data);
    // series
    const series = $('li.group-item')
      .map((index, el) => {
        const element = $(el);
        // get title & id
        const title = $('a', element).attr('title');
        const _id = $('a', element).attr('href');
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
          image,
          count,
        };
      })
      .get();

    // add to database
    await db.series.bulkDocs(series);

    return series;
  }

  async getAllSeriesGenre(genre) {
    // wait for auth
    await this.isInited;

    // load series by genre
    console.log('Crunchy: Getting ', genre, ' series');

    let hasMorePages = true;
    let page = 0;

    // load series while theres more pages
    while (hasMorePages) {
      // get page
      const url = `${baseURL}/videos/anime/genres/ajax_page?pg=${page}&tagged=${genre}`;
      const data = await request(url);
      // create cheerio cursor
      const $ = cheerio.load(data);
      // series
      const series = $('li.group-item')
        .map((index, el) => {
          const element = $(el);
          // get title & id
          const title = $('a', element).attr('title');
          const _id = $('a', element).attr('href');
          // get image
          const image = $('img', element).attr('src');
          // get videos count
          const seriesData = $('.series-data', element);
          const count = parseInt(seriesData.text().trim().replace('Videos', '').trim(), 10);

          // return series data
          return {
            _id,
            source: 'crunchyroll',
            genre,
            title,
            image,
            count,
          };
        })
        .get();

      // update genre of series already in db
      if (series.length > 0) {
        series.forEach(async serie => {
          try {
            await db.genres.get(serie._id).then(async doc => {
              if (doc.genre != serie.genre) {
                // update
                doc.genre = serie.genre;
                // put them back
                await db.genres.put(doc);
              }
            });
          } catch (e) {
            if (e.status === 404) {
              return;
            }
          }
        });

        // add to database
        await db.genres.bulkDocs(series);

        page++;
      } else {
        hasMorePages = false;
      }
    }
  }

  async getEpisodes(series) {
    // wait for auth
    await this.isInited;

    // this series url
    const url = `${baseURL}${series._id}`;

    console.log('Crunchy: Getting episodes for ', url);
    // load episodes
    const data = await request(url);
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

    // store in the db
    await db.episodes.bulkDocs(episodes);
    return episodes;
  }

  async getInfo(series) {
    // wait for auth
    await this.isInited;

    // this series url
    const url = `${baseURL}${series._id}`;

    console.log('Crunchy: Getting info for ', url);

    // Loads data
    const data = await request(url);
    // load infori
    const $ = cheerio.load(data);
    // info
    const title = $('[itemprop=name]').text();
    const sidebar = $('ul.list-block');
    const image = $('img', sidebar).attr('src');
    const description = $('span.more', sidebar).text().trim() || $('span.trunc-desc', sidebar).text().trim();
    const rating = $('span.rating-widget-static-large', sidebar).attr('content');
    const publisher = $('a[href*="publisher"]', sidebar).text();
    const genres = [];
    $('a[href*="genres"]', sidebar).each((index, el) => {
      const genre = $(el).text();
      genres[index] = genre.slice(0, 1).toUpperCase() + genre.slice(1);
    });

    // id for bookmark serie
    const id = $('div.show-actions', sidebar).attr('group_id');

    let bookmarked = false;
    // check if series is bookmarked
    if (this.authCookies !== null) {
      // add auth cookies
      const jar = request.jar();
      this.authCookies.cookies.forEach(data => {
        const cookie = request.cookie(`${data.name}=${data.value}`);
        jar.setCookie(cookie, `${baseURL}${data.path}`);
      });

      // request page html
      const data = await request({
        url: `${baseURL}/home/queue`,
        jar,
      });
      // cheerio cursor
      const $ = cheerio.load(data);

      $('div.queue-controls > a.left', 'ul.landscape-grid').each((index, element) => {
        if ($(element).attr('href') === series._id) {
          bookmarked = true;
          return;
        }
      });
    } else {
      // user not logged in
      bookmarked = null;
    }

    // series info
    const info = {
      id,
      link: series._id,
      title,
      image,
      description,
      rating,
      genres,
      publisher,
      bookmarked,
    };

    return info;
  }

  async getEpisode(episode) {
    // wait for auth
    await this.isInited;

    console.log('Crunchy: Loading episode ', episode.url);
    // load episode page
    const data = await request(episode.url);
    // cheerio
    const $ = cheerio.load(data);
    // available formats
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

    const xmlObj = await parseXml(xmlData);
    const preload = xmlObj['config:Config']['default:preload'][0];

    // try get subtitles from preload, if cant, episode is premium
    let subtitlesInfo;
    let err = null;
    try {
      subtitlesInfo = preload.subtitles[0].subtitle;
    } catch (e) {
      err = 'Failed to load episode';
      const errMessage = 'You are probably trying to load a premium episode not being logged-in !';
      console.log('Failed to load episode (episode is probably premium)');
      return {err, errMessage};
    }

    const streamInfo = preload.stream_info[0];
    const streamFile = streamInfo.file[0];

    // load stream urls playlist
    const streamFileData = await request(streamFile);
    const playlist = M3U.parse(streamFileData);

    // get preferred subtitles from db
    let preferredSub;
    try {
      const preferred = await db.settings.get('preferredSubtitles');
      preferredSub = preferred.title;
    } catch (e) {
      if (e.name == 'not_found') {
        preferredSub = null;
      }
    }

    // subtitles array
    let subtitles = [];
    for (const s of subtitlesInfo) {
      const sub = s.$;

      // checks if sub is preferred
      const defaultSub = sub.title.includes(preferredSub);

      const subData = await request(sub.link);
      const subsObj = await parseXml(subData);
      const subsId = parseInt(subsObj.subtitle.$.id, 10);
      const subsIv = subsObj.subtitle.iv.pop();
      const subsData = subsObj.subtitle.data.pop();

      const subBytes = await decode(subsId, subsIv, subsData);
      const subtitlesText = await bytesToAss(subBytes);
      const subBlob = new Blob([subtitlesText], {
        type: 'application/octet-binary',
      });

      const subtitle = {
        link: URL.createObjectURL(subBlob),
        label: sub.title.substring(sub.title.indexOf(']') + 2, sub.title.length),
        default: defaultSub,
      };

      // push to array
      subtitles.push(subtitle);
    }

    // final
    const url = playlist.pop().file;
    const type = 'application/x-mpegURL';

    return {url, type, subtitles, err};
  }

  async getMySeries() {
    await this.isInited;

    // not logged in
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
    // jar.setCookie(request.cookie(`c_locale=enUS`), baseURL);

    // request page html
    const data = await request({
      url: `${baseURL}/home/queue`,
      jar,
    });

    // cheerio cursor
    const $ = cheerio.load(data);
    // main contents
    const mainContent = $('#main_content');
    const items = $('li.queue-item', mainContent)
      .map((index, el) => {
        const element = $(el);
        //id for boomarking
        const bookmarkId = element.attr('series_id');
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
        const _id = seriesUrl;

        return {
          _id,
          bookmarkId,
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

    // remove series no longer bookmarked from db
    const dbItems = await db.bookmarkSeries.allDocs({
      include_docs: true,
    });
    if (dbItems.rows.length > items.length) {
      // deletes item no longer bookmakerd
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
          // get and delete no longer bookmarked
          const toBeDeleted = await db.bookmarkSeries.get(dbItem.id);
          await db.bookmarkSeries.remove(toBeDeleted);
        }
      });
    }

    // store in db
    await db.bookmarkSeries.bulkDocs(items);

    console.log('Crunchy: Queue', items);
    return items;
  }

  async search() {
    // force english language
    const jar = request.jar();
    jar.setCookie(request.cookie(`c_locale=enUS`), baseURL);

    // search catalogue
    const data = await request({
      url: `${baseURL}/ajax/?req=RpcApiSearch_GetSearchCandidates`,
      jar,
    });

    // data to json
    const lines = data.split('\n');
    const dataJson = lines[1];
    const catalogue = JSON.parse(dataJson);

    // series filter
    const series = catalogue.data.filter(it => it.type === 'Series');

    // source for search component
    const source = _.times(series.length, i => ({
      id: series[i].id,
      title: series[i].name,
      description: series[i].type,
      image: series[i].img,
      link: series[i].link,
    }));

    return source;
  }

  async bookmarkSeries(option = 1, id) {
    await this.isInited;

    // not logged in
    if (this.authCookies == null) {
      return;
    }

    // defines cookies
    const jar = request.jar();
    this.authCookies.cookies.forEach(data => {
      const cookie = request.cookie(`${data.name}=${data.value}`);
      jar.setCookie(cookie, `${baseURL}${data.path}`);
    });

    let options;
    if (option == 1) {
      // Add to bookmarks
      options = {
        method: 'POST',
        uri: 'https://www.crunchyroll.com/ajax/',
        jar,
        formData: {
          req: 'RpcApiUserQueue_Add',
          group_id: id,
        },
      };
    } else if (option == 2) {
      // Delete from bookmarks
      options = {
        method: 'POST',
        uri: 'https://www.crunchyroll.com/ajax/',
        jar,
        formData: {
          req: 'RpcApiUserQueue_Delete',
          group_id: id,
        },
      };
    }

    // Send request
    await request(options).then(response => {
      // Log response
      let jsonResponse = response.slice(10);
      jsonResponse = jsonResponse.substring(0, jsonResponse.length - 3);
      const jsonObject = JSON.parse(jsonResponse);

      console.log(jsonObject.message_list[0].type, ': ', jsonObject.message_list[0].message_body);
    });
  }
}

export default new Crunchyroll();
