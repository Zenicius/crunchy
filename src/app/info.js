//npm
import React from 'react';
//ui
import {Button, Icon, Divider, Header} from 'semantic-ui-react';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {history} = this.props;

    return (
      <div>
        <div className="settings">
          <Button
            href="#back"
            icon
            labelPosition="left"
            color="grey"
            className="button"
            onClick={() => history.goBack()}
          >
            <Icon name="arrow left" />
            Back
          </Button>
          <Divider horizontal><Header as="h1">Info</Header></Divider>
          <Header as="h4">
            Desktop Electron based app for video streaming from Crunchyroll!
          </Header>
          <Header as="h4">
            This is currently my project to learn Javascript and some of web-development, at the same time creat something usefull (at leat for me).
          </Header>
        </div>
      </div>
    );
  }
}
