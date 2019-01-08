//npm
import React from 'react';
import _ from 'lodash';
//Crunchyroll api
import {Crunchyroll} from '../../crunchyroll';
//db
import db from '../../db';
//ui
import {Search} from 'semantic-ui-react';

export default class SearchComponent extends React.Component {
  constructor(props) {
    super(props);

    this.history = this.props.history;
    this._isMounted = false;

    this.state = {
      isLoading: false,
      results: [],
      value: '',
      source: [],
    };

    // gets search catalogue and defines source
    this.init();

    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  async init() {
    const source = await Crunchyroll.search();
    if (this._isMounted) {
      this.setState({
        source: source,
      });
    }
  }

  resetComponent() {
    this.setState({isLoading: false, results: [], value: ''});
  }

  async handleResultSelect(e, {result}) {
    const baseURL = 'https://www.crunchyroll.com';
    // Open series page
    const formatedSeries = {
      url: `${baseURL}${result.link}`,
      title: result.title,
      _id: result.link,
    };

    const location = {
      pathname: `/series${result.link}`,
      state: formatedSeries,
    };

    // Store at current db to return after
    try {
      const doc = await db.current.get('series');
      const update = {
        _id: 'series',
        data: formatedSeries,
      };
      if (doc) {
        update._rev = doc._rev;
      }
      await db.current.put(update);
      console.log('put update');
    } catch (e) {
      if (e.status === 404) {
        await db.current.put({_id: 'series', data: formatedSeries});
      }
    }

    this.history.push(location);
  }

  handleSearchChange(e, {value}) {
    this.setState({isLoading: true, value});

    setTimeout(
      () => {
        if (this.state.value.length < 1) return this.resetComponent();

        const re = new RegExp(_.escapeRegExp(this.state.value), 'i');
        const isMatch = result => re.test(result.title);

        this.setState({
          isLoading: false,
          results: _.filter(this.state.source, isMatch),
        });
      },
      300
    );
  }

  componentWillMount() {
    this.resetComponent();
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    const {isLoading, value, results} = this.state;

    return (
      <div>
        <Search
          loading={isLoading}
          onResultSelect={this.handleResultSelect}
          onSearchChange={_.debounce(this.handleSearchChange, 500, {leading: true})}
          results={results}
          value={value}
          {...this.props}
        />
      </div>
    );
  }
}
