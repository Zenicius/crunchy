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
    this.location = this.props.location;
    this.state = {
      episodes: [],
    };
  }

  async componentDidMount() {
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
      .subscribe(episodes => this.setState({episodes}));
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    //My episodes
    const {episodes} = this.state;

    //Default My series screen
    let home = (
      <div>
        <Navbar location={this.location} />
        <Grid>
          <Grid.Row stretched>
            {episodes.map(epi => <BookmarkEpisodes key={epi._id} episode={epi} />)}
          </Grid.Row>
        </Grid>
      </div>
    );
    //not logged in
    if (Crunchyroll.authCookies == null) {
      home = (
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
        {home}
      </div>
    );
  }
}
