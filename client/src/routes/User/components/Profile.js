import React, { PropTypes } from 'react';

const Profile = (prop) => (
  <div className="ui segment">
    <div className="ui equal width grid">
      <div className="right aligned column">
        <a href={ "https://myanimelist.net/profile/" + prop.username } className="iu image"> <img src={ prop.profile.avatar_url } /> </a>
      </div>
      <div className="column">
        <div className="ui huge header">
          { prop.username } </div>
      </div>
    </div>
  </div>
)

export default Profile;
