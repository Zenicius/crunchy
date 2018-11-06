import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';
//pages
import Home from './app/home';
import My from './app/my';
import Settings from './app/settings';
import Series from './app/series';
import Episode from './app/episode';
//ui
import {Container} from 'semantic-ui-react';
import Navbar from './components/navbar';

// render on page
ReactDOM.render(
  <HashRouter>
    <Container fluid>
      <Navbar />
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/my" component={My} />
        <Route exact path="/settings" component={Settings} />
        <Route path="/series/:id" component={Series} />
        <Route path="/episode/:id" component={Episode} />
        <Route component={Home} />
      </Switch>
    </Container>
  </HashRouter>,
  document.getElementById('app')
);
