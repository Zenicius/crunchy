//npm
import React from 'react';
//db
import db from '../db';
//ui
import {Button, Icon, Divider, Dropdown, Header, Confirm} from 'semantic-ui-react';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownTitle: null,
      loading: false,
      justSaved: false,
      loadingDbReset: false,
      openConfirmDb: false,
      openConfirmReset: false,
      resultConfirmDb: false,
      resultConfirmReset: false,
    };

    this.handleChange = this.handleChange.bind(this);

    this.init();
  }

  async init() {
    // Try to get current preferred language
    try {
      const current = await db.settings.get('preferredSubtitles');
      this.setState({
        dropdownTitle: current.title,
      });
    } catch (e) {
      if (e.name == 'not_found') {
        this.setState({
          dropdownTitle: '...',
        });
      }
    }
  }

  componentDidUpdate() {
    const {resultConfirmDb, resultConfirmReset} = this.state;
    // calls function after confirmation
    if (resultConfirmDb) {
      this.flushAllDb();
    } else if (resultConfirmReset) {
      this.resetSettings();
    }
  }

  async handleChange(e, {value}) {
    e.persist();
    const title = e.currentTarget.textContent;
    // triggers loading
    this.setState({
      loading: true,
    });
    try {
      await db.settings.get('preferredSubtitles').then(doc => {
        // update their key and title
        doc.key = value;
        doc.title = title;
        // put them back
        console.log('Updated preferred sub:', value);
        return db.settings.put(doc);
      });
    } catch (e) {
      if (e.name == 'not_found') {
        // Store value in db
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

  async flushAllDb() {
    //TODO: add more options
    console.log('Crunchy: Flushing DBs');

    // triggers loading and resets confirm result
    this.setState({resultConfirmDb: false, loadingDbReset: true});

    // reset series db
    await db.series.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.series.remove(row.id, row.value.rev);
        })
      );
    });
    // reset genres db
    await db.series.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.series.remove(row.id, row.value.rev);
        })
      );
    });
    // reset episodes db
    await db.episodes.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.episodes.remove(row.id, row.value.rev);
        })
      );
    });
    // reset current db
    await db.current.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.current.remove(row.id, row.value.rev);
        })
      );
    });
    // reset favorites db
    await db.favorites.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.favorites.remove(row.id, row.value.rev);
        })
      );
    });
    // reset bookmarkSeries db
    await db.bookmarkSeries.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.bookmarkSeries.remove(row.id, row.value.rev);
        })
      );
    });

    // Ends loading
    this.setState({loadingDbReset: false});
  }

  async resetSettings() {
    console.log('Crunchy: Reseting settings');

    // triggers loading and resets confirm result
    this.setState({resultConfirmReset: false, loadingDbReset: true});

    // reset settings
    await db.settings.allDocs().then(result => {
      return Promise.all(
        result.rows.map(row => {
          return db.settings.remove(row.id, row.value.rev);
        })
      );
    });

    // Ends loading
    this.setState({loadingDbReset: false});

    // Returns to home TODO: go back
    const {history} = this.props;
    const location = {
      pathname: `/`,
    };
    history.push(location);
  }

  render() {
    // Subtitle Dropdown
    const {dropdownTitle, loading, justSaved} = this.state;
    const {history} = this.props;
    // Db and Reset
    const {openConfirmDb, openConfirmReset, loadingDbReset} = this.state;

    // Subtitles options
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
        text: 'Français (France)',
        value: 'fr',
        flag: 'fr',
      },
      {
        text: 'Deutsch',
        value: 'de',
        flag: 'de',
      },
      {
        text: 'العربية',
        value: 'sa',
        flag: 'sa',
      },
      {
        text: 'Русский',
        value: 'ru',
        flag: 'ru',
      },
    ];

    // Subtitles saved message
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
            <Divider horizontal>Database and Reset</Divider>
            {loadingDbReset
              ? <Button loading disabled content="Flush All Databases" />
              : <Button
                  content="Flush All Databases"
                  icon="trash"
                  labelPosition="left"
                  onClick={() => this.setState({openConfirmDb: true})}
                />}
            {loadingDbReset
              ? <Button loading disabled content="Reset Settings" />
              : <Button
                  content="Reset Settings"
                  icon="redo"
                  labelPosition="left"
                  onClick={() => this.setState({openConfirmReset: true})}
                />}
            <Confirm
              open={openConfirmDb}
              header="Flush All Databases"
              onCancel={() => this.setState({openConfirmDb: false})}
              onConfirm={() => this.setState({openConfirmDb: false, resultConfirmDb: true})}
            />
            <Confirm
              open={openConfirmReset}
              header="Reset Settings"
              onCancel={() => this.setState({openConfirmReset: false})}
              onConfirm={() => this.setState({openConfirmReset: false, resultConfirmReset: true})}
            />
          </div>
        </div>
      </div>
    );
  }
}
