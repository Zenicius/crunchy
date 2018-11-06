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
//ui
import {Menu, Dropdown, Image, Segment, Container, Button} from 'semantic-ui-react';

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
      userDropDown = <Button circular inverted icon="user" onClick={this.handleLogin} />;
    }

    // Navbar (if current page is series or episode, navbar returns null)
    let navbar;
    if (pathname.includes('/series') || pathname.includes('/episode') || pathname.includes('/settings')) {
      navbar = null;
    } else {
      navbar = (
        <Segment inverted>
          <Container>
            <Menu className="Menu" fixed="top" inverted pointing>
              <Menu.Item>
                <Image
                  src="https://lh3.googleusercontent.com/y4DLuPgyt1H7G9Y6MIQjDaRrYwuBgAmFSwVopiv_YXGyzUz7CPfFZ1C3abyhSWXYCw_RmKmlMqFc98qUYfJZ=w1919-h937"
                  size="tiny"
                />
              </Menu.Item>
              <Menu.Item
                name="Home"
                as={Link}
                to="/"
                active={this.activeItem === 'Home'}
                onClick={this.handleActiveItem}
              />
              <Menu.Item
                name="My Series"
                as={Link}
                to="/my"
                active={this.activeItem === 'My Series'}
                onClick={this.handleActiveItem}
              />
              <Menu.Item position="right">
                <SearchComponent history={this.history} />
              </Menu.Item>
              <Menu.Item>
                {userDropDown}
              </Menu.Item>
              <Menu.Item as={Link} to="/settings">
                <Button circular inverted icon="settings" />
              </Menu.Item>
            </Menu>
          </Container>
        </Segment>
      );
    }

    return navbar;
  }
}

export default withRouter(Navbar);
