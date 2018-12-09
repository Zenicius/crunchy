//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
import {Link} from 'react-router-dom';
import {shell} from 'electron';
//api
import {Crunchyroll} from '../../crunchyroll';
//db
import db from '../../db';
//components
import SearchComponent from '../search';
import GenresComponent from '../genresDropdown';
//ui
import {Menu, Dropdown, Image, Segment, Container, Button, Icon} from 'semantic-ui-react';

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
    this.activeItem = 'Home';
    this.state = {
      user: null,
      loading: true,
      logedin: false,
      onLogin: false,
    };

    this.handleActiveItem = this.handleActiveItem.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);

    this.init();
  }

  async init() {
    // get user
    let user;
    try {
      await Crunchyroll.getUser();
      user = await db.current.get('user');
      this.setState({
        logedin: true,
        user: user,
        loading: false,
      });
    } catch (e) {
      if (e.name == 'not_found') {
        this.setState({
          logedin: false,
          loading: false,
        });
      }
    }
  }

  async handleChange(e, {value}) {
    if (value == 'logout') {
      this.setState({
        loading: true,
      });
      await Crunchyroll.logout();
      this.setState({
        loading: false,
        logedin: false,
      });
    } else if (value == 'user') {
      const user = this.state.user;
      shell.openExternal(`https://www.crunchyroll.com${user.link}`);
    }
  }

  handleLogin() {
    this.setState({
      onLogin: true,
    });
    Crunchyroll.auth(this);
  }

  async handleLoginCompleted() {
    await this.init();
    this.setState({
      onLogin: false,
    });
  }

  handleActiveItem(e, {name}) {
    // Change active item to current page
    this.activeItem = name;
  }

  render() {
    const {user, loading, logedin, onLogin} = this.state;
    const pathname = this.props.location.pathname;
    const activeItem = this.activeItem;

    // fix wrong active tab when back from series and settings
    if ((pathname == '/' && activeItem != 'Home') || pathname === '/crlogin' || pathname === '/crlogout') {
      this.activeItem = 'Home';
    }

    // only show genres dropwdown when on home and searching by genres
    let genresDropdown;
    if (pathname == '/' || pathname.includes('/genre/')) {
      genresDropdown = (
        <Menu.Item>
          <GenresComponent history={this.history} />
        </Menu.Item>
      );
    } else {
      genresDropdown = null;
    }

    // user trigger
    let trigger, options;
    if (user) {
      trigger = (
        <span>
          <Image avatar src={user.image} />
          {user.name}
        </span>
      );

      //user options
      options = [
        {key: 'type', text: <span>{user.type}</span>, disabled: true},
        {key: 'user', text: 'Account', icon: 'user', value: 'user'},
        {key: 'sign-out', text: 'Sign Out', icon: 'sign out', value: 'logout'},
      ];
    }

    // user dropdown
    let userDropDown;
    if (loading || onLogin) {
      userDropDown = <Dropdown loading />;
    } else if (!loading && logedin && !onLogin) {
      userDropDown = (
        <Dropdown className="userDropDown" trigger={trigger} options={options} onChange={this.handleChange} />
      );
    } else if (!loading && !logedin && !onLogin) {
      userDropDown = <Button circular icon="user" onClick={this.handleLogin} />;
    }

    // Navbar (if current page is not supposed to have navbar, returns null)
    let navbar;
    if (pathname == '/' || pathname == '/my' || pathname == '/favorites' || pathname.includes('/genre/')) {
      navbar = (
        <div>
          <Segment>
            <Container>
              <Menu className="Menu" fixed="top" pointing borderless>
                <Menu.Item>
                  <Image
                    src="https://lh6.googleusercontent.com/pHW23bqbEFKaoDXQzsxsWdoZfFyvZEbZjbx8sGUi5nr-xqKzGt0bGdzsDFeJA02XrbXfgtbWR7xc1pmxr8Xm=w1919-h937"
                    size="tiny"
                  />
                </Menu.Item>
                <Menu.Item
                  name="Home"
                  as={Link}
                  to="/"
                  active={this.activeItem === 'Home'}
                  onClick={this.handleActiveItem}
                >
                  <Icon name="video play" size="large" />
                  Anime
                </Menu.Item>
                <Menu.Item
                  name="Favorites"
                  as={Link}
                  to="/favorites"
                  active={this.activeItem === 'Favorites'}
                  onClick={this.handleActiveItem}
                >
                  <Icon name="heart" size="large" />
                  Favorites
                </Menu.Item>
                <Menu.Item
                  name="My Series"
                  as={Link}
                  to="/my"
                  active={this.activeItem === 'My Series'}
                  onClick={this.handleActiveItem}
                >
                  <Icon name="list ol" size="large" />
                  Queue
                </Menu.Item>
                {genresDropdown}
                <Menu.Item position="right">
                  <SearchComponent history={this.history} />
                </Menu.Item>
                <Menu.Item />
                <Menu.Item>
                  {userDropDown}
                </Menu.Item>
                <Menu.Item>
                  <Button as={Link} to="/settings" circular icon="settings" />
                </Menu.Item>
                <Menu.Item>
                  <Button as={Link} to="/info" circular icon="info" />
                </Menu.Item>
              </Menu>
            </Container>
          </Segment>
        </div>
      );
    } else {
      navbar = null;
    }

    return navbar;
  }
}

export default withRouter(Navbar);
