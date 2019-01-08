//npm
import React from 'react';
import {Observable} from 'rxjs';
//localization
import {FormattedMessage} from 'react-intl';
//db
import db from '../db';
//Crunchyroll api
import {Crunchyroll} from '../crunchyroll';
//components
import Series from '../components/series';
//ui
import {Grid, Message, Icon} from 'semantic-ui-react';
import InfiniteScroll from 'react-infinite-scroller';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
    // location
    this.location = this.props.location;

    // Scroll
    this.currentPage = 0;
    this.startPage = 0;
    this.hasMoreItems = true;

    this.state = {
      series: [],
      loading: true,
    };

    this.init();

    // init list
    Crunchyroll.getAllSeries();
  }

  async init() {
    try {
      const current = await db.current.get('currentPage');
      this.startPage = current.data;
      this.currentPage = this.startPage;
    } catch (e) {
      if (e.status === 404) {
        return;
      }
    }
  }

  loadItems(page) {
    this.currentPage = page;
    // No more items after page 16
    if (page > 16) {
      this.hasMoreItems = false;
      return;
    }
    // get page
    Crunchyroll.getAllSeries(page);
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

  componentDidUpdate() {
    const {series, loading} = this.state;

    if (loading && series.length > 0) {
      this.setState({
        loading: false,
      });
    }
  }

  async componentWillUnmount() {
    this.sub.unsubscribe();

    // try to update current page in db
    try {
      await db.current.get('currentPage').then(async doc => {
        // update
        doc.data = this.currentPage;
        // put them back
        await db.current.put(doc);
      });
    } catch (e) {
      if (e.status === 404) {
        // theres no current page data, creates one
        await db.current.put({_id: 'currentPage', data: this.currentPage});
      }
    }
  }

  render() {
    const {series, loading} = this.state;

    return (
      <div>
        {loading
          ? <div className="MainContent">
              <div className="loader">
                <Message icon>
                  <Icon name="circle notched" loading />
                  <Message.Content>
                    <Message.Header>
                      <FormattedMessage id="Loading" defaultMessage="Loading" /> Crunchy
                    </Message.Header>
                    <FormattedMessage id="Loading.DefaultMessage" defaultMessage="Just one second!" />
                  </Message.Content>
                </Message>
              </div>
            </div>
          : <div className="MainContent">
              <InfiniteScroll
                pageStart={this.startPage}
                loadMore={this.loadItems.bind(this)}
                hasMore={this.hasMoreItems}
                loader={
                  <div className="scrollLoader" key={0}>
                    <h1><FormattedMessage id="Loading" defaultMessage="Loading" />...</h1>
                  </div>
                }
              >
                <div className="tracks">
                  <Grid columns="equal">
                    <Grid.Row stretched>
                      {series.map(s => <Series key={s._id} series={s} />)}
                    </Grid.Row>
                  </Grid>
                </div>
              </InfiniteScroll>
            </div>}
      </div>
    );
  }
}
