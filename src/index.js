import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';
//pages
import Home from './app/home';
import Genres from './app/genres';
import Favorites from './app/favorites';
import My from './app/my';
import Series from './app/series';
import Episode from './app/episode';
import Settings from './app/settings';
import Info from './app/info';
//components
import Navbar from './components/navbar';
//ui
import {Container} from 'semantic-ui-react';

// render on page
ReactDOM.render(
  <HashRouter>
    <Container fluid>
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/genre/:value" component={Genres} />
        <Route exact path="/my" component={My} />
        <Route exact path="/favorites" component={Favorites} />
        <Route path="/series/:id" component={Series} />
        <Route path="/episode/:id" component={Episode} />
        <Route exact path="/settings" component={Settings} />
        <Route exact path="/info" component={Info} />
        <Route component={Home} />
      </Switch>
    </Container>
  </HashRouter>,
  document.getElementById('app')
);
