//npm
import React from 'react';
//api
import {Crunchyroll} from '../../crunchyroll';
//db
import db from '../../db';
//ui
import {Image, Header, Rating, Button, Icon} from 'semantic-ui-react';

export default class SeriesInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      info: this.props.info,
      bookmarked: this.props.info.bookmarked,
      favorited: false,
      loadingBookmark: false,
      loadingFavorited: false,
    };

    this.bookmark = this.bookmark.bind(this);
    this.favorite = this.favorite.bind(this);
  }

  async componentDidMount() {
    const info = this.state.info;

    // checks if series is favorited
    try {
      const favorite = await db.favorites.get(info.link);
      if (favorite) {
        this.setState({
          favorited: true,
        });
      }
    } catch (e) {
      if (e.status == 404) {
        this.setState({
          favorited: false,
        });
      }
    }
  }

  // Bookmark or Remove
  async bookmark() {
    // Not logged-in
    if (this.state.bookmarked == null) return;

    // triggers loading
    this.setState({
      loadingBookmark: true,
    });
    if (this.state.bookmarked == true) {
      // bookmarked, remove from queue
      await Crunchyroll.bookmarkSeries(2, this.state.info.id);
      this.setState({
        bookmarked: false,
        loadingBookmark: false,
      });
    } else if (this.state.bookmarked == false) {
      // not bookmarked, adds to queue
      await Crunchyroll.bookmarkSeries(1, this.state.info.id);
      this.setState({
        bookmarked: true,
        loadingBookmark: false,
      });
    }
  }

  // Favorite or remove
  async favorite() {
    const {info, favorited} = this.state;

    const serie = {
      _id: info.link,
      title: info.title,
      image: info.image,
    };

    // triggers loading..
    this.setState({
      loadingFavorited: true,
    });

    // favorite or remove series
    if (!favorited) {
      await db.favorites.put(serie);
      this.setState({
        favorited: true,
        loadingFavorited: false,
      });
      console.log('Crunchy: favorited ', serie.title);
    } else if (favorited) {
      const toBeRemoved = await db.favorites.get(info.link);
      await db.favorites.remove(toBeRemoved);
      this.setState({
        favorited: false,
        loadingFavorited: false,
      });
      console.log('Crunchy: removed from favorites ', serie.title);
    }
  }

  render() {
    const info = this.state.info;

    // if theres genres tags, organize it
    let genres = '';
    let genresContainer;
    if (info.genres[0] !== undefined) {
      this.state.info.genres.forEach(function(element, index) {
        if (index == info.genres.length - 1) {
          genres += element;
        } else {
          genres += element + ' / ';
        }
      });
      genresContainer = <Header className="infoGenres" as="h4">Genres: {genres}</Header>;
    } else
      genresContainer = null;

    //Switch Bookmark button
    let bookmarkButton;
    if (this.state.loadingBookmark) {
      bookmarkButton = <Button loading>Loading</Button>;
    } else if (this.state.bookmarked && !this.state.loadingBookmark) {
      //Bookmarked (option to remove)
      bookmarkButton = (
        <Button className="infoBookmarkButton" icon labelPosition="left" onClick={this.bookmark}>
          <Icon name="list ol" />
          Remove
        </Button>
      );
    } else if (!this.state.bookmarked && !this.state.loadingBookmark) {
      //Not bookmarked (option to add)
      bookmarkButton = (
        <Button className="infoBookmarkButton" icon labelPosition="left" onClick={this.bookmark}>
          <Icon name="list ol" />
          Queue
        </Button>
      );
    } else if (this.state.bookmarked == null) {
      //Not logged in (disabled)
      bookmarkButton = (
        <Button className="infoBookmarkButton" disabled icon labelPosition="left" onClick={this.bookmark}>
          <Icon name="list ol" />
          Queue
        </Button>
      );
    }

    // Switch favorite button
    let favoriteButtton;
    if (this.loadingFavorited) {
      // loading
      favoriteButtton = <Button loading>Loading</Button>;
    } else if (!this.state.favorited && !this.loadingFavorited) {
      // not favorited (option to add)
      favoriteButtton = (
        <Button className="infoFavoriteButton" icon labelPosition="left" onClick={this.favorite}>
          <Icon name="heart outline" />
          Favorite
        </Button>
      );
    } else if (this.state.favorited && !this.loadingFavorited) {
      // favorited (option to remove)
      favoriteButtton = (
        <Button className="infoFavoriteButton" icon labelPosition="left" onClick={this.favorite}>
          <Icon name="heart" />
          Remove
        </Button>
      );
    }

    return (
      <div className="infoContainer">
        <Image className="infoImage" size="medium" src={info.image} />
        <div className="info">
          <Header className="infoHeader" as="h1">{info.title}</Header>
          <Header className="infoPublisher" as="h4">{info.publisher}</Header>
          {genresContainer}
          <div className="infoDescriptionContainer">
            <Header className="infoDescriptionTitle" as="h4">Description:</Header>
            <p className="infoDescription">{info.description}</p>
            <Rating className="infoRating" defaultRating={info.rating} maxRating={5} disabled />
          </div>
          <div className="infoButtonContainer">
            {favoriteButtton} {bookmarkButton}
          </div>
        </div>
      </div>
    );
  }
}
