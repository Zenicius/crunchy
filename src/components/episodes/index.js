//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//localization
import {FormattedMessage} from 'react-intl';
//ui
import {Popup, Grid, Card, Icon, Image, Progress} from 'semantic-ui-react';

export default withRouter(({episode, history}) => {
  //Open Series Page
  const openEpisode = async () => {
    const location = {
      pathname: `/episode${episode._id}`,
      state: episode,
    };

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
              <Progress percent={episode.progress} size="tiny" indicating />
              <Card.Header>{episode.title}</Card.Header>
              {CardDescription}
            </Card.Content>
            <Card.Content extra>
              <Icon name="play" />
              <FormattedMessage id="Series.Watch" defaultMessage="Watch" />
            </Card.Content>
          </Card>
        }
        content={episode.description}
        inverted
      />
    </Grid.Column>
  );
});
