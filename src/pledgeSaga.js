import _includes from 'lodash/includes'
import _isEqual from 'lodash/isequal'
import { take, put } from 'redux-saga/effects'
import { RESOLVE_PLEDGES_ACTION } from './actionType'
import createPledgeAction from './createPledgeAction'

function *pledgeSaga() {
    let actionsAlreadyPut = []
    while (true) {
        let { actions } = yield take(RESOLVE_PLEDGES_ACTION)
        actions = actions.filter(action => !_includes(actionsAlreadyPut, action, _isEqual))
        for (let action of actions) {
            yield put(action)
            actionsAlreadyPut.push(action)
        }
    }
}

export default pledgeSaga