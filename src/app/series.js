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
import {Grid, Button, Icon, Message, Divider, Tab, Menu, Comment, Form, Header} from 'semantic-ui-react';

export default class Series extends React.Component {
  constructor(props) {
    super(props);
    this.series = null;
    this.episodesLenght = null;
    this.state = {
      episodes: [],
      comments: [],
      logedin: false,
      commentsPage: 1,
      commentsPageCanGoBack: false,
      noMoreComments: false,
      series: null,
      info: null,
      loading: true,
      loadingEpisodes: true,
      loadingComments: true,
      commentValue: '',
      commentFormLoading: false,
    };

    this.handleTextChange = this.handleTextChange.bind(this);
    this.postComment = this.postComment.bind(this);

    this.init(props);
  }

  async init(props) {
    // Series to show at loading
    this.series = props.location.state;

    // get series and if user is loged in
    const series = await this.getSeries(props);
    const logedin = Crunchyroll.authCookies != null;

    // get series info
    const info = await Crunchyroll.getInfo(series);
    if (this._isMounted) {
      this.setState({
        info: info,
        series: series,
        logedin: logedin,
      });
    }

    // get episodes and total episodes
    this.episodesLenght = await Crunchyroll.getEpisodes(series);

    // get comments
    const comments = await Crunchyroll.getComments(series._id, 1);

    if (this._isMounted) {
      if (comments == null) {
        this.setState({
          noMoreComments: true,
          loadingComments: false,
        });
      } else {
        this.setState({
          comments: comments,
          loadingComments: false,
          noMoreComments: false,
        });
      }
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
        loadingComments: true,
      });

      // get comments
      const comments = await Crunchyroll.getComments(series._id, commentsPage + 1);

      // checks if has more comments
      if (comments == null) {
        this.setState({
          loadingComments: false,
          noMoreComments: true,
          commentsPage: commentsPage + 1,
        });
      } else {
        this.setState({
          comments: comments,
          loadingComments: false,
          commentsPage: commentsPage + 1,
          noMoreComments: false,
        });
      }
    } else if (option == 0) {
      // previous page

      // loading
      this.setState({
        loadingComments: true,
      });

      // get comments
      const comments = await Crunchyroll.getComments(series._id, commentsPage - 1);

      this.setState({
        comments: comments,
        loadingComments: false,
        commentsPage: commentsPage - 1,
        noMoreComments: false,
      });
    }
  }

  handleTextChange(e, {name, value}) {
    this.setState({
      commentValue: value,
    });
  }

  async postComment() {
    const {commentValue, series} = this.state;

    // starts loading
    this.setState({
      commentFormLoading: true,
    });

    await Crunchyroll.postComment(series._id, commentValue);

    // ends loading and returns to first page
    this.setState({
      commentFormLoading: false,
      loadingComments: true,
      commentsPage: 1,
    });

    const comments = await Crunchyroll.getComments(series._id, 1);

    this.setState({
      commentValue: '',
      comments: comments,
      loadingComments: false,
      noMoreComments: false,
    });
  }

  render() {
    const {
      episodes,
      info,
      loading,
      loadingEpisodes,
      comments,
      loadingComments,
      commentsPageCanGoBack,
      noMoreComments,
      commentValue,
      commentFormLoading,
      logedin,
    } = this.state;
    const {history} = this.props;

    let title;
    if (this.series == undefined) {
      title = '';
    } else {
      title = this.series.title;
    }

    // episodes component
    const series = (
      <div>
        <Grid columns="equal">
          <Grid.Row stretched>
            {episodes.map(epi => <Episodes key={epi._id} episode={epi} />)}
          </Grid.Row>
        </Grid>
      </div>
    );

    // comment form component
    var commentsForm;
    if (logedin) {
      commentsForm = commentFormLoading
        ? <Form reply loading>
            <Form.TextArea />
            <FormattedMessage id="SeriesTab.PostComment" defaultMessage="Add Comment">
              {msg => <Form.Button content={msg} labelPosition="left" icon="edit" primary />}
            </FormattedMessage>
          </Form>
        : <Form reply onSubmit={this.postComment}>
            <Form.TextArea placeholder="..." value={commentValue} onChange={this.handleTextChange} />
            <FormattedMessage id="SeriesTab.PostComment" defaultMessage="Add Comment">
              {msg => <Form.Button content={msg} labelPosition="left" icon="edit" primary />}
            </FormattedMessage>
          </Form>;
    } else {
      commentsForm = (
        <Form reply>
          <Form.TextArea disabled />
          <FormattedMessage id="SeriesTab.PostComment" defaultMessage="Add Comment">
            {msg => <Form.Button content={msg} labelPosition="left" icon="edit" primary disabled />}
          </FormattedMessage>
        </Form>
      );
    }

    // comments tab component
    const commentsTab = (
      <div>
        <Comment.Group size="large">
          {noMoreComments
            ? <div>
                <span>
                  <FormattedMessage id="SeriesTab.NoMoreComments" name="comment" defaultMessage="No More Comments" />!
                </span>
              </div>
            : comments
                .filter(comment => comment != null)
                .map(comment => <CommentComponent key={comment.comment.id} commentData={comment} />)}
        </Comment.Group>

        <div>
          {logedin
            ? <Header as="h3">
                <FormattedMessage id="SeriesTab.PostCommentHeader" defaultMessage="Write a Comment..." />
              </Header>
            : <Header as="h3">
                <FormattedMessage id="SeriesTab.PostCommentDisabled" defaultMessage="Loggin to post Comments..." />
              </Header>}

          {commentsForm}

        </div>

        <div className="commentsTabButtons">
          {commentsPageCanGoBack
            ? <Button icon labelPosition="left" onClick={() => this.loadComments(0)}>
                <FormattedMessage id="SeriesTab.PreviousPage" defaultMessage="Previous Page" />
                <Icon name="left arrow" />
              </Button>
            : null}
          {noMoreComments
            ? null
            : <Button icon labelPosition="right" onClick={() => this.loadComments(1)}>
                <FormattedMessage id="SeriesTab.NextPage" defaultMessage="Next Page" />
                <Icon name="right arrow" />
              </Button>}
        </div>
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
