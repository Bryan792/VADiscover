import React, { Component, PropTypes } from 'react';

export default class SearchBar extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange = (event) => {
    this.setState({
      value: event.target.value
    })
  }

  render() {
    return (
      <form className='ui massive form' onSubmit={ (e) => {
                                               e.preventDefault();
                                               this.state.value.trim();
                                               if (!this.state.value) return;
                                               this.props.history.push('/' + this.state.value);
                                             } }>
        <div className='field'>
          <input type="text" value={ this.state.value } onChange={ this.handleChange } placeholder="MAL Username" /> 
        </div>
      </form>
    )
  }
}
