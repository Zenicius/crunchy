//npm
import React from 'react';
//api
import {Crunchyroll} from '../../crunchyroll';
//ui
import {Image, Header, Rating, Button, Icon} from 'semantic-ui-react';

export default class SeriesInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: this.props.info,
      bookmarked: this.props.info.bookmarked,
      loading: false,
    };

    this.bookmark = this.bookmark.bind(this);
  }

  //Bookmark or Remove
  async bookmark() {
    //Not logged-in
    if (this.state.bookmarked == null) return;

    //triggers loading
    this.setState({
      loading: true,
    });
    if (this.state.bookmarked == true) {
      //bookmarked, remove from queue
      await Crunchyroll.bookmarkSeries(2, this.state.info.id);
      this.setState({
        bookmarked: false,
        loading: false,
      });
    } else if (this.state.bookmarked == false) {
      //not bookmarked, adds to queue
      await Crunchyroll.bookmarkSeries(1, this.state.info.id);
      this.setState({
        bookmarked: true,
        loading: false,
      });
    }
  }

  render() {
    const info = this.state.info;

    // if theres genres tags, organize it
    let genres = '';
    if (info.genres[0] !== undefined) {
      genres = ' - ';
      this.state.info.genres.forEach(function(element, index) {
        if (index == info.genres.length - 1) {
          genres += element;
        } else {
          genres += element + ' / ';
        }
      });
    }

    //Switch Bookmark button
    let bookmarkButton;
    if (this.state.loading == true) {
      bookmarkButton = <Button loading>Loading</Button>;
    } else if (this.state.bookmarked == true) {
      //Bookmarked (option to remove)
      bookmarkButton = (
        <Button className="infoBookmarkButton" icon labelPosition="left" color="grey">
          <Icon name="remove" />
          Remove from series
        </Button>
      );
    } else if (this.state.bookmarked == false) {
      //Not bookmarked (option to add)
      bookmarkButton = (
        <Button className="infoBookmarkButton" icon labelPosition="left" color="red">
          <Icon name="heart" />
          Add to series
        </Button>
      );
    } else if (this.state.bookmarked == null) {
      //Not logged in (disabled)
      bookmarkButton = (
        <Button className="infoBookmarkButton" disabled icon labelPosition="left" color="red">
          <Icon name="heart" />
          Add to series
        </Button>
      );
    }

    return (
      <div className="infoContainer">
        <Image className="infoImage" size="medium" src={info.image} />
        <div className="info">
          <Header className="infoHeader" as="h1">{info.title}</Header>
          <Header className="infoPublisher" as="h4">{info.publisher}{genres}</Header>
          <div className="infoDescriptionContainer">
            <p className="infoDescription">{info.description}</p>
            <Rating className="infoRating" defaultRating={info.rating} maxRating={5} disabled />
          </div>
          <div className="infoButtonContainer" onClick={this.bookmark}>
            {bookmarkButton}
          </div>
        </div>
      </div>
    );
  }
}
