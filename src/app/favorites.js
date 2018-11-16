//npm
import React from 'react';
import {Observable} from 'rxjs';
//db
import db from '../db';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//components
import Series from '../components/series';
//ui
import {Grid, Message, Icon} from 'semantic-ui-react';

export default class Favorites extends React.Component {
  constructor(props) {
    super(props);
    //loading
    this.isLoading = true;
    this.state = {
      series: [],
    };
  }

  componentDidMount() {
    this.sub = Observable.fromEvent(
      db.favorites.changes({
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
      .subscribe(series => this.setState({series}));
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const {series} = this.state;

    console.log(series);
    //if series is ready, ends loading..
    if (series.length > 0) {
      this.isLoading = false;
    }

    let home;
    //Default home screen
    if (!this.isLoading) {
      home = (
        <div>
          <div className="MainContent">
            <Grid columns="equal">
              <Grid.Row stretched>
                {series.map(s => <Series key={s._id} series={s} />)}
              </Grid.Row>
            </Grid>
          </div>
        </div>
      );
    }
    //Loading
    if (this.isLoading) {
      home = (
        <div>
          <div className="MainContent">
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>Loading Favorites..</Message.Header>
                Just one second!
              </Message.Content>
            </Message>
          </div>
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
