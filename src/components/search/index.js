//npm
import React from 'react';
import _ from 'lodash';
//Crunchyroll api
import {Crunchyroll} from '../../crunchyroll';
//ui
import {Search} from 'semantic-ui-react';

export default class SearchComponent extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
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

  async init() {
    const catalogue = await Crunchyroll.search();
    const source = _.times(catalogue.length, i => ({
      id: catalogue[i].id,
      title: catalogue[i].name,
      description: catalogue[i].type,
      image: catalogue[i].img,
      link: catalogue[i].link,
    }));
    this.setState({
      source: source,
    });
  }

  resetComponent() {
    this.setState({isLoading: false, results: [], value: ''});
  }

  async handleResultSelect(e, {result}) {
    const baseURL = 'https://www.crunchyroll.com';
    //Open series page
    const formatedSeries = {
      url: `${baseURL}${result.link}`,
      title: result.title,
      _id: result.link,
    };

    const location = {
      pathname: `/series${result.link}`,
      state: formatedSeries,
    };

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

  render() {
    const {isLoading, value, results} = this.state;

    return (
      <Search
        loading={isLoading}
        onResultSelect={this.handleResultSelect}
        onSearchChange={_.debounce(this.handleSearchChange, 500, {leading: true})}
        results={results}
        value={value}
        {...this.props}
      />
    );
  }
}
