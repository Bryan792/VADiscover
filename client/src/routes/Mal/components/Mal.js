import React, { Component, PropTypes } from 'react';
import SearchBar from '../../../components/SearchBar';

export default class Mal extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="ui center aligned text container">
        <h1 className="ui header">VA Discover</h1>
        <SearchBar />
      </div>
    )
  }
}
