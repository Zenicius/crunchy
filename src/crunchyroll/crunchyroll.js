//npm
import request from 'request-promise-native';
import cheerio from 'cheerio';
import {M3U} from 'playlist-parser';
import electron from 'electron';
import _ from 'lodash';
import he from 'he';
//db
import db from '../db';
//subtitles
import parseXml from './parseXml';
import decode from './subtitles';
import bytesToAss from './subtitles/ass';
//preferences
import Preferences from '../localization/preferences';

// URL
const baseURL = 'https://www.crunchyroll.com';

// API
class Crunchyroll {
  constructor() {
    this.authCookies = null;
    this.forceLanguage = null;
    this.saveUser = null;
    this.language = null;
    this.isInited = this.init();
  }

  async init() {
    if (this.authCookies && this.forceLanguage && this.saveUser) {
      return;
    }

    // preferences, get language
    const preferences = new Preferences();
    var lang = preferences.get('lang');
    if (lang == 'pt') {
      lang += 'BR';
    } else
      lang += 'US';

    this.language = lang;

    // load auth and settings
    try {
      this.authCookies = await db.auth.get('crunchyroll');
    } catch (e) {
      if (e.name === 'not_found') {
        this.authCookies = null;
      }
    }

    try {
      const settings = await db.settings.get('settings');
      this.forceLanguage = settings.toggleforce;
      this.saveUser = settings.togglesave;
    } catch (e) {
      if (e.name === 'not_found') {
        this.forceLanguage = true;
        this.saveUser = true;
      }
    }
  }

  async updateSettings() {
    // update lang
    const preferences = new Preferences();
    var lang = preferences.get('lang');
    if (lang == 'pt') {
      lang += 'BR';
    } else
      lang += 'US';

    this.language = lang;

    // update force language
    try {
      const settings = await db.settings.get('settings');
      this.forceLanguage = settings.toggleforce;
      this.saveUser = settings.togglesave;
    } catch (e) {
      if (e.name === 'not_found') {
        this.forceLanguage = true;
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

          if (this.saveUser) {
            await db.auth.put({_id: 'crunchyroll', cookies: this.authCookies});
            this.authCookies = await db.auth.get('crunchyroll');
          } else {
            await db.current.put({_id: 'crunchyroll', cookies: this.authCookies});
            this.authCookies = await db.current.get('crunchyroll');
          }

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
    // Remove cookies from db
    try {
      await db.auth.remove(this.authCookies);
    } catch (e) {
      await db.current.remove(this.authCookies);
    }
    this.authCookies = null;

    // remover user from db
    const user = await db.current.get('user');
    await db.current.remove(user);
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

    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

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
    const premiumStar = $('img.cr-star-tiny').attr('title');

    var premium;
    if (premiumStar == undefined) {
      premium = false;
    } else {
      premium = true;
    }

    const user = {
      link,
      name,
      image,
      premium,
    };

    // store in db
    await db.current.put({_id: 'user', link: user.link, name: user.name, image: user.image, premium: user.premium});

    return user;
  }

  async getAllSeries(page = 0) {
    // wait for auth
    await this.isInited;

    // load home series
    console.log('Crunchy: Getting popular series');

    // cookies
    const jar = request.jar();
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // get page
    const data = await request({
      url: `${baseURL}/videos/anime/popular/ajax_page?pg=${page}`,
      jar,
    });

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

    // cookies
    const jar = request.jar();
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    let hasMorePages = true;
    let page = 0;

    // load series while theres more pages
    while (hasMorePages) {
      // get page
      const url = `${baseURL}/videos/anime/genres/ajax_page?pg=${page}&tagged=${genre}`;
      const data = await request({
        url: url,
        jar,
      });

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

    // cookies
    const jar = request.jar();
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // load episodes
    const data = await request({
      url: url,
      jar,
    });

    // cheerio cursor
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

        // unique season or no seasons
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

    return episodes.length;
  }

  async getInfo(series) {
    // wait for auth
    await this.isInited;

    // this series url
    const url = `${baseURL}${series._id}`;

    console.log('Crunchy: Getting info for ', url);

    // cookies
    const jar = request.jar();
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // Loads data
    const data = await request({
      url: url,
      jar,
    });

    // cheerio cursor
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

    // series info
    const info = {
      link: series._id,
      title,
      image,
      description,
      rating,
      genres,
      publisher,
    };

    return info;
  }

  async getEpisode(episode) {
    // wait for auth
    await this.isInited;

    console.log('Crunchy: Loading episode ', episode.url);

    // cookies
    const jar = request.jar();
    if (this.authCookies !== null) {
      this.authCookies.cookies.forEach(data => {
        const cookie = request.cookie(`${data.name}=${data.value}`);
        jar.setCookie(cookie, `${baseURL}${data.path}`);
      });
    }
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // load episode page
    const data = await request({
      url: episode.url,
      jar,
    });

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
    let err = false;
    try {
      subtitlesInfo = preload.subtitles[0].subtitle;
    } catch (e) {
      err = true;
      return {err};
    }

    const streamInfo = preload.stream_info[0];
    const streamFile = streamInfo.file[0];

    // load stream urls playlist
    const streamFileData = await request(streamFile);
    const playlist = M3U.parse(streamFileData);

    // get preferred subtitles from db
    let preferredSub;
    try {
      const settings = await db.settings.get('settings');
      preferredSub = settings.preferredsubtitlestitle;
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

  async getComments(series, page = 1) {
    console.log('Crunchy: getting comments for ', series, 'page: ', page);

    // cookies
    const jar = request.jar();
    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // request comments data
    const data = await request({
      url: `https://www.crunchyroll.com${series}/discussions/page${page}`,
      jar,
    });

    // cheerio cursor
    const $ = cheerio.load(data);

    // comments data depending on page
    var commentsData = $('#showview_content_comments').text().trim();
    if (page == 1) {
      const start = () => {
        return commentsData.indexOf('var pagedata =') + 15;
      };

      const end = () => {
        return commentsData.lastIndexOf('];') + 1;
      };

      commentsData = commentsData.substring(start(), end());
    }

    const shouldReturnNull = commentsData.substring(0, 1) != '[';

    if (shouldReturnNull) {
      return null;
    } else {
      var comments = JSON.parse(commentsData);
      comments.forEach(comment => {
        if (comment == null) return;
        comment.comment.body = he.unescape(comment.comment.body);
      });
      return comments;
    }
  }

  async postComment(series, body) {
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

    if (this.forceLanguage) {
      jar.setCookie(request.cookie(`c_locale=${this.language}`), baseURL);
    }

    // data to get id, token etc.
    const data = await request({
      url: `https://www.crunchyroll.com${series}/discussions`,
      jar,
    });

    // cheerio cursor
    const $ = cheerio.load(data);

    // container
    const contentsContainer = $('div.contents');
    // get series id
    const spoiler = $('input[name="spoiler"]', contentsContainer).attr('id');
    const id = spoiler.substring(spoiler.lastIndexOf('_') + 1, spoiler.length);
    // token, last comment time and mugsize from input
    const token = $('input[name="origin_token"]', contentsContainer).attr('value');
    const lastCommentTime = $('input[name="last_comment_time"]', contentsContainer).attr('value');
    const mugsize = $('input[name="mugsize"]', contentsContainer).attr('value');

    // options for request
    const options = {
      method: 'POST',
      uri: 'https://www.crunchyroll.com/ajax/',
      jar,
      formData: {
        req: 'RpcApiGuestbook_AddComment',
        comment_body: body,
        guestbook_id: id,
        last_comment_time: lastCommentTime,
        mugsize: mugsize,
        origin_token: token,
      },
    };

    await request(options).then(response => {
      const formatedResponse = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1);
      const responseObj = JSON.parse(formatedResponse);

      console.log(
        'Crunchy: Status Code:',
        responseObj.result_code,
        'Result:',
        responseObj.message_list[0].type,
        responseObj.message_list[0].message_body
      );

      return responseObj;
    });
  }
}

export default new Crunchyroll();
