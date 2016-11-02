import React from 'react';
import styles from './DetailsRow.scss'

const DetailsRow = ({id, shouldShowTooltip, imageUrl, name, character, maxCharacterLength}) => (
  <div className={styles.blackOnHover}>
    <div className={ `title ${shouldShowTooltip ? "active" : ""}` } data-tooltip={shouldShowTooltip ? "Click me to Expand/Collapse" : null }>
      <div className="ui items">
        <div className="ui item">
          <a href={ "https://myanimelist.net/people/" + id } className="ui mini image"> <img src={ imageUrl } /> </a>
          <div className="content">
            <div className="header"> { name } </div>
            <div className={`ui progress ${styles.noMargin}`}>
              <div className="bar" style={ { width: character.length * 100 / maxCharacterLength  + "%" } }>
                <div className="progress">{ character.length } </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={ `content ${shouldShowTooltip ? "active" : ""}` }>
      <div className="ui fluid ten column doubling grid">
        { character.map(character => <div className="column" key={ character.id }>
                                       <a href={ "https://myanimelist.net/character/" + character.id }> <img className="ui fluid image" src={ character.image } /> </a>
                                     </div>
          ) } </div>
    </div>
  </div>
)

export default DetailsRow;
