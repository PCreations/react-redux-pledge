import { createPledge } from '../../../lib'
import { fetchPosts } from '../actions'

export const createPledgeOnPosts = (reddit) => createPledge(
    `pledgeOnPostsFor${reddit}`,
    (state) => {
        const posts = state.postsByReddit[reddit]
        if (!posts) {
          return false
        }
        return !posts.didInvalidate
    },
    () => fetchPosts(reddit)
)