//npm
import React from 'react';
import {Observable} from 'rxjs';
import {Link} from 'react-router-dom';
//db
import db from '../db';
//api
import {Crunchyroll} from '../crunchyroll';
//components
import SeriesInfo from '../components/seriesinfo';
import Episodes from '../components/episodes';
//ui
import {Grid, Button, Icon, Message, Divider} from 'semantic-ui-react';

export default class Series extends React.Component {
  constructor(props) {
    super(props);
    this.isLoading = false;
    this.series = null;
    this.state = {
      episodes: [],
      info: null,
    };

    this.init(props);
  }

  async componentDidMount() {
    this._isMounted = true;

    //Series to filter
    const series = await this.getSeries(this.props);

    this.sub = Observable.fromEvent(
      db.episodes.changes({
        since: 0,
        live: true,
        include_docs: true,
      }),
      'change'
    )
      .filter(change => !change.deleted)
      .map(change => change.doc)
      .filter(doc => doc.series === series._id)
      .scan((acc, doc) => acc.concat([doc]), [])
      .debounceTime(1000)
      .subscribe(episodes => this.setState({episodes}));
  }

  componentWillUnmount() {
    this._isMounted = false;

    this.sub.unsubscribe();
  }

  async getSeries(props) {
    const {location} = props;
    let series = location.state;
    if (!series) {
      const {data} = await db.current.get('series');
      series = data;
    }
    return series;
  }

  async init(props) {
    //Series to show at loading
    this.series = this.props.location.state;
    //Starts Loading..
    this.isLoading = true;

    const series = await this.getSeries(props);
    await Crunchyroll.getEpisodes(series);

    const info = await Crunchyroll.getInfo(series);
    if (this._isMounted) {
      this.setState({
        info: info,
      });
    }
  }

  render() {
    const {episodes, info} = this.state;

    let title;
    if (this.series == undefined) {
      title = 'Episodes';
    } else {
      title = this.series.title;
    }

    //if episodes and info is ready, ends loading.
    if (episodes.length > 0 && info !== null) {
      this.isLoading = false;
    }

    let series;
    //Main series page
    if (!this.isLoading) {
      series = (
        <div>
          <SeriesInfo info={info} />
          <Divider horizontal>Episodes</Divider>
          <Grid columns="equal">
            <Grid.Row stretched>
              {episodes.map(epi => <Episodes key={epi._id} episode={epi} />)}
            </Grid.Row>
          </Grid>
        </div>
      );
    }
    //Loading..
    if (this.isLoading) {
      series = (
        <div>
          <Divider />
          <Message icon>
            <Icon name="circle notched" loading />
            <Message.Content>
              <Message.Header>Loading {title}</Message.Header>
              Just one second!
            </Message.Content>
          </Message>
        </div>
      );
    }
    return (
      <div>
        <Link to="/">
          <Button icon labelPosition="left" color="grey" className="button">
            <Icon name="arrow left" />
            Back
          </Button>
        </Link>
        {series}
      </div>
    );
  }
}
