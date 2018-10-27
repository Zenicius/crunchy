//npm
import React from 'react';
import {withRouter} from 'react-router-dom';
import {Link} from 'react-router-dom';
//components
import SearchComponent from '../search';
//ui
import {Menu} from 'semantic-ui-react';

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.history = this.props.history;
    this.state = {activeItem: '/'};
  }

  componentDidMount() {
    const path = this.props.location.pathname;
    this.setState({
      activeItem: path,
    });
  }

  render() {
    const {activeItem} = this.state;

    return (
      <Menu inverted pointing>
        <Menu.Item name="Home" as={Link} to="/" active={activeItem === '/'} />
        <Menu.Item name="My Series" as={Link} to="/my" active={activeItem === '/my'} />
        <Menu.Item name="Settings" as={Link} to="/settings" active={activeItem === '/settings'} />
        <Menu.Item position="right">
          <SearchComponent history={this.history} />
        </Menu.Item>
      </Menu>
    );
  }
}

export default withRouter(Navbar);
