//npm
import React from 'react';
import {Link} from 'react-router-dom';
//ui
import {Button, Icon, Divider, Header} from 'semantic-ui-react';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="settings">
          <Link to="/">
            <Button icon labelPosition="left" color="grey" className="button">
              <Icon name="arrow left" />
              Back
            </Button>
          </Link>
          <Divider horizontal><Header as="h1">Info</Header></Divider>
        </div>
      </div>
    );
  }
}
