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
        <div className="ui segment">
        <div className="ui equal width grid">
            <div className="right aligned column">
              <a href={ "https://myanimelist.net/profile/" + this.props.username } className="iu image"> <img src={ this.props.profile.avatar_url } /> </a>
            </div>
            <div className="column">
            <div className="ui huge header"> {this.props.username} </div>
            </div>
        </div>
        </div>
				<div className="ui segment">
				{this.props.isLoading ? 
        <div className="ui active inverted dimmer">
          <div className="ui text loader">{this.props.queueSize > 0 ? "Position " + this.props.queuePosition + " of " + this.props.queueSize : ""}</div>
		 	  </div>
				: null }
        { this.props.most
          ? <div className="ui divided items">
                { this.props.most.map(actor => <div className="ui item" key={ actor.actor.id }>
                                                 <a href={ "https://myanimelist.net/people/" + actor.actor.id } className="image"> <img src={ actor.actor.image_url } /> </a>
                                                 <div className="content">
                                                   <div className="header"> { actor.actor.name } </div>
                                                   <div className="meta">
                                                     Seen in <span style={{fontWeight: 'bold'}}>{actor.count}</span> shows{actor.average_score > 0 ? <span> with an average score of <span style={{fontWeight: 'bold'}}>{ actor.average_score }</span></span> : null}
                                                   </div>
                                                   <div className="ui progress">
                                                     <div className="bar" style={{width: actor.character.length * 100/Math.max.apply(Math, this.props.most.map(actor => actor.character.length))+"%" }}>
																										 	<div className="progress">{actor.character.length}</div>
  																									</div>
																									</div>
                                                 <div className="ui fluid ten column doubling grid">
                                                   { actor.character.map(character => <div className="column" key={ character.id }>
                                                                                        <a href={ "https://myanimelist.net/character/" + character.id }> <img className="ui fluid image" src={ character.image } /> </a>
                                                                                      </div>
                                                     ) } 
  </div>
  </div>
                                               </div>
                  ) } 
            </div>
       : null } 
				</div>
      </div>
		)
	}
}

User.propTypes = {
	username: React.PropTypes.string,
	most: React.PropTypes.array,
	isLoading: React.PropTypes.bool,
	requestVa: React.PropTypes.func.isRequired,
	queuePosition: React.PropTypes.number,
	queueSize: React.PropTypes.number,
  profile: React.PropTypes.object,
}
