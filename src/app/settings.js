//npm
import React from 'react';
//db
import db from '../db';
//ui
import {Button, Icon, Divider, Dropdown, Header} from 'semantic-ui-react';

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
    const {history} = this.props;

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
          <h1 className="settingsHeader">Settings</h1>
          <Divider horizontal>Localization</Divider>
          <div className="subSettingsContainer">
            <div>
              <Header as="h3">Preferred Subtitles Language: </Header>
              <Dropdown
                className="subDropdown"
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
    );
  }
}
