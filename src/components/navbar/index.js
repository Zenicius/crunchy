import React from 'react';
import {Link} from 'react-router-dom';
import {Menu, Icon, Input} from 'semantic-ui-react';

export default class Navbar extends React.Component {
  constructor(props) {
    super(props);
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
        <Link to="/">
          <Menu.Item name="Home" active={activeItem === '/'} />
        </Link>
        <Link to="/my">
          <Menu.Item name="My Series" active={activeItem === '/my'} />
        </Link>
        <Link to="/settings">
          <Menu.Item name="Settings" active={activeItem === '/settings'} />
        </Link>
        <Menu.Item position="right">
          <Input className="search" icon={<Icon name="search" inverted circular link />} placeholder="Search..." />
        </Menu.Item>
      </Menu>
    );
  }
}
