//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//api
import {Crunchyroll} from '../../crunchyroll';
//db
import db from '../../db';
//ui
import {Header, Image, Button, Divider, Loader} from 'semantic-ui-react';

class BookmarkedEpisode extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
    this.state = {
      episode: this.props.episode,
      deleted: false,
      loading: false,
    };

    this.openEpisode = this.openEpisode.bind(this);
    this.openSeries = this.openSeries.bind(this);
    this.remove = this.remove.bind(this);
    this.undo = this.undo.bind(this);
  }

  //Open Episode
  async openEpisode() {
    const baseURL = 'https://www.crunchyroll.com';
    const id = this.state.episode._id.substring(0, this.state.episode._id.indexOf('?'));
    const formatedEpisode = {
      url: `${baseURL}${id}`,
    };
    const location = {
      pathname: `/episode${this.state.episode._id}`,
      state: formatedEpisode,
    };
    this.history.push(location);
  }

  //Open series page
  async openSeries() {
    const baseURL = 'https://www.crunchyroll.com';
    const formatedSeries = {
      url: `${baseURL}${this.state.episode.seriesUrl}`,
      title: this.state.episode.seriesTitle,
      _id: this.state.episode.seriesUrl,
    };
    const location = {
      pathname: `/series${this.state.episode.seriesUrl}`,
      state: formatedSeries,
    };
    //Store at current db to return after
    try {
      const doc = await db.current.get('series');
      const update = {
        _id: 'series',
        data: formatedSeries,
      };
      if (doc) {
        update._rev = doc._rev;
      }
      await db.current.put(update);
    } catch (e) {
      if (e.status === 404) {
        await db.current.put({_id: 'series', data: formatedSeries});
      }
    }
    this.history.push(location);
  }

  //remove from bookmarked
  async remove() {
    //start loading
    this.setState({
      loading: true,
    });
    //remove
    await Crunchyroll.bookmarkSeries(2, this.state.episode.bookmarkId);
    //set states
    this.setState({
      deleted: true,
      loading: false,
    });
  }

  //undo remove
  async undo() {
    //start loading
    this.setState({
      loading: true,
    });
    //undo
    await Crunchyroll.bookmarkSeries(1, this.state.episode.bookmarkId);
    //set states
    this.setState({
      deleted: false,
      loading: false,
    });
  }

  render() {
    const episode = this.state.episode;

    let be;
    if (!this.state.deleted && !this.state.loading) {
      be = (
        <div>
          <div className="BEContainer">
            <Image className="BEImage" size="small" src={episode.image} />
            <div className="BE">
              <Header className="BETitle" as="h2">{episode.seriesTitle}</Header>
              <Header className="BENext" as="h4">{episode.seriesNext}</Header>
              <div className="BEDescriptionContainer">
                <p className="BEDescription">{episode.description}</p>
              </div>
              <div className="BEButtonContainer">
                <Button basic color="green" onClick={this.openEpisode}>
                  Watch
                </Button>
                <Button basic color="blue" onClick={this.openSeries}>
                  Series Page
                </Button>
                <Button className="BEremoveButton" basic color="red" onClick={this.remove}>
                  Remove
                </Button>
              </div>
            </div>
          </div>
          <Divider />
        </div>
      );
    } else if (this.state.deleted && !this.state.loading) {
      be = (
        <div>
          <div className="BEContainer">
            <div className="BE">
              <Header className="BENext" as="h4">Removed: {episode.seriesTitle}</Header>
              <div className="BEButtonContainer">
                <Button className="BEremoveButton" basic color="green" onClick={this.undo}>
                  Undo
                </Button>
              </div>
            </div>
          </div>
          <Divider />
        </div>
      );
    } else if (this.state.loading) {
      be = (
        <div>
          <div className="BELoading">
            <div className="BE">
              <Loader active inline="centered" />
            </div>
          </div>
          <Divider />
        </div>
      );
    }

    return be;
  }
}

export default withRouter(BookmarkedEpisode);
