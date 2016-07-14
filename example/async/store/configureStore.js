import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import { pledgesMiddleware } from '../../../lib'
import createLogger from 'redux-logger'
import rootReducer from '../reducers'

export default function configureStore(preloadedState) {
  const store = createStore(
    rootReducer,
    preloadedState,
    applyMiddleware(thunkMiddleware, createLogger(), pledgesMiddleware)
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
