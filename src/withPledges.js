import React from 'react'
import { connect } from 'react-redux'
import createEagerFactory from 'recompose/createEagerFactory'
import renderComponent from 'recompose/renderComponent'
import shallowEqual from 'recompose/shallowEqual'
import _find from 'lodash/find'
import _includes from 'lodash/includes'
import _isequal from 'lodash/isequal'
import createPledgeAction from './createPledgeAction'

const withPledges = (pledges, loading) => BaseComponent => {

    let resolvingPledges = []

    class PledgeContainer extends React.Component {
        constructor(props, context) {
            super(props, context)
        }

        handlePledges(props) {
            if (resolvingPledges.length == 0) {
                this.componentFactory = this.componentFactory || createEagerFactory(BaseComponent)
                this.factory = this.componentFactory
            }
            else {
                this.loadingFactory = this.loadingFactory || createEagerFactory(
                    renderComponent(loading)(BaseComponent)
                )
                this.factory = this.loadingFactory
                if (props.needResolving) {
                    props.resolvePledges()
                }
            }
        }

        componentWillMount() {
            this.handlePledges(this.props)
        }

        componentWillReceiveProps(nextProps) {
            this.handlePledges(nextProps)
        }

        render() {
            return this.factory(this.props)
        }
    }

    PledgeContainer.contextTypes = {
        store: React.PropTypes.object
    }
    PledgeContainer.propTypes = {
        store: React.PropTypes.object
    }

    return connect(
        (_, initialProps) => (state) => {
            let pledgesToResolve = []
            for (let pledgesArray of pledges) {
                if (pledgesToResolve.length == 0) {
                    for (let pledge of pledgesArray) {
                        pledge = typeof pledge === "function" ? pledge(state, initialProps) : pledge
                        if (!pledge.isResolved(state)) {
                            pledgesToResolve.push(pledge)
                        }
                    }
                }
            }
            return { pledgesToResolve }
        },
        null,
        (stateProps, dispatchProps, ownProps) => {
            const { dispatch } = dispatchProps
            const { pledgesToResolve } = stateProps
            if (pledgesToResolve.length == 0) {
                resolvingPledges = []
                return {
                    ...ownProps,
                    ...stateProps,
                    ...dispatchProps
                }
            }
            let actions = []
            /*
                1): all pledges to resolve not already resolving need to be added to
                    the resolvingPledges array and their action to be pushed to the
                    actions array
                2): resolving pledges that are not in pledgesToResolve anymore need
                    to be removed from resolvingPledges array.
            */
            for (let pledge of pledgesToResolve) {
                if (typeof _find(resolvingPledges, (name) => name === pledge.name) === "undefined") {
                    resolvingPledges.push(pledge.name)
                    actions.push(pledge.getAction())
                }
            }

            resolvingPledges = resolvingPledges.filter(name => _includes(pledgesToResolve.map(p => p.name), name))
            return {
                ...ownProps,
                ...stateProps,
                ...dispatchProps,
                needResolving: actions.length > 0,
                resolvePledges() {
                    dispatch(createPledgeAction(actions))
                }
            }
        }
    )(PledgeContainer)
}

export default withPledges