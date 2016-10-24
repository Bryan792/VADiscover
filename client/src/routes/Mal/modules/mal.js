// ------------------------------------
// Constants
// ------------------------------------
export const REQUEST_VA = 'REQUEST_VA'
export const RECEIVE_VA = 'RECEIVE_VA'

// ------------------------------------
// Actions
// ------------------------------------
export const requestVa = (username) => {
  return (dispatch, getState) => {
    //fetch('https://yura.bryanching.net:8443/mal/' + getState().mal.username)
    fetch('https://yura.bryanching.net:8443/mal/' + username)
      .then(data => data.json())
      .then(text => dispatch({
        type: RECEIVE_VA,
        payload: text,
      }));

    dispatch({
      type: REQUEST_VA,
    });

  }
}

export const actions = {
  requestVa,
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_VA]: (state, action) => {
    return ({...state,
      username: ""
    });
  },
  [RECEIVE_VA]: (state, action) => {
    return ({...state,
      most: action.payload
    });
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  username: '',
  most: [],
};
export default function counterReducer(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
