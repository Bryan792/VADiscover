import io from 'socket.io-client';

// ------------------------------------
// Constants
// ------------------------------------
export const REQUEST_VA = 'REQUEST_VA';
export const RECEIVE_PROFILE = 'RECEIVE_PROFILE';
export const RECEIVE_VA = 'RECEIVE_VA';
export const QUEUE_UPDATE = 'QUEUE_UPDATE';

// ------------------------------------
// Actions
// ------------------------------------
let socket;

export const requestVa = username =>
  function getData(dispatch, getState) {
    // todo: Is this the best way?
    if (socket) socket.disconnect();
    // fetch('https://yura.bryanching.net:8443/mal/' + getState().mal.username)

    dispatch({
      type: REQUEST_VA,
      username,
    });

    (function getDataR(usernameR, dispatchR, getStateR) {
      fetch(`https://yura.bryanching.net:8443/mal/${usernameR}`)
        .then(data => data.json())
        .then((text) => {
          // TODO: short circuit cancel here only works cause end of chain
          if (usernameR !== getStateR().user.username) return;
          dispatchR({
            type: RECEIVE_PROFILE,
            profile: text.profile,
          });
          if (text.last_updated === 'never') {
            // new user
            socket = io('https://yura.bryanching.net:8443');
            socket.on('connect', () => {
              socket.emit('username', usernameR);
            });
            socket.on('message', (msg) => {
              // TODO: another short circuit cancel here, maybe still race conditions with sockets
              if (usernameR !== getStateR().user.username) {
                socket.disconnect();
                return;
              }
              if (msg === 'done') {
                socket.disconnect();
                // todo: RECURSION
                getDataR(usernameR, dispatchR, getStateR);
              } else if (msg.startsWith('queueposition')) {
                const split = msg.split(' ');
                dispatchR({
                  type: QUEUE_UPDATE,
                  position: parseInt(split[1], 10),
                  total: parseInt(split[2], 10),
                });
              }
            });
          } else {
            dispatchR({
              type: RECEIVE_VA,
              response: text.response,
            });
          }
        });
    }(username, dispatch, getState));
  }
  ;

export const actions = {
  requestVa,
};

const initialState = {
  username: '',
  most: [],
  recommendations: [],
  loading: true,
  queuePosition: -2,
  queueSize: -1,
  profile: {},
};

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [REQUEST_VA]: (state, action) => ({
    ...initialState,
    username: action.username,
    loading: true,
  }),
  [RECEIVE_PROFILE]: (state, action) => ({
    ...state,
    profile: action.profile,
  }),
  [RECEIVE_VA]: (state, action) =>
    ({
      ...state,
      most: action.response.voice_actors,
      recommendations: action.response.recommendations,
      loading: false,
    }),
  [QUEUE_UPDATE]: (state, action) => ({
    ...state,
    queuePosition: action.position,
    queueSize: action.total,
    loading: true,
  }),
};

// ------------------------------------
// Reducer
// ------------------------------------
export default function reducer(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type];
  return handler ? handler(state, action) : state;
}
