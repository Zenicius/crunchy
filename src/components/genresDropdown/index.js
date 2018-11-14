//npm
import React from 'react';
//ui
import {Dropdown} from 'semantic-ui-react';

export default class GenresComponent extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
    this.value = 'all';

    this.handleChange = this.handleChange.bind(this);
  }

  async handleChange(e, {value}) {
    // no changes
    if (this.value == value) {
      return;
    } else if (value == 'all') {
      // return to home (all series)
      this.value = value;
      const location = {
        pathname: `/`,
      };
      this.history.push(location);
    } else {
      // push new genre
      this.value = value;

      const location = {
        pathname: `/genre/${value}`,
        value: value,
      };

      this.history.push(location);
    }
  }

  render() {
    const value = this.value;
    const pathname = this.history.location.pathname;

    if (!pathname.includes('/genre/')) {
      this.value = 'all';
    }

    const options = [
      {key: 1, text: 'All', value: 'all'},
      {key: 2, text: 'Action', value: 'action'},
      {key: 3, text: 'Adventure', value: 'adventure'},
      {key: 4, text: 'Comedy', value: 'comedy'},
      {key: 5, text: 'Drama', value: 'drama'},
      {key: 6, text: 'Ecchi', value: 'ecchi'},
      {key: 7, text: 'Fantasy', value: 'fantasy'},
    ];

    return (
      <div>
        <Dropdown options={options} onChange={this.handleChange} value={value} simple item />
      </div>
    );
  }
}
