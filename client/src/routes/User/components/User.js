import React, {
	Component,
	PropTypes
} from 'react';
import {
	browserHistory,
	Link
} from 'react-router'

import SearchBar from '../../../components/SearchBar'

export default class User extends Component {

	constructor(props) {
		super(props);
	}

	componentDidMount() {
		this.props.requestVa(this.props.params.userId);
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
        <SearchBar history={this.props.history} />
        { this.props.most
          ? <div>
                { this.props.most.map(actor => <div className="ui segment" key={ actor.actor.id }>
                                                 <h1> { actor.actor.name } </h1>
                                                 <a href={ "https://myanimelist.net/people/" + actor.actor.id }> <img src={ actor.actor.image_url } /> </a>
                                                 <div className="ui fluid eight column grid">
                                                   { actor.character.map(character => <div className="column" key={ character.id }>
                                                                                        <a href={ "https://myanimelist.net/character/" + character.id }> <img className="ui fluid image" src={ character.image } /> </a>
                                                                                      </div>
                                                     ) } 
                                                 </div>
                                               </div>
                  ) } 
            </div>
       : null } 
      </div>
		)
	}
}

User.propTypes = {
	username: React.PropTypes.string,
	most: React.PropTypes.array,
	requestVa: React.PropTypes.func.isRequired
}
