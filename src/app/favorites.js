//npm
import React from 'react';
import {Observable} from 'rxjs';
//localization
import {FormattedMessage} from 'react-intl';
//db
import db from '../db';
//components
import FavoritedSeries from '../components/favoritedSeries';
//ui
import {Grid, Message, Icon} from 'semantic-ui-react';

export default class Favorites extends React.Component {
  constructor(props) {
    super(props);
    //loading
    this.state = {
      series: [],
      seriesCount: null,
      isEmpty: false,
      loading: true,
    };

    this.checkEmpty();
  }

  checkEmpty() {
    db.favorites.info().then(result => {
      if (result.doc_count === 0) {
        this.setState({
          isEmpty: true,
        });
      } else {
        this.setState({
          isEmpty: false,
          seriesCount: result.doc_count,
        });
      }
    });
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

  componentDidUpdate() {
    const {series, seriesCount, isEmpty, loading} = this.state;
    // ends loading
    if ((series.length == seriesCount || isEmpty) && loading) {
      this.setState({
        loading: false,
      });
    }
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const {series, isEmpty, loading} = this.state;

    if (loading) {
      return (
        <div>
          <div className="MainContent">
            <Message icon>
              <Icon name="circle notched" loading />
              <Message.Content>
                <Message.Header>
                  <FormattedMessage id="Loading.Favorites" defaultMessage="Loading Favorites.." />
                </Message.Header>
                <FormattedMessage id="Loading.DefaultMessage" defaultMessage="Just one second!" />
              </Message.Content>
            </Message>
          </div>
        </div>
      );
    } else {
      return (
        <div>
          {isEmpty
            ? <div className="MainContent">
                <Message warning icon>
                  <Icon name="info" />
                  <Message.Content>
                    <Message.Header>
                      <FormattedMessage id="Warning.FavoritesEmpty" defaultMessage="Favorites is Empty.." />
                    </Message.Header>
                    <FormattedMessage
                      id="Warning.FavoritesEmptyMessage"
                      defaultMessage="Add series to your favorites before coming here!"
                    />
                  </Message.Content>
                </Message>
              </div>
            : <div className="MainContent">
                <Grid columns="equal">
                  <Grid.Row stretched>
                    {series.map(s => <FavoritedSeries key={s._id} series={s} />)}
                  </Grid.Row>
                </Grid>
              </div>}
        </div>
      );
    }
  }
}
