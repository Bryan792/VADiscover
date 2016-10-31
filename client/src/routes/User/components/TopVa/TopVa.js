import React from 'react';

import VaCard from './VaCard';

const TopVa = ({most}) => (
  <div>
    <h3 className="ui header">Top VAs</h3>
    <div className="ui segment">
      <div className="ui divided items">
        { most.slice(0, 5).map(actor => 
        <VaCard key={actor.actor.id} id={actor.actor.id} imageUrl={actor.actor.image_url} name={actor.actor.name} averageScore={actor.average_score} count={actor.count} character={actor.character} />
        ) } 
      </div>
    </div>
  </div>
)

export default TopVa;
