//npm
import React from 'react';
import {Observable} from 'rxjs';
import {Link} from 'react-router-dom';
//db
import db from '../db';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//components
import BookmarkEpisodes from '../components/bookmarkedEpisodes';
//ui
import {Grid, Button, Icon, Message} from 'semantic-ui-react';

export default class My extends React.Component {
  constructor() {
    super();
    this.state = {
      episodes: [],
    };
    //List update
    Crunchyroll.getMySeries();
  }

  componentDidMount() {
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
    const {episodes} = this.state;

    //Default My series screen
    let home = (
      <div>
        <Link to="/">
          <Button icon labelPosition="left" color="grey" className="button">
            <Icon name="arrow left" />
            Back
          </Button>
        </Link>
        <Grid>
          <Grid.Row stretched>
            {episodes.map(epi => <BookmarkEpisodes key={epi._id} episode={epi} />)}
          </Grid.Row>
        </Grid>
      </div>
    );
    //Loading
    if (Crunchyroll.isLoading) {
      home = (
        <div>
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

    return (
      <div>
        {home}
      </div>
    );
  }
}
