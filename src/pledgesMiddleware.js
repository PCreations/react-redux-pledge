import _find from 'lodash/find'
import _isequal from 'lodash/isequal'
import { RESOLVE_PLEDGES_ACTION } from './actionType'


let actionsAlreadyPut = {}

const pledgesMiddleware = ({ dispatch }) => next => action => {
    if (action.type == RESOLVE_PLEDGES_ACTION) {
        const { actions } = action
        for (let a of actions) {
            dispatch(a)
        }
    }
    return next(action)
}

export default pledgesMiddleware