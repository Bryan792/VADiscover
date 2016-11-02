import React, { Component, PropTypes} from 'react';
import { browserHistory, Link} from 'react-router'

import SearchBar from '../../../components/SearchBar'
import Profile from './Profile'
import TopVa from './TopVa'
import Recommendations from './Recommendations'
import Details from './Details'

export default class User extends Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.requestVa(this.props.params.userId);
    $('.menu .item')
      .tab()
    ;
  }

  componentDidUpdate(prevProps) {
    // respond to parameter change in scenario 3
    let oldId = prevProps.params.userId;
    let newId = this.props.params.userId;
    if (newId !== oldId)
      this.props.requestVa(this.props.params.userId);
  }

  render() {
    return (
      <div className="ui container">
        <SearchBar history={ this.props.history } />
        <Profile username={ this.props.username } profile={ this.props.profile } />
        <div style={{position: "relative"}}>
          <div className="ui secondary menu">
            <a className="item active" data-tab="first">Overview</a>
            <a className="item" data-tab="second">Details</a>
          </div>
          <div className="ui bottom attached tab active" data-tab="first">
            <TopVa most={ this.props.most } />
            <div className="ui divider" />
            <Recommendations recommendations={ this.props.recommendations } />
          </div>
          <div className="ui bottom attached tab" data-tab="second">
            <Details most={ this.props.most } />
          { this.props.isLoading ?
            <div className="ui active inverted dimmer">
              <div className="ui big text loader">
                { this.props.queueSize > 0 ? "Position " + this.props.queuePosition + " of " + this.props.queueSize : "" } </div>
            </div>
              : null }
          </div>
        </div>
      </div>
    )
  }
}

User.propTypes = {
  username: React.PropTypes.string,
  most: React.PropTypes.array,
  recommendations: React.PropTypes.array,
  isLoading: React.PropTypes.bool,
  requestVa: React.PropTypes.func.isRequired,
  queuePosition: React.PropTypes.number,
  queueSize: React.PropTypes.number,
  profile: React.PropTypes.object,
}
