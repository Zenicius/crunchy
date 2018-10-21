//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//ui
import {Popup, Grid, Card, Icon, Image} from 'semantic-ui-react';

export default withRouter(({episode, history}) => {
  //Open Series Page
  const openEpisode = async () => {
    const location = {
      pathname: `/episode${episode._id}`,
      state: episode,
    };
    //console.log(location);
    history.push(location);
  };

  let CardDescription;
  if (episode.season == 'unique') {
    CardDescription = <Card.Description>{episode.description}</Card.Description>;
  } else {
    CardDescription = <Card.Description>{episode.season}</Card.Description>;
  }

  return (
    <Grid.Column width={2}>
      <Popup
        trigger={
          <Card color="red" onClick={openEpisode}>
            <Image src={episode.image} alt={episode.title} fluid />
            <Card.Content>
              <Card.Header>{episode.title}</Card.Header>
              {CardDescription}
            </Card.Content>
            <Card.Content extra>
              <Icon name="play" />
              Watch
            </Card.Content>
          </Card>
        }
        content={episode.description}
        inverted
      />
    </Grid.Column>
  );
});
