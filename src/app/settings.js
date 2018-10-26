//npm
import React from 'react';
//ui
import {Button, Icon, Card} from 'semantic-ui-react';
//components
import Navbar from '../components/navbar';
//api
import {Crunchyroll} from '../crunchyroll';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.location = this.props.location;
    this.state = {};
  }

  render() {
    //Verifies if exists auth cookies
    const loggedIn = Crunchyroll.authCookies !== null;
    if (loggedIn) {
      console.log('Settings: Logged In!');
    } else {
      console.log('Settings: Not Logged In');
    }

    return (
      <div>
        <Navbar location={this.location} />
        <div className="content">
          <div className="settings">
            <Card color="yellow">
              <Card.Content>
                <Card.Header>Crunchyroll</Card.Header>
                <Card.Description>
                  Login at Crunchyroll to see premimum videos and quality!
                </Card.Description>
              </Card.Content>
              <Card.Content extra>
                {loggedIn
                  ? <Button
                      icon
                      labelPosition="left"
                      color="grey"
                      href="#crlogout"
                      className="button"
                      onClick={() => Crunchyroll.logout()}
                    >
                      <Icon name="log out" />
                      Logout
                    </Button>
                  : <Button
                      icon
                      labelPosition="left"
                      color="grey"
                      href="#crlogin"
                      className="button"
                      onClick={() => Crunchyroll.auth()}
                    >
                      <Icon name="user" />
                      Login
                    </Button>}
              </Card.Content>
            </Card>
          </div>
        </div>

      </div>
    );
  }
}
