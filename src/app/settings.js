//npm
import React from 'react';
//localization
import {FormattedMessage} from 'react-intl';
import {IntlConsumer} from '../localization/context-provider';
//db
import db from '../db';
//ui
import {Button, Icon, Divider, Dropdown, Header, Confirm} from 'semantic-ui-react';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      subDropdownTitle: null,
      loadingSubDropdown: false,
      justSavedSub: false,
      loadingDbReset: false,
      openConfirmDb: false,
      openConfirmReset: false,
      resultConfirmDb: false,
      resultConfirmReset: false,
    };

    this.subHandleChange = this.subHandleChange.bind(this);

    this.init();
  }

  async init() {
    // Try to get current default language
    try {
      const current = await db.settings.get('lang');
      this.setState({
        langDropdownTitle: current.title,
      });
    } catch (e) {
      if (e.name == 'not_found') {
        this.setState({
          langDropdownTitle: 'English',
        });
      }
    }

    // Try to get current preferred sub language
    try {
      const current = await db.settings.get('preferredSubtitles');
      this.setState({
        subDropdownTitle: current.title,
      });
    } catch (e) {
      if (e.name == 'not_found') {
        this.setState({
          subDropdownTitle: '...',
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

  async subHandleChange(e, {value}) {
    e.persist();
    const title = e.currentTarget.textContent;

    // dont update to same lang
    if (title === this.state.subDropdownTitle) return;

    // triggers loading
    this.setState({
      loadingSubDropdown: true,
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

    // ends loading and updates dropdown title
    this.setState({
      subDropdownTitle: title,
      loadingSubDropdown: false,
      justSavedSub: true,
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

    // Returns
    const {history} = this.props;
    history.goBack();
  }

  render() {
    const {history} = this.props;

    // Subtitle Dropdown
    const {subDropdownTitle, loadingSubDropdown, justSavedSub} = this.state;
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
            <FormattedMessage id="Button.Back" defaultMessage="Back" />
          </Button>
          <h1 className="settingsHeader"><FormattedMessage id="Settings.Header" defaultMessage="Settings" /></h1>
          <Divider horizontal><FormattedMessage id="Settings.Language" defaultMessage="Language" /></Divider>
          <div className="langSettingsContainer">
            <div>
              <Header as="h3">
                <FormattedMessage id="Settings.DefaultLanguage" defaultMessage="Default Language" />:
              </Header>
              <div className="langButtons">
                <IntlConsumer>
                  {({switchToEnglish, switchToPortuguese}) => (
                    <React.Fragment>
                      <Button onClick={switchToEnglish}>
                        English
                      </Button>
                      <Button onClick={switchToPortuguese}>
                        Português
                      </Button>
                    </React.Fragment>
                  )}
                </IntlConsumer>
              </div>
            </div>
            <div>
              <Header as="h3">
                <FormattedMessage id="Settings.Preferred" defaultMessage="Preferred Subtitles Languag" />:
              </Header>
              <Dropdown
                className="subDropdown"
                placeholder={subDropdownTitle}
                selection
                options={subOptions}
                onChange={this.subHandleChange}
                loading={loadingSubDropdown}
                disabled={loadingSubDropdown}
              />
              {justSavedSub
                ? <span className="subSettingsMessage">
                    <FormattedMessage id="Settings.Saved" defaultMessage="Saved" />!
                  </span>
                : null}
            </div>
            <span className="subSettingsNote">
              <FormattedMessage
                id="Settings.Subsnote"
                defaultMessage="Note: Not all series have support for all subtitles languages"
              />
              !
            </span>
            <Divider horizontal>
              <FormattedMessage id="Settings.DbReset" defaultMessage="Database and Reset" />
            </Divider>
            {loadingDbReset
              ? <Button loading disabled>
                  <FormattedMessage id="Settings.DbFlush" defaultMessage="Flush All Databases" />
                </Button>
              : <Button icon labelPosition="left" onClick={() => this.setState({openConfirmDb: true})}>
                  <Icon name="trash" />
                  <FormattedMessage id="Settings.DbFlush" defaultMessage="Flush All Databases" />
                </Button>}
            {loadingDbReset
              ? <Button loading disabled>
                  <FormattedMessage id="Settings.ResetButton" defaultMessage="Reset Settings" />
                </Button>
              : <Button icon labelPosition="left" onClick={() => this.setState({openConfirmReset: true})}>
                  <Icon name="redo" />
                  <FormattedMessage id="Settings.ResetButton" defaultMessage="Reset Settings" />
                </Button>}
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
