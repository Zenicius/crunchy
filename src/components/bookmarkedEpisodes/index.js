//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//ui
import {Grid, Card, Icon, Image, Button} from 'semantic-ui-react';

export default withRouter(({episode, history}) => {
  const baseURL = 'https://www.crunchyroll.com';
  const id = episode._id.substring(0, episode._id.indexOf('?'));
  const formatedEpisode = {
    url: `${baseURL}${id}`,
  };
  const formatedSeries = {
    url: `${baseURL}${episode.seriesUrl}`,
    title: episode.seriesTitle,
    _id: episode.seriesUrl,
  };

  //Open Series Page
  const openEpisode = async () => {
    const location = {
      pathname: `/episode${episode._id}`,
      state: formatedEpisode,
    };
    history.push(location);
  };

  const openSeries = async () => {
    console.log(formatedSeries);
    const location = {
      pathname: `/series${episode.seriesUrl}`,
      state: formatedSeries,
    };
    history.push(location);
  };

  return (
    <Grid.Column width="5">
      <Card>
        <Card.Content>
          <Image floated="left" size="small" src={episode.image} />
          <Card.Header>{episode.seriesTitle}</Card.Header>
          <Card.Meta>{episode.seriesNext}</Card.Meta>
          <Card.Description>
            {episode.description}
          </Card.Description>
        </Card.Content>
        <Card.Content extra>
          <div className="ui two buttons">
            <Button basic color="green" onClick={openEpisode}>
              Watch
            </Button>
            <Button basic color="green" onClick={openSeries}>
              Series Page
            </Button>
          </div>
        </Card.Content>
      </Card>
    </Grid.Column>
  );
});
