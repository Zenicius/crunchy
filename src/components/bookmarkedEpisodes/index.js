//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//ui
import {Grid, Card, Icon, Image, Button} from 'semantic-ui-react';

export default withRouter(({episode, history}) => {
  //Open Series Page
  const openEpisode = async () => {
    const location = {
      pathname: `/episode${episode._id}`,
      state: episode, //FIX
    };

    history.push(location);
  };

  //TODO make it better
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
            <Button basic color="green">
              Watch
            </Button>
            <Button basic color="green">
              Series Page
            </Button>
          </div>
        </Card.Content>
      </Card>
    </Grid.Column>
  );
});
