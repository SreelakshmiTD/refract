import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { withEffects } from 'refract-xstream'
import xs from 'xstream'
// import fromPromise from 'xstream-from-promise'
// import { filter, flatten, map, merge, combine, pipe } from 'xstream-basics'

import Layout from './Layout'
import { actionCreators, actionTypes, selectors } from './store'
import store from './setupStore'

const effectHandler = ({ store }) => effect => {
    if (effect.type === actionTypes.ERROR_RECEIVE) {
        console.log(effect)
    }

    if (effect.type === actionTypes.USER_RECEIVE) {
        store.dispatch(effect)
    }

    if (effect.type === actionTypes.USER_SELECT) {
        store.dispatch(effect)
    }
}

const effectFactory = ({ store }) => () => {
    const combined$ = xs.combine(
        store.observe(actionTypes.USER_REQUEST),
        store.observe(selectors.getUsers)
    )

    const requestUser$ = combined$
        .filter(([request, users]) => !Boolean(users[request.payload]))
        .map(([{ payload: username }]) =>
            xs.fromPromise(
                fetch(`https://api.github.com/users/${username}`).then(res =>
                    res.json()
                )
            )
        )
        .flatten()
        .map(
            ({ message, ...response }) =>
                Boolean(message)
                    ? actionCreators.receiveError(message)
                    : actionCreators.receiveUser(response)
        )

    const selectUser$ = combined$
        .filter(([request, users]) => Boolean(users[request.payload]))
        .map(([{ payload }]) => payload)
        .map(actionCreators.selectUser)

    return xs.merge(requestUser$, selectUser$)
}

const App = withEffects(effectHandler)(effectFactory)(Layout)

render(
    <Provider store={store}>
        <App store={store} />
    </Provider>,
    document.getElementById('root')
)