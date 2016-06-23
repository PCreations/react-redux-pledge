import React from 'react'
import { connect } from 'react-redux'
import createEagerFactory from 'recompose/createEagerFactory'
import renderComponent from 'recompose/renderComponent'
import _find from 'lodash/find'
import createPledgeAction from './createPledgeAction'

const withPledges = (pledges, loading) => BaseComponent => {

    class PledgeContainer extends React.Component {
        constructor(props, context) {
            super(props, context)
            this.handlePledges(props)
        }

        handlePledges(props) {
            if (this.props.actions.length == 0) {
                this.componentFactory = this.componentFactory || createEagerFactory(BaseComponent)
                this.factory = this.componentFactory
            }
            else {
                this.loadingFactory = this.loadingFactory || createEagerFactory(
                    renderComponent(loading)(BaseComponent)
                )
                this.factory = this.loadingFactory
            }
        }

        componentWillMount() {
            if (this.props.actions.length > 0) {
                this.props.resolvePledges(this.props.actions)
            }
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
        (state, props) => {
            let actions = []
            const unresolvedConcurrentPledges = _find(
                pledges, pledgesArray => pledgesArray.some(
                    p => typeof p === "function" ? !p(props).isResolved(state) : !p.isResolved(state)
                )
            )
            if (typeof unresolvedConcurrentPledges !== "undefined") {
                unresolvedConcurrentPledges.map(
                    p => typeof p === "function" ? actions.push(p(props).getAction()) : actions.push(p.getAction())
                )
            }
            else {
                actions = []
            }
            return { actions }
        },
        (dispatch) => ({
            resolvePledges(ownActions) {
                dispatch(createPledgeAction(ownActions))
            }
        })
    )(PledgeContainer)
}

export default withPledges