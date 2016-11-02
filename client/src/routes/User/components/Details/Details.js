import React, {Component} from 'react';

import DetailsRow from './DetailsRow';

export default class Details extends Component {

  componentDidMount() {
    $('.ui.accordion')
      .accordion({exclusive: false})
    ;
  }

  render() {
    return (
      <div>
        <h3 className="ui top attached header">Details</h3>
        <div className="ui bottom attached fluid accordion segment">
          { this.props.most.map((actor, index) => <DetailsRow key={ actor.actor.id} id={ actor.actor.id } imageUrl={ actor.actor.image_url } name={ actor.actor.name } shouldShowTooltip={ index == 0 } maxCharacterLength={ Math.max.apply(Math, this.props.most.map(actor => actor.character.length)) }
                                         character={ actor.character } />
            
          ) } 
        </div>
      </div>
    )
  }
}

