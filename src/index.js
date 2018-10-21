import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';
//pages
import Home from './app/home';
import Settings from './app/settings';
import Series from './app/series';
import Episode from './app/episode';
//ui
import {Container} from 'semantic-ui-react';

// render on page
ReactDOM.render(
  <HashRouter>
    <Container fluid>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/settings" component={Settings} />
        <Route path="/series/:id" component={Series} />
        <Route path="/episode/:id" component={Episode} />
        <Route component={Home} />
      </Switch>
    </Container>
  </HashRouter>,
  document.getElementById('app')
);
