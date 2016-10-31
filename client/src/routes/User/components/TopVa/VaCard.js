import React from 'react';

const VaCard = ({id, imageUrl, name, averageScore, count, character}) => (
  <div className="ui item">
    <a href={ "https://myanimelist.net/people/" + id } className="image"> <img src={ imageUrl } /> </a>
    <div className="content">
      <div className="header">
        { name } </div>
      <div className="meta"> Seen in <span style={ { fontWeight: 'bold' } }>{ count }</span> shows
        { averageScore > 0 ? <span> with an average score of <span style={ { fontWeight: 'bold' } }>{ averageScore }</span></span> : null } </div>
      <div className="ui fluid ten column doubling grid">
        { character.map(character => <div className="column" key={ character.id }>
                                       <a href={ "https://myanimelist.net/character/" + character.id }> <img className="ui fluid image" src={ character.image } /> </a>
                                     </div>
          ) } </div>
    </div>
  </div>
)

export default VaCard
