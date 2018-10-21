//npm
import React from 'react';
import {Link} from 'react-router-dom';
//ui
import {Button, Icon} from 'semantic-ui-react';
//api
import {Crunchyroll} from '../crunchyroll';

export default class Settings extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <div>
        <Link to="/">
          <Button icon labelPosition="left" color="grey" className="button">
            <Icon name="arrow left" />
            Back
          </Button>
        </Link>

        <div className="content">
          {Crunchyroll.renderSettings()}
        </div>

      </div>
    );
  }
}
