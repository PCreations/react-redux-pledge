import { RESOLVE_PLEDGES_ACTION } from './actionType'

const createPledgeAction = (actions) => ({
    type: RESOLVE_PLEDGES_ACTION,
    actions
})

export default createPledgeAction