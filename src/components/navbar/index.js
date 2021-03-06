//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
import {Link} from 'react-router-dom';
import {shell} from 'electron';
//api
import {Crunchyroll} from '../../crunchyroll';
//localization
import {FormattedMessage} from 'react-intl';
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
    this.changedLang = false;

    this.state = {
      activeItem: '/',
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
    // dont init after language change and while still in /settings
    const {pathname} = this.props.location;
    if (pathname == '/settings') {
      this.changedLang = true;
      return;
    }

    // loads user
    await Crunchyroll.getUser();

    // get user
    try {
      const user = await db.current.get('user');
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

  async componentDidUpdate() {
    const {pathname} = this.props.location;
    const {activeItem} = this.state;

    // fix wrong active tab when back from series and settings, also fix current active tab when after language switch
    if ((pathname == '/' || pathname == '/favorites') && activeItem != pathname) {
      this.setState({
        activeItem: pathname,
      });
    }

    // get user after language change
    if (this.changedLang && pathname != '/settings') {
      // get user
      try {
        const user = await db.current.get('user');
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

      this.changedLang = false;
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
    this.setState({
      activeItem: name,
    });
  }

  getGenresDropDown() {
    const {pathname} = this.props.location;

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

    return genresDropdown;
  }

  getUserDropDown() {
    const {user, loading, logedin, onLogin} = this.state;

    // user
    let trigger, options;
    if (user) {
      // trigger
      trigger = (
        <span>
          <Image avatar src={user.image} />
          {user.name}
        </span>
      );

      // options
      options = [
        {key: 'type', text: <span>{user.type}</span>, disabled: true},
        {
          key: 'user',
          text: <FormattedMessage id="Navbar.UserAccount" defaultMessage="Account" />,
          icon: 'user',
          value: 'user',
        },
        {
          key: 'sign-out',
          text: <FormattedMessage id="Navbar.UserLogout" defaultMessage="Logout" />,
          icon: 'sign out',
          value: 'logout',
        },
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

    return userDropDown;
  }

  getNavBar() {
    const {activeItem} = this.state;
    const {pathname} = this.props.location;

    const genresDropdown = this.getGenresDropDown();
    const userDropDown = this.getUserDropDown();

    // Navbar (if current page is not supposed to have navbar, returns null)
    let navbar;
    if (pathname == '/' || pathname == '/favorites' || pathname.includes('/genre/')) {
      navbar = (
        <div>
          <Segment>
            <Container>
              <Menu className="Menu" fixed="top" pointing borderless>
                <Menu.Item>
                  <Image src={'src/app/styles/logo.png'} size="tiny" />
                </Menu.Item>
                <Menu.Item name="/" as={Link} to="/" active={activeItem === '/'} onClick={this.handleActiveItem}>
                  <Icon name="video play" size="large" />
                  <FormattedMessage id="Navbar.AnimeButton" defaultMessage="Anime" />
                </Menu.Item>
                <Menu.Item
                  name="/favorites"
                  as={Link}
                  to="/favorites"
                  active={activeItem === '/favorites'}
                  onClick={this.handleActiveItem}
                >
                  <Icon name="heart" size="large" />
                  <FormattedMessage id="Navbar.FavoritesButton" defaultMessage="Favorites" />
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

  render() {
    const navbar = this.getNavBar();
    return navbar;
  }
}

export default withRouter(Navbar);
