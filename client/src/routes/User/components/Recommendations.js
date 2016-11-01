import React from 'react';

const Recommendations = ({recommendations}) => (
  <div>
    <h3 className="ui top attached header">Recommendations</h3>
    <div className="ui bottom attached segment">
      <div className="ui fluid ten column doubling grid">
        { recommendations.slice(0, 10).map(anime => <div className="column" key={ anime.animeId }>
                                                      <a href={ "https://myanimelist.net/anime/" + anime.animeId }> <img className="ui fluid image" src={ anime.image_url } /> </a>
                                                    </div>
        ) } 
      </div>
    </div>
  </div>
)

export default Recommendations;
