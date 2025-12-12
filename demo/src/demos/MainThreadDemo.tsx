import { createSignal, For, Show, onMount } from 'solid-js'
import { initDb, runQuery, getVersion, type QueryResult } from '../lib/db'
import { PRESETS, type PresetKey } from '../lib/presets'

export default function MainThreadDemo() {
	const [sql, setSql] = createSignal(PRESETS.basic.sql)
	const [results, setResults] = createSignal<QueryResult[]>([])
	const [error, setError] = createSignal<string | null>(null)
	const [preset, setPreset] = createSignal<PresetKey>('basic')
	const [logs, setLogs] = createSignal<string[]>([])
	const [version, setVersion] = createSignal('')
	const [ready, setReady] = createSignal(false)

	const addLog = (msg: string) => setLogs((prev: string[]) => [...prev, msg])

	onMount(async () => {
		addLog('Initializing SQLite...')
		await initDb()
		const v = getVersion()
		if (v) {
			setVersion(v)
			addLog(`✓ SQLite ${v} ready (main thread)`)
		}
		setReady(true)
	})

	const handleRun = () => {
		if (!ready()) return
		setError(null)
		addLog('Executing query...')
		try {
			const start = performance.now()
			const res = runQuery(sql())
			const elapsed = (performance.now() - start).toFixed(1)
			setResults(res)
			addLog(`✓ Query completed in ${elapsed}ms`)
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e)
			setError(msg)
			addLog(`✗ Error: ${msg}`)
			setResults([])
		}
	}

	const handlePresetChange = (key: string) => {
		setPreset(key as PresetKey)
		setSql(PRESETS[key as PresetKey].sql)
		setResults([])
		setError(null)
		addLog(`Loaded preset: ${PRESETS[key as PresetKey].name}`)
	}

	return (
		<div class="demo-content">
			<div class="left-panel">
				<div class="toolbar">
					<select value={preset()} onChange={(e) => handlePresetChange(e.currentTarget.value)}>
						<For each={Object.entries(PRESETS)}>
							{([key, val]) => <option value={key}>{val.name}</option>}
						</For>
					</select>
					<span class="mode-badge">Main Thread</span>
					<Show when={version()}><span class="version-badge">v{version()}</span></Show>
					<button class="run-btn" onClick={handleRun} disabled={!ready()}>
						{ready() ? 'Run' : 'Loading...'}
					</button>
				</div>
				<textarea class="editor" value={sql()} onInput={(e) => setSql(e.currentTarget.value)} />
				<div class="logs"><For each={logs()}>{(log: string) => <div class="log-line">{log}</div>}</For></div>
			</div>

			<div class="right-panel">
				<Show when={error()}><div class="error">{error()}</div></Show>
				<For each={results()}>
					{(result: QueryResult) => (
						<table>
							<thead><tr><For each={result.columns}>{(col: string) => <th>{col}</th>}</For></tr></thead>
							<tbody>
								<For each={result.values}>
									{(row: unknown[]) => <tr><For each={row}>{(cell: unknown) => <td>{String(cell ?? 'NULL')}</td>}</For></tr>}
								</For>
							</tbody>
						</table>
					)}
				</For>
			</div>
		</div>
	)
}
