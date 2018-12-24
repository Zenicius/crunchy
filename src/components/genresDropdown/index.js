//npm
import React from 'react';
//localization
import {FormattedMessage} from 'react-intl';
//ui
import {Dropdown} from 'semantic-ui-react';

export default class GenresComponent extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
    this.state = {
      value: 'all',
    };

    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    // defines correct value after returning from another page
    const path = this.history.location.pathname;
    if (path.includes('genre')) {
      const valueByPath = path.substring(path.lastIndexOf('/') + 1, path.length);
      this.setState({
        value: valueByPath,
      });
    }
  }

  async handleChange(e, {value}) {
    e.persist();
    const title = e.currentTarget.textContent;

    // no changes
    if (this.state.value == value) {
      return;
    } else if (value == 'all') {
      // return to home (all series)
      this.setState({
        value: value,
      });
      const location = {
        pathname: `/`,
      };
      this.history.push(location);
    } else {
      // push new genre
      this.setState({
        value: value,
      });

      const location = {
        pathname: `/genre/${value}`,
        value: value,
        title: title,
      };

      this.history.push(location);
    }
  }

  componentDidUpdate() {
    // reset value to all if returns to home or goes to another page
    const value = this.state.value;
    const pathname = this.history.location.pathname;
    if (value != 'all' && !pathname.includes('/genre/')) {
      this.setState({
        value: 'all',
      });
    }
  }

  render() {
    const value = this.state.value;

    const options = [
      {key: 1, text: <FormattedMessage id="Genres.All" defaultMessage="All" />, value: 'all'},
      {key: 2, text: <FormattedMessage id="Genres.Action" defaultMessage="Action" />, value: 'action'},
      {key: 3, text: <FormattedMessage id="Genres.Adventure" defaultMessage="Adventure" />, value: 'adventure'},
      {key: 4, text: <FormattedMessage id="Genres.Comedy" defaultMessage="Comedy" />, value: 'comedy'},
      {key: 5, text: <FormattedMessage id="Genres.Drama" defaultMessage="Drama" />, value: 'drama'},
      {key: 6, text: <FormattedMessage id="Genres.Ecchi" defaultMessage="Ecchi" />, value: 'ecchi'},
      {key: 7, text: <FormattedMessage id="Genres.Fantasy" defaultMessage="Fantasy" />, value: 'fantasy'},
      {key: 8, text: <FormattedMessage id="Genres.Historical" defaultMessage="Historical" />, value: 'historical'},
      {key: 9, text: <FormattedMessage id="Genres.Mecha" defaultMessage="Mecha" />, value: 'mecha'},
      {key: 10, text: <FormattedMessage id="Genres.Romance" defaultMessage="Romance" />, value: 'romance'},
      {
        key: 11,
        text: <FormattedMessage id="Genres.ScienceFiction" defaultMessage="Science Fiction" />,
        value: 'science_fiction',
      },
      {key: 12, text: <FormattedMessage id="Genres.Seinen" defaultMessage="Seinen" />, value: 'seinen'},
      {key: 13, text: <FormattedMessage id="Genres.Shoujo" defaultMessage="Shoujo" />, value: 'shoujo'},
      {key: 14, text: <FormattedMessage id="Genres.Shounen" defaultMessage="Shounen" />, value: 'shounen'},
      {
        key: 15,
        text: <FormattedMessage id="Genres.SliceofLife" defaultMessage="Slice of Life" />,
        value: 'slice_of_life',
      },
      {key: 16, text: <FormattedMessage id="Genres.Sports" defaultMessage="Sports" />, value: 'sports'},
    ];

    return (
      <div>
        <Dropdown options={options} onChange={this.handleChange} value={value} simple item />
      </div>
    );
  }
}
