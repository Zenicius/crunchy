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
import CommentComponent from '../components/comment';
//ui
import {Grid, Button, Icon, Message, Divider, Tab, Menu, Comment} from 'semantic-ui-react';

export default class Series extends React.Component {
  constructor(props) {
    super(props);
    this.series = null;
    this.episodesLenght = null;
    this.state = {
      episodes: [],
      comments: [],
      commentsPage: 1,
      commentsPageCanGoBack: false,
      series: null,
      info: null,
      loading: true,
      loadingEpisodes: true,
      loadingComments: true,
    };

    this.init(props);
  }

  async init(props) {
    // Series to show at loading
    this.series = props.location.state;

    // get series
    const series = await this.getSeries(props);

    // get series info
    const info = await Crunchyroll.getInfo(series);
    if (this._isMounted) {
      this.setState({
        info: info,
        series: series,
      });
    }

    // get episodes and total episodes
    this.episodesLenght = await Crunchyroll.getEpisodes(series);

    // get comments
    const comments = await Crunchyroll.getComments(series._id, 1);
    this.setState({
      comments: comments,
      loadingComments: false,
    });
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

  componentDidUpdate() {
    const {info, loading, episodes, loadingEpisodes, commentsPage, commentsPageCanGoBack} = this.state;

    // ends loading
    if (info != null && loading) {
      this.setState({
        loading: false,
      });
    }

    if (episodes.length == this.episodesLenght && loadingEpisodes) {
      this.setState({
        loadingEpisodes: false,
      });
    }

    // determines if comments page can go back
    if (commentsPage > 1 && !commentsPageCanGoBack) {
      this.setState({
        commentsPageCanGoBack: true,
      });
    } else if (commentsPage <= 1 && commentsPageCanGoBack) {
      this.setState({
        commentsPageCanGoBack: false,
      });
    }
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

  async loadComments(option) {
    const {series, commentsPage} = this.state;

    // next page
    if (option == 1) {
      // loading
      this.setState({
        loadComments: true,
      });

      const comments = await Crunchyroll.getComments(series._id, commentsPage + 1);
      this.setState({
        comments: comments,
        loadComments: false,
        commentsPage: commentsPage + 1,
      });
    } else if (option == 0) {
      // previous page

      // loading
      this.setState({
        loadComments: true,
      });

      const comments = await Crunchyroll.getComments(series._id, commentsPage - 1);
      this.setState({
        comments: comments,
        loadComments: false,
        commentsPage: commentsPage - 1,
      });
    }
  }

  render() {
    const {episodes, info, loading, loadingEpisodes, comments, loadingComments, commentsPageCanGoBack} = this.state;
    const {history} = this.props;

    let title;
    if (this.series == undefined) {
      title = '';
    } else {
      title = this.series.title;
    }

    const series = (
      <div>
        <Grid columns="equal">
          <Grid.Row stretched>
            {episodes.map(epi => <Episodes key={epi._id} episode={epi} />)}
          </Grid.Row>
        </Grid>
      </div>
    );

    const commentsTab = (
      <div>
        <Comment.Group size="large">
          {comments.map(comment => <CommentComponent key={comment.comment.id} commentData={comment} />)}
        </Comment.Group>
        {commentsPageCanGoBack
          ? <Button icon labelPosition="left" onClick={() => this.loadComments(0)}>
              Previous Page
              <Icon name="left arrow" />
            </Button>
          : null}
        <Button icon labelPosition="right" onClick={() => this.loadComments(1)}>
          Next Page
          <Icon name="right arrow" />
        </Button>
      </div>
    );

    // tabs
    const panes = [
      {
        menuItem: (
          <Menu.Item key="episodes">
            <FormattedMessage id="SeriesTab.Episodes" defaultMessage="Episodes" />
          </Menu.Item>
        ),
        render: () => loadingEpisodes ? <Tab.Pane loading /> : <Tab.Pane>{series}</Tab.Pane>,
      },
      {
        menuItem: (
          <Menu.Item key="comments">
            <FormattedMessage id="SeriesTab.Comments" defaultMessage="Comments" />
          </Menu.Item>
        ),
        render: () => loadingComments ? <Tab.Pane loading /> : <Tab.Pane>{commentsTab}</Tab.Pane>,
      },
      {
        menuItem: (
          <Menu.Item key="reviews">
            <FormattedMessage id="SeriesTab.Reviews" defaultMessage="Reviews" />
          </Menu.Item>
        ),
        render: () => <Tab.Pane>SOON</Tab.Pane>,
      },
    ];

    return (
      <div>
        <Button href="#back" icon labelPosition="left" color="grey" className="button" onClick={() => history.goBack()}>
          <Icon name="arrow left" />
          <FormattedMessage id="Button.Back" defaultMessage="Back" />
        </Button>
        {loading
          ? <div>
              <Divider />
              <Message icon>
                <Icon name="circle notched" loading />
                <Message.Content>
                  <Message.Header><FormattedMessage id="Loading" defaultMessage="Loading" /> {title}</Message.Header>
                  <FormattedMessage id="Loading.DefaultMessage" defaultMessage="Just one second!" />
                </Message.Content>
              </Message>
            </div>
          : <div>
              <SeriesInfo info={info} />
              <Tab className="seriesTab" panes={panes} />
            </div>}
      </div>
    );
  }
}
