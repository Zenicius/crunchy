import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';
//localization
import {IntlProvider} from './localization/context-provider';
//pages
import Home from './app/home';
import Genres from './app/genres';
import Favorites from './app/favorites';
import Series from './app/series';
import Episode from './app/episode';
import Settings from './app/settings';
//components
import Navbar from './components/navbar';

// render on page
ReactDOM.render(
  <IntlProvider>
    <HashRouter>
      <div>
        <Navbar />
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/genre/:value" component={Genres} />
          <Route exact path="/favorites" component={Favorites} />
          <Route path="/series/:id" component={Series} />
          <Route path="/episode/:id" component={Episode} />
          <Route exact path="/settings" component={Settings} />
          <Route component={Home} />
        </Switch>
      </div>
    </HashRouter>
  </IntlProvider>,
  document.getElementById('app')
);
