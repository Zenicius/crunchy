//npm
import React from 'react';
import {Observable} from 'rxjs';
//db
import db from '../db';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//components
import Navbar from '../components/navbar';
import BookmarkEpisodes from '../components/bookmarkedEpisodes';
//ui
import {Grid, Icon, Message} from 'semantic-ui-react';

export default class My extends React.Component {
  constructor(props) {
    super(props);
    this.isLoggedin = false;
    this.isLoading = false;
    this.location = this.props.location;
    this.state = {
      episodes: [],
    };

    this.init();
  }

  init() {
    //Checks if user is logged in
    if (Crunchyroll.authCookies !== null) {
      this.isLoggedin = true;
      this.isLoading = true;
    }
  }

  async componentDidMount() {
    this._isMounted = true;

    //List update and wait for changes(removed from bookmarked)
    await Crunchyroll.getMySeries();

    this.sub = Observable.fromEvent(
      db.bookmarkSeries.changes({
        since: 0,
        live: true,
        include_docs: true,
      }),
      'change'
    )
      .filter(change => !change.deleted)
      .map(change => change.doc)
      .scan((acc, doc) => acc.concat([doc]), [])
      .debounceTime(1000)
      .subscribe(episodes => this.subscribeState(episodes));
  }

  subscribeState(episodes) {
    if (this._isMounted) {
      this.setState({
        episodes: episodes,
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.sub !== undefined || null) {
      this.sub.unsubscribe();
    }
  }

  render() {
    //My episodes
    const {episodes} = this.state;

    //If episodes is ready ends loading
    if (episodes.length > 0) {
      this.isLoading = false;
    }

    let my;
    //Default My series screen
    if (!this.isLoading) {
      my = (
        <div>
          <Navbar location={this.location} />
          {episodes.map(epi => <BookmarkEpisodes key={epi._id} episode={epi} location={this.location} />)}
        </div>
      );
    }
    //Loading..
    if (this.isLoading) {
      my = (
        <div>
          <Navbar location={this.location} />
          <Message icon>
            <Icon name="circle notched" loading />
            <Message.Content>
              <Message.Header>Loading Your Series..</Message.Header>
              Just one second!
            </Message.Content>
          </Message>
        </div>
      );
    }
    //not logged in
    if (!this.isLoggedin) {
      my = (
        <div>
          <Navbar location={this.location} />
          <Message negative icon>
            <Icon name="info" />
            <Message.Content>
              <Message.Header>You are not logged-in!</Message.Header>
              Go to settings page to peform login..
            </Message.Content>
          </Message>
        </div>
      );
    }

    return (
      <div>
        {my}
      </div>
    );
  }
}
