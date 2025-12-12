/* @refresh reload */
import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import { lazy } from 'solid-js'
import './index.css'
import App from './App'

const MainThreadDemo = lazy(() => import('./demos/MainThreadDemo'))
const WorkerDemo = lazy(() => import('./demos/WorkerDemo'))
const OpfsDemo = lazy(() => import('./demos/OpfsDemo'))

const root = document.getElementById('root')

render(
	() => (
		<Router root={App}>
			<Route path="/" component={MainThreadDemo} />
			<Route path="/worker" component={WorkerDemo} />
			<Route path="/opfs" component={OpfsDemo} />
		</Router>
	),
	root!
)
