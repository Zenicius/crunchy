//npm
import React from 'react';
import {Observable} from 'rxjs';
//localization
import {FormattedMessage} from 'react-intl';
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

  async init(props) {
    // Series to show at loading
    this.series = props.location.state;
    // Starts Loading..
    this.isLoading = true;

    // get series
    const series = await this.getSeries(props);
    await Crunchyroll.getEpisodes(series);

    // get series info
    const info = await Crunchyroll.getInfo(series);
    if (this._isMounted) {
      this.setState({
        info: info,
      });
    }
  }

  async componentDidMount() {
    this._isMounted = true;

    // Series to filter
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

  render() {
    const {episodes, info} = this.state;
    const {history} = this.props;

    let title;
    if (this.series == undefined) {
      title = '';
    } else {
      title = this.series.title;
    }

    // if episodes and info is ready, ends loading.
    if (episodes.length > 0 && info !== null) {
      this.isLoading = false;
    }

    let series;
    // Main series page
    if (!this.isLoading) {
      series = (
        <div>
          <SeriesInfo info={info} />
          <Divider horizontal><FormattedMessage id="Series.Episodes" defaultMessage="Episodes" /></Divider>
          <Grid columns="equal">
            <Grid.Row stretched>
              {episodes.map(epi => <Episodes key={epi._id} episode={epi} />)}
            </Grid.Row>
          </Grid>
        </div>
      );
    }
    // Loading..
    if (this.isLoading) {
      series = (
        <div>
          <Divider />
          <Message icon>
            <Icon name="circle notched" loading />
            <Message.Content>
              <Message.Header><FormattedMessage id="Loading" defaultMessage="Loading" /> {title}</Message.Header>
              <FormattedMessage id="Loading.DefaultMessage" defaultMessage="Just one second!" />
            </Message.Content>
          </Message>
        </div>
      );
    }
    return (
      <div>
        <Button href="#back" icon labelPosition="left" color="grey" className="button" onClick={() => history.goBack()}>
          <Icon name="arrow left" />
          <FormattedMessage id="Button.Back" defaultMessage="Back" />
        </Button>
        {series}
      </div>
    );
  }
}
