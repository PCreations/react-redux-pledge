# react-redux-pledge
Enhance your redux-connected component by rendering them only when their props are guaranteed (i.e, relative data are fetched)


# DO NOT USE IN PRODUCTION
This project is a draft, do not use it in production since it's not tested nor used in production project


# MOTIVATIONS
When building a react / redux application you want to keep your components as small as possible, and unaware of others components. Managing data dependency can be tedious is some case. Have you ever seen yourself adding many `componentWillMount` with such `if (typeof this.props.idOfMyObject === "undefined") { this.props.fetchMyObject(id) }` tests and rendering a loading spinner or your component ? When building a medium application, I always have to do this, furthemore, theses conditions are often copied pasted in other component because they also need these props ! You're ending up writing component that need some `isMyDataFetched` and `fecthMyData()` props all over your app. What if we could isolate these "requirements" in order to decorate any connected component to ensure them to have the required data before rendering, or rendering a spinner if not ? It's exactly what react-redux-pledge is about.


# USAGE

Installation:

```shell
npm install react-redux-pledge --save-dev
```

## What is a "pledge" ?
You already know what a `reducer`, an `action creator` or a `selector` is. React-redux-pledge introduces the notion of `pledge` (a better word would be a Promise but, for obvious reason, I chosen "pledge" ;) ). **A `pledge` is an object that know if a slice of your state is valid and if not, how to make it valid**

```javascript
/* A typical pledge object */
const pledge = {
    name,
    isResolved(state) { ... },
    getAction() { ... }
}
```
`name` is a unique identifier for this pledge.
`isResolved` receive the global state as an argument, you can select a slice of the state and return `true` if this slice need to be considered valid of `false` otherwise.
`getAction` should returns the action that need to be dispatched in order to make the slice of the state handled by this *pledge* valid (typically an action creator initiating an api request).

To create a pledge, you can use the `createPledge` helper that accepts the `name` argument and the two functions above :

```javascript
import { createPledge } from 'react-redux-pledge'

const myPledge = createPledge(
    'myPledge',
    (state) => is resolved condition
    () => { type: 'SOME_ACTION_TYPE' }
)
```

## Enhance your connected component with the `withPledges` higher-order component
Since an example is worth a thousand words, here it is, **without react-redux-pledge**

Todo.js
```javascript
const Todo = ({ text }) => <li>{text}</li>
```

TodoList.js
```javascript
class TodoList extends React.Component {

    componentWillMount() {
        if (this.props.areAllTodosFetched === false) {
            this.props.fetchTodos()
        }
    }

    render() {
        return this.props.areAllTodosFetched ? (
            this.props.todos.map(t => <Todo key={t.id} text={t.text}/>)
        ) : (
            <Spinner/>
        )
    }
}

TodoList.propTypes = {
    areAllTodosFetched: React.PropTypes.bool,
    todos: React.PropTypes.arrayOf(React.PropTypes.object),
    fetchTodos: React.PropTypes.func
}

export default connect(
    (state) => ({
        areAllTodosFetched: areAllTodosFetched(state),
        todos: getTodos(state),
    }),
    (dispatch) => ({
        fetchTodos: () => dispatch(fetchTodos())
    })
)(TodoList)
```

The relevant [duck](https://github.com/erikras/ducks-modular-redux) :
todos.js
```javascript
const types = {
    TODOS_REQUESTED: 'TODOS_REQUESTED',
    TODOS_RECEIVED: 'TODOS_RECEIVED',
}

const initialState = {
    areAllTodosFetched: false,
    todos: {}  //id ordered map of todos
}

const reducer = (state = initialState, action = {}) => {
    switch(action.type) {
        case types.TODOS_RECEIVED:
            return {
                areAllTodosFetched: true,
                todos: { ...action.todos }
            }
    }
}

const fetchAll = () => {(
    type: types.TODOS_REQUESTED
)}

const receiveAll = (todos) => {(
    type: types.TODOS_RECEIVED,
    todos
)}

const areAllTodosFetched = (state) => state.areAllTodosFetched
const getTodos = (state) => Object.values(state.todos)
```

sagas.js
```javascript
// I'm using [redux-saga](https://github.com/yelouafi/redux-saga) to manage side effects
// The following should be in another file

function *fetchAllTodosRequested() {
    yield take(types.TODOS_REQUESTED)
    try {
        const todos = yield call(fetch('http://example.api/todos/'))
        yield put(receiveAll(todos))
    } catch (err) { console.err("error fetching todos") }
}

function *watchFetchAllTodosRequested() {
    while(true) {
        yield call(takeLatest, types.TODOS_REQUESTED, fetchAllTodosRequested)
    }
}

function* root() {
  yield [ fork(watchFetchAllTodosRequested) ]
}
```

In this example, The `TodoList` shouldn't have to worry about it's data dependencies and relevant fetching, and that's the whole point of using `pledges`, let's rewrite only the relevant part with `react-redux-pledge`. First, we need to define a `pledge` in the duck :

todos.js
```javascript
import { createPledge } from 'react-redux-pledge'

[...]  // same code as above

const pledgeOnAllTodosFetched = createPledge(
    'pledgeOnAllTodosFetched',
    (state) => state.areAllTodosFetched,
    () => fetchAll()
)
```

TodoList.js
```javascript
import { withPledges } from 'react-redux-pledge'
import { pledgeOnAllTodosFetched } from './todos'
import Spinner from './someSpinnerComponent'

const TodoList = ({ todos }) => todos.map(t => <Todo key={t.id} text={t.text}/>)

TodoList.propTypes = {
    todos: React.PropTypes.arrayOf(React.PropTypes.object),
}

const enhancer = withPledges([[pledgeOnAllTodosFetched]], Spinner)  // notice the array of array here, more on this bellow

export default connect(
    (state) => ({
        todos: getTodos(state),
    }),
)(enhance(TodoList))
```

configureStore.js
```
import { pledgeMiddleware } from 'react-redux-pledge'
const store = createStore(
    [...]
    applyMiddleware(pledgesMiddleware)
    [...]
)
```

# HOW DOES IT WORK ?

The `withPledges` HoC (kudos to [recompose/branch](https://github.com/acdlite/recompose/blob/master/src/packages/recompose/branch.js) for the inspiration) does all the work. Here is its api :


### `withPledges`

```js
withPledges(
  pledges: Array,
  loading: ReactComponent,
): HigherOrderComponent
```

Accepts an **array of array** of pledges to be resolved before the component can be rendered. Each entry should be an array of pledges that can be run concurently. Other pledges are only run **after previous pledges are resolved**, example :

```js
withPledges([[pledge1,pledge2], [pledge3]], Spinner)(BaseComponent)  //pledge3 will be resolved only after pledge1 and pledge2 are resolved
```

Instead of a plain pledge object, you can pass a function, this fonction will be passed the `initialProps`  of the component of which this pledge is attached to and the current `state`, you can think of this function as a pledge factory. Example:

todo.js
```js
import Spinner from './someSpinnerComponent'

const Todo = ({ id, text }) => <li>`id: ${id}, text: ${text}`</li>

const enhance = withPledges([[
    (state, initialProps) => createPledgeOnTodo(initialProps.id)
]], Spinner)

export default connect((state, { id }) => getTodo(state, id))(enhance(Todo))
```

todos.js
```js
import { createPledge } from 'react-redux-pledge'

/* here we export a pledge factory instead of a pledge */
export const createPledgeOnTodo = (id) => createPledge(
    `pledgeOnTodo${id}`,
    (state) => typeof getTodo(state, id) !== "undefined",
    () => fetchTodo(id)
)
```


Actions to be dispatched are retrieved from pledges, then, a special `RESOLVE_PLEDGES` action is dispatched, containing the actions to dispatch in order to resolve these pledges. **Not triggering directly the actions returned by the pledges lets us dispatch actions only once, without worrying about multiple pledges requesting for the same actions**


### `createPledge`

The `createPledge(isResolved, getAction)` accepts the pledge's name as a first argument and two functions :
 - `name` uniquely identifies this pledge for this component
 - `isResolved(state)` should returns if this pledge is valid depending on the `state` received as argument.
 - `getAction()` should return the action that need to be dispatched in order to make the state valid for this pledge