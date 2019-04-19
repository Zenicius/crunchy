//npm
import React from 'react';
//localization
import {FormattedMessage} from 'react-intl';
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
      favorited: false,
      loadingBookmark: false,
      loadingFavorited: false,
    };

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

  getGenresContainer() {
    const {info} = this.state;

    // if theres genres tags, organize it
    let genres = '', genresContainer;
    if (info.genres[0] !== undefined) {
      info.genres.forEach(function(element, index) {
        if (index == info.genres.length - 1) {
          genres += element;
        } else {
          genres += element + ' / ';
        }
      });
      genresContainer = (
        <Header className="infoGenres" as="h4">
          <FormattedMessage id="Series.Genres" defaultMessage="Genres" />: {genres}
        </Header>
      );
    } else
      genresContainer = null;

    return genresContainer;
  }

  getFavoriteButtton() {
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
          <FormattedMessage id="Series.Favorite" defaultMessage="Favorite" />
        </Button>
      );
    } else if (this.state.favorited && !this.loadingFavorited) {
      // favorited (option to remove)
      favoriteButtton = (
        <Button className="infoFavoriteButton" icon labelPosition="left" onClick={this.favorite}>
          <Icon name="heart" />
          <FormattedMessage id="Series.Remove" defaultMessage="Remove" />
        </Button>
      );
    }

    return favoriteButtton;
  }

  render() {
    const {info} = this.state;
    const genresContainer = this.getGenresContainer();
    const favoriteButtton = this.getFavoriteButtton();

    return (
      <div className="infoContainer">
        <Image className="infoImage" size="medium" src={info.image} />
        <div className="info">
          <Header className="infoHeader" as="h1">{info.title}</Header>
          <Header className="infoPublisher" as="h4">{info.publisher}</Header>
          {genresContainer}
          <div className="infoDescriptionContainer">
            <Header className="infoDescriptionTitle" as="h4">
              <FormattedMessage id="Series.Description" defaultMessage="Description" />:
            </Header>
            <p className="infoDescription">{info.description}</p>
            <Rating className="infoRating" defaultRating={info.rating} maxRating={5} disabled />
          </div>
          <div className="infoButtonContainer">
            {favoriteButtton}
          </div>
        </div>
      </div>
    );
  }
}
