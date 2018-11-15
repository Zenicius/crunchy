//npm
import React from 'react';
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

  async handleChange(e, {value}) {
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
      {key: 1, text: 'All', value: 'all'},
      {key: 2, text: 'Action', value: 'action'},
      {key: 3, text: 'Adventure', value: 'adventure'},
      {key: 4, text: 'Comedy', value: 'comedy'},
      {key: 5, text: 'Drama', value: 'drama'},
      {key: 6, text: 'Ecchi', value: 'ecchi'},
      {key: 7, text: 'Fantasy', value: 'fantasy'},
      {key: 8, text: 'Historical', value: 'historical'},
      {key: 9, text: 'Mecha', value: 'mecha'},
      {key: 10, text: 'Romance', value: 'romance'},
      {key: 11, text: 'Science Fiction', value: 'science_fiction'},
      {key: 12, text: 'Seinen', value: 'seinen'},
      {key: 13, text: 'Shoujo', value: 'shoujo'},
      {key: 14, text: 'Shounen', value: 'shounen'},
      {key: 15, text: 'Slice of Life', value: 'slice_of_life'},
      {key: 16, text: 'Sports', value: 'sports'},
    ];

    return (
      <div>
        <Dropdown options={options} onChange={this.handleChange} value={value} simple item />
      </div>
    );
  }
}
