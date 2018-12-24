//npm
import React from 'react';
import {IntlProvider, addLocaleData, injectIntl} from 'react-intl';
//localization
import localeData from './data.json';
import en from 'react-intl/locale-data/en';
import pt from 'react-intl/locale-data/pt';
// preferences
import Preferences from './preferences';

addLocaleData([...en, ...pt]);

const {Provider, Consumer} = React.createContext();

class ReactIntlContextProvider extends React.Component {
  constructor(props) {
    super(props);

    // preferences
    const preferences = new Preferences();

    // translations
    const messagesEn = localeData['en'];
    const messagesPt = localeData['pt'];

    // get default language from user preferences
    const lang = preferences.get('lang');
    console.log('Crunchy: Default Language ', lang);

    // switch functions
    this.switchToEnglish = () => {
      console.log('Crunchy: Switching to language to english');
      this.setState({locale: 'en', messages: messagesEn});
      preferences.set('lang', 'en');
    };
    this.switchToPortuguese = () => {
      console.log('Crunchy: Switching to language to portuguese');
      this.setState({locale: 'pt', messages: messagesPt});
      preferences.set('lang', 'pt');
    };

    // pass everything in state to avoid creating object inside render method (like explained in the documentation)
    if (lang == 'en') {
      this.state = {
        locale: 'en',
        messages: messagesEn,
        switchToEnglish: this.switchToEnglish,
        switchToPortuguese: this.switchToPortuguese,
      };
    } else if (lang == 'pt') {
      this.state = {
        locale: 'pt',
        messages: messagesPt,
        switchToEnglish: this.switchToEnglish,
        switchToPortuguese: this.switchToPortuguese,
      };
    }
  }

  render() {
    const {children} = this.props;
    const {locale, messages} = this.state;
    return (
      <Provider value={this.state}>
        <IntlProvider key={locale} locale={locale} messages={messages} defaultLocale="en">
          {children}
        </IntlProvider>
      </Provider>
    );
  }
}

export {ReactIntlContextProvider as IntlProvider, Consumer as IntlConsumer, injectIntl};
