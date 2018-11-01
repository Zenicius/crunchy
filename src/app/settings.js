//npm
import React from 'react';
//api
import {Crunchyroll} from '../crunchyroll';
//db
import db from '../db';
//components
import Navbar from '../components/navbar';
//ui
import {Button, Icon, Card, Divider, Dropdown, Header} from 'semantic-ui-react';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.location = this.props.location;
    this.state = {
      dropdownTitle: null,
      loading: false,
      justSaved: false,
    };

    this.handleChange = this.handleChange.bind(this);

    this.init();
  }

  async init() {
    //Try to get current preferred language, default is english
    try {
      const current = await db.settings.get('preferredSubtitles');
      this.setState({
        dropdownTitle: current.title,
      });
    } catch (e) {
      if (e.name == 'not_found') {
        this.setState({
          dropdownTitle: 'English',
        });
        return;
      }
    }
  }

  async handleChange(e, {value}) {
    e.persist();
    const title = e.currentTarget.textContent;
    //triggers loading
    this.setState({
      loading: true,
    });
    try {
      await db.settings.get('preferredSubtitles').then(function(doc) {
        // update their key and title
        doc.key = value;
        doc.title = title;
        // put them back
        console.log('Updated preferred sub:', value);
        return db.settings.put(doc);
      });
    } catch (e) {
      if (e.name == 'not_found') {
        //Store value in db
        await db.settings.put({_id: 'preferredSubtitles', key: value, title: title});
        console.log(value, ' Defined as Preferred Sub');
      }
    }
    // ends loading
    this.setState({
      loading: false,
      justSaved: true,
    });
  }

  render() {
    const dropdownTitle = this.state.dropdownTitle;
    const loading = this.state.loading;
    const justSaved = this.state.justSaved;

    //Verifies if exists auth cookies
    const loggedIn = Crunchyroll.authCookies !== null;

    //Subtitles options
    const subOptions = [
      {
        text: 'English',
        value: 'en',
        flag: 'gb',
      },
      {
        text: 'Português (Brasil)',
        value: 'ptBR',
        flag: 'br',
      },
      {
        text: 'Español',
        value: 'es',
        flag: 'ar',
      },
      {
        text: 'Español (España)',
        value: 'esES',
        flag: 'es',
      },
      {
        text: 'Italiano',
        value: 'it',
        flag: 'it',
      },
      {
        text: 'Deutsch',
        value: 'de',
        flag: 'de',
      },
      {
        text: 'Русский',
        value: 'ru',
        flag: 'ru',
      },
    ];

    let subMessage;
    if (justSaved) {
      subMessage = <span className="subSettingsMessage">Saved!</span>;
    } else {
      subMessage = null;
    }

    return (
      <div>
        <Navbar location={this.location} />
        <div className="content">
          <div className="settings">
            <Divider horizontal>Crunchyroll</Divider>
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
            <Divider horizontal>Localization</Divider>
            <div className="subSettingsContainer">
              <div>
                <Header as="h2">Preferred Subtitles Language</Header>
                <Dropdown
                  placeholder={dropdownTitle}
                  selection
                  options={subOptions}
                  onChange={this.handleChange}
                  loading={loading}
                  disabled={loading}
                />
                {subMessage}
              </div>
              <span className="subSettingsNote">
                Note: Not all series have support for all subtitles languages!
              </span>
            </div>
          </div>
        </div>

      </div>
    );
  }
}
