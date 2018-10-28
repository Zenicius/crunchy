//npm
import React from 'react';
//ui
import {Image, Header, Rating} from 'semantic-ui-react';

export default class SeriesInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const info = this.props.info;

    // if theres genres tags, organize it
    let genres = '';
    if (info.genres[0] !== undefined) {
      genres = ' - ';
      info.genres.forEach(element => {
        genres += element + ' / ';
      });
    }

    return (
      <div className="infoContainer">
        <Image className="infoImage" size="medium" src={info.image} />
        <div className="info">
          <Header className="infoHeader" as="h1">{info.title}</Header>
          <Header className="infoPublisher" as="h4">{info.publisher}{genres}</Header>
          <p className="infoDescription">{info.description}</p>
          <Rating className="infoRating" defaultRating={info.rating} maxRating={5} disabled />
        </div>
      </div>
    );
  }
}
