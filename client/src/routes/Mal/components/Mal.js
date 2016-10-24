import React, { Component, PropTypes } from 'react';

export default class Mal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: 'Bryan792'
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
      <div>
        <form className='ui form' onSubmit={ (e) => {
                                               e.preventDefault();
                                               this.state.value.trim();
                                               if (!this.state.value) return;
                                               this.props.requestVa(this.state.value);
                                               this.state = {value: ''};
                                             } }>
          <div className='field'>
            <input type="text" value={ this.state.value } onChange={ this.handleChange } placeholder="MAL Username" /> </div>
          <button className='ui button'> Submit </button>
        </form>
        { this.props.most
          ? <div>
              <ul>
                { this.props.most.map(actor => <li key={ actor.actor.id }>
                                                 <h1> { actor.actor.name } </h1>
                                                 <a href={ "https://myanimelist.net/people/" + actor.actor.id }> <img src={ actor.actor.image_url } /> </a>
                                                 <div className="ui fluid eight column grid">
                                                   { actor.character.map(character => <div className="column" key={ character.id }>  <a href={ "https://myanimelist.net/character/" + character.id }> <img className="ui fluid image" src={ character.image } /> </a> </div>
                                                     ) } </div>
                                               </li>
                  ) } </ul>
            </div>
          : null } </div>
    )
  }
}

Mal.propTypes = {
  username: React.PropTypes.string,
  most: React.PropTypes.array,
  requestVa: React.PropTypes.func.isRequired
}
