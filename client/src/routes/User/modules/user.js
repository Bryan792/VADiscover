import io from 'socket.io-client'

// ------------------------------------
// Constants
// ------------------------------------
export const REQUEST_VA = 'REQUEST_VA'
export const RECEIVE_VA = 'RECEIVE_VA'
export const QUEUE_UPDATE = 'QUEUE_UPDATE'

// ------------------------------------
// Actions
// ------------------------------------
let socket = null;

export const requestVa = (username) => {
  return function getData(dispatch, getState) {
    //todo: Is this the best way?
    if (socket) socket.disconnect();
    //fetch('https://yura.bryanching.net:8443/mal/' + getState().mal.username)
    
    dispatch({
      type: REQUEST_VA,
      username: username,
    });
    (function getDataR(username, dispatch, getState) {
    fetch('https://yura.bryanching.net:8443/mal/' + username)
      .then(data => data.json())
      .then(text => {
        //TODO: short circuit cancel here only works cause end of chain
        if (username != getState().user.username) return; 
        if (text.last_updated === "never") {
          //new user
          socket = io("https://yura.bryanching.net:8443");
          socket.on('connect', () => {
            socket.emit('username', username);
          });
          socket.on('message', (msg) => {
            //TODO: another short circuit cancel here, maybe still race conditions with sockets
            if (username != getState().user.username) {
              socket.disconnect();
              return; 
            }
            if (msg === "done") {
              socket.disconnect();
              //todo: RECURSION
              getDataR(username, dispatch, getState);
            } else if (msg.startsWith("queueposition")) {
              let split = msg.split(" ");
              dispatch({
                type: QUEUE_UPDATE,
                position: parseInt(split[1]),
                total: parseInt(split[2]),
              });
            }
          });
        } else {
          dispatch({
            type: RECEIVE_VA,
            payload: text,
          })
        }
      });
    })(username, dispatch, getState)
  }
}

export const actions = {
  requestVa,
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_VA]: (state, action) => ({
    ...initialState, 
    username: action.username,
    loading: true,
  }),
  [RECEIVE_VA]: (state, action) => {
    return ({
      ...state,
      most: action.payload.response,
    loading: false,
    });
  },
  [QUEUE_UPDATE]: (state, action) => ({
    ...state,
    queuePosition: action.position,
    queueSize: action.total,
    loading: true,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  username: '',
  most: [],
  loading: true,
  queuePosition: -1,
  queueSize: -1,
};
export default function reducer(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]
  return handler ? handler(state, action) : state
}
