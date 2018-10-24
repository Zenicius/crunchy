// npm
import React from 'react';
import {withRouter} from 'react-router-dom';
//db
import db from '../../db';
// ui
import {Popup, Grid, Card, Icon, Image} from 'semantic-ui-react';

export default withRouter(({series, history}) => {
  // Open Series Page
  const openSeries = async () => {
    const location = {
      pathname: `/series${series._id}`,
      state: series,
    };
    //Store at current db to return after
    try {
      const doc = await db.current.get('series');
      const update = {
        _id: 'series',
        data: series,
      };
      if (doc) {
        update._rev = doc._rev;
      }
      await db.current.put(update);
    } catch (e) {
      if (e.status === 404) {
        await db.current.put({_id: 'series', data: series});
      }
    }

    history.push(location);
  };

  return (
    <Grid.Column width={2}>
      <Popup
        trigger={
          <Card color="yellow" onClick={openSeries}>
            <Image src={series.image} alt={series.title} fluid />
            <Card.Content extra>
              <Icon name="play" />
              {series.count} Episodes
            </Card.Content>
          </Card>
        }
        content={series.title}
        inverted
      />

    </Grid.Column>
  );
});
