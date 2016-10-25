import { injectReducer } from '../../store/reducers'

export default (store) => ({
  path : '/:userId',
  /*  Async getComponent is only invoked when route matches   */
  getComponent (nextState, cb) {
    /*  Webpack - use 'require.ensure' to create a split point
        and embed an async module loader (jsonp) when bundling   */
    require.ensure([], (require) => {
      /*  Webpack - use require callback to define
          dependencies for bundling   */
      const User = require('./containers/UserContainer').default
      const reducer = require('./modules/user').default

      /*  Add the reducer to the store on key 'mal'  */
      injectReducer(store, { key: 'user', reducer })

      /*  Return getComponent   */
      cb(null, User)

    /* Webpack named bundle   */
    }, 'usr')
  }
})
