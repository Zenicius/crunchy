//npm
import React from 'react';
import {Observable} from 'rxjs';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//db
import db from '../db';
//components
import Series from '../components/series';
//ui
import {Grid, Message, Icon} from 'semantic-ui-react';

export default class Genres extends React.Component {
  constructor(props) {
    super(props);
    // loading
    this.isLoading = false;
    // currente genre
    this.value = this.props.location.value;
    this.state = {
      series: [],
    };

    this.init(true);
  }

  init(justMounted) {
    // Load series
    Crunchyroll.getAllSeriesGenre(this.value);
    // starts loading
    this.isLoading = true;

    // comparator to sort series
    const compare = (a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    };

    // update series
    if (!justMounted) {
      this.sub.unsubscribe();

      this.sub = Observable.fromEvent(
        db.genres.changes({
          since: 0,
          live: true,
          include_docs: true,
        }),
        'change'
      )
        .filter(change => !change.deleted)
        .map(change => change.doc)
        .filter(doc => doc.genre === this.value)
        .scan((acc, doc) => acc.concat([doc]), [])
        .map(series => series.sort(compare))
        .debounceTime(1000)
        .subscribe(series => this.setState({series}));
    }
  }

  componentDidMount() {
    // comparator to sort series
    const compare = (a, b) => {
      if (a.title < b.title) return -1;
      if (a.title > b.title) return 1;
      return 0;
    };

    this.sub = Observable.fromEvent(
      db.genres.changes({
        since: 0,
        live: true,
        include_docs: true,
      }),
      'change'
    )
      .filter(change => !change.deleted)
      .map(change => change.doc)
      .filter(doc => doc.genre === this.value)
      .scan((acc, doc) => acc.concat([doc]), [])
      .map(series => series.sort(compare))
      .debounceTime(1000)
      .subscribe(series => this.setState({series}));
  }

  componentDidUpdate() {
    // updates current genre
    if (this.props.location.value != this.value) {
      this.value = this.props.location.value;

      // reset series
      this.setState({
        series: [],
      });

      this.init(false);
    }
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const {series} = this.state;
    const currentGenre = this.value;

    // if series is ready, ends loading..
    if (series.length > 0) {
      this.isLoading = false;
    }

    let home;
    // Default home screen
    if (!this.isLoading) {
      home = (
        <div>
          <div className="MainContent">
            <div className="tracks">
              <Grid columns="equal">
                <Grid.Row stretched>
                  {series.map(s => <Series key={s._id} series={s} />)}
                </Grid.Row>
              </Grid>
            </div>
          </div>
        </div>
      );
    }
    // Loading
    if (this.isLoading) {
      home = (
        <div>
          <div className="MainContent">
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>Loading {currentGenre}..</Message.Header>
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
