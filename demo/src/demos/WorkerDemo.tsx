import { createSignal, onMount, onCleanup, For, Show } from 'solid-js'
import { PRESETS, type PresetKey } from '../lib/presets'

interface QueryResult {
	columns: string[]
	values: unknown[][]
}

export default function WorkerDemo() {
	const [sql, setSql] = createSignal(PRESETS.basic.sql)
	const [results, setResults] = createSignal<QueryResult[]>([])
	const [logs, setLogs] = createSignal<string[]>([])
	const [error, setError] = createSignal<string | null>(null)
	const [ready, setReady] = createSignal(false)
	const [version, setVersion] = createSignal('')
	const [preset, setPreset] = createSignal<PresetKey>('basic')

	let worker: Worker | null = null
	let execId = 0

	const addLog = (msg: string) => setLogs(prev => [...prev, msg])

	onMount(() => {
		worker = new Worker(new URL('../workers/sqlite.worker.ts', import.meta.url), { type: 'module' })

		worker.onmessage = (e) => {
			const msg = e.data
			switch (msg.type) {
				case 'ready':
					setReady(true)
					setVersion(msg.version)
					addLog(`✓ SQLite ${msg.version} ready`)
					break
				case 'log': addLog(msg.message); break
				case 'error': setError(msg.message); addLog(`✗ ${msg.message}`); break
				case 'result': setResults(prev => [...prev, { columns: msg.columns, values: msg.values }]); break
				case 'exec-done': addLog('✓ Query completed'); break
			}
		}

		worker.postMessage({ type: 'init' })
	})

	onCleanup(() => {
		if (worker) {
			worker.postMessage({ type: 'close' })
			worker.terminate()
		}
	})

	const handleRun = () => {
		if (!worker || !ready()) return
		setError(null)
		setResults([])
		execId++
		worker.postMessage({ type: 'exec', sql: sql(), id: execId })
	}

	const handlePresetChange = (key: string) => {
		setPreset(key as PresetKey)
		setSql(PRESETS[key as PresetKey].sql)
		setResults([])
		setError(null)
	}

	return (
		<div class="demo-content">
			<div class="left-panel">
				<div class="toolbar">
					<select value={preset()} onChange={e => handlePresetChange(e.currentTarget.value)}>
						<For each={Object.entries(PRESETS)}>
							{([key, val]) => <option value={key}>{val.name}</option>}
						</For>
					</select>
					<span class="mode-badge">Worker</span>
					<Show when={version()}><span class="version-badge">v{version()}</span></Show>
					<button class="run-btn" onClick={handleRun} disabled={!ready()}>
						{ready() ? 'Run' : 'Loading...'}
					</button>
				</div>
				<textarea class="editor" value={sql()} onInput={e => setSql(e.currentTarget.value)} />
				<div class="logs"><For each={logs()}>{log => <div class="log-line">{log}</div>}</For></div>
			</div>

			<div class="right-panel">
				<Show when={error()}><div class="error">{error()}</div></Show>
				<For each={results()}>
					{result => (
						<table>
							<thead><tr><For each={result.columns}>{col => <th>{col}</th>}</For></tr></thead>
							<tbody>
								<For each={result.values}>
									{row => <tr><For each={row}>{cell => <td>{String(cell ?? 'NULL')}</td>}</For></tr>}
								</For>
							</tbody>
						</table>
					)}
				</For>
			</div>
		</div>
	)
}
