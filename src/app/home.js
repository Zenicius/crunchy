//npm
import React from 'react';
import {Observable} from 'rxjs';
import {Link} from 'react-router-dom';
//db
import db from '../db';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//components
import Series from '../components/series';
//ui
import {Grid, Button, Icon, Message} from 'semantic-ui-react';

export default class Home extends React.Component {
  constructor() {
    super();
    this.state = {
      series: [],
    };

    //get all pages from series
    var i;
    for (i = 0; i <= 16; i++) {
      Crunchyroll.getAllSeries(i);
    }
  }
  componentDidMount() {
    this.sub = Observable.fromEvent(
      db.series.changes({
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

    //Default home screen
    let home = (
      <div>
        <Link to="/my">
          <Button icon labelPosition="left" color="grey" className="button">
            <Icon name="star" />
            My Series
          </Button>
        </Link>
        <Link to="/settings">
          <Button icon labelPosition="left" color="grey" className="button">
            <Icon name="setting" />
            Settings
          </Button>
        </Link>
        <Grid columns="equal">
          <Grid.Row stretched>
            {series.map(s => <Series key={s._id} series={s} />)}
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
              <Message.Header>Loading Crunchy..</Message.Header>
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
