import { randomBytes } from  'node:crypto'
import { rmSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join as join_path } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'promisify-child-process'
import { test } from 'zora'
import { create_disposer } from './index.js'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const use_filepath = create_disposer({
	dispose: rm,
	dispose_on_exit: rmSync
})

const get_temporary_filepath = () => join_path(tmpdir(), randomBytes(16).toString('hex'))

test('disposes of reference after use fn promise resolves', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')
	await use_filepath(filepath, () => readFile(filepath, 'utf8'))
	try {
		await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
	} catch (error) {
		t.equal(error.code, 'ENOENT', 'file was removed')
	}
})

test('disposes of reference after use fn promise rejects', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')
	try {
		await use_filepath(filepath, () => {
			throw new Error('it was a bad time')
		})
	} catch (error) {
		try {
			await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
		} catch (error) {
			t.equal(error.code, 'ENOENT', 'file was removed')
		}
	}
})

test('passes reference to use fn', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')
	let reference
	await use_filepath(filepath, x => {
		reference = x
	})
	t.equal(reference, filepath)
})

test('returns use fn return value', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')
	t.equal(
		await use_filepath(filepath, async () => 'abc123, u n me gurl'),
		'abc123, u n me gurl'
	)
})

test('diposes of reference if process is killed with SIGINT when use fn promise has neither fulfilled nor rejected', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')

	const code = `
		import { rmSync } from 'node:fs'
		import { rm } from 'node:fs/promises'
		import { create_disposer } from './index.js'

		const use_filepath = create_disposer({
			dispose: rm,
			dispose_on_exit: rmSync
		})

		use_filepath("${filepath}", () => new Promise(resolve => setTimeout(resolve, 100000)))
	`

	const proc = spawn('node', [ '--eval', code, '--input-type', 'module' ], { encoding: 'utf8', cwd: __dirname })
	await new Promise(resolve => setTimeout(resolve, 500))
	proc.kill('SIGINT')
	await proc
		.catch(error => {
			if (error.signal === 'SIGINT') {
				return error
			}
			throw error
		})
	try {
		await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
	} catch (error) {
		t.equal(error.code, 'ENOENT', `file was removed: ${filepath}`)
	}
})

test('diposes of reference if process is killed with SIGTERM when use fn promise has neither fulfilled nor rejected', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')

	const code = `
		import { rmSync } from 'node:fs'
		import { rm } from 'node:fs/promises'
		import { create_disposer } from './index.js'

		const use_filepath = create_disposer({
			dispose: rm,
			dispose_on_exit: rmSync
		})

		use_filepath("${filepath}", () => new Promise(resolve => setTimeout(resolve, 100000)))
	`

	const proc = spawn('node', [ '--eval', code, '--input-type', 'module' ], { encoding: 'utf8', cwd: __dirname })
	await new Promise(resolve => setTimeout(resolve, 500))
	proc.kill('SIGTERM')
	await proc
		.catch(error => {
			if (error.signal === 'SIGTERM') {
				return error
			}
			throw error
		})
	try {
		await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
	} catch (error) {
		t.equal(error.code, 'ENOENT', `file was removed: ${filepath}`)
	}
})

test('diposes of reference if process is killed with SIGUSR2 when use fn promise has neither fulfilled nor rejected', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')

	const code = `
		import { rmSync } from 'node:fs'
		import { rm } from 'node:fs/promises'
		import { create_disposer } from './index.js'

		const use_filepath = create_disposer({
			dispose: rm,
			dispose_on_exit: rmSync
		})

		use_filepath("${filepath}", () => new Promise(resolve => setTimeout(resolve, 100000)))
	`

	const proc = spawn('node', [ '--eval', code, '--input-type', 'module' ], { encoding: 'utf8', cwd: __dirname })
	await new Promise(resolve => setTimeout(resolve, 500))
	proc.kill('SIGUSR2')
	await proc
		.catch(error => {
			if (error.signal === 'SIGUSR2') {
				return error
			}
			throw error
		})
	try {
		await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
	} catch (error) {
		t.equal(error.code, 'ENOENT', `file was removed: ${filepath}`)
	}
})

test('diposes of reference if process is killed with SIGHUP when use fn promise has neither fulfilled nor rejected', async t => {
	const filepath = get_temporary_filepath()
	await writeFile(filepath, '')

	const code = `
		import { rmSync } from 'node:fs'
		import { rm } from 'node:fs/promises'
		import { create_disposer } from './index.js'

		const use_filepath = create_disposer({
			dispose: rm,
			dispose_on_exit: rmSync
		})

		use_filepath("${filepath}", () => new Promise(resolve => setTimeout(resolve, 100000)))
	`

	const proc = spawn('node', [ '--eval', code, '--input-type', 'module' ], { encoding: 'utf8', cwd: __dirname })
	await new Promise(resolve => setTimeout(resolve, 500))
	proc.kill('SIGHUP')
	await proc
		.catch(error => {
			if (error.signal === 'SIGHUP') {
				return error
			}
			throw error
		})
	try {
		await readFile(filepath)
		t.fail(`file still exists: ${filepath}`)
	} catch (error) {
		t.equal(error.code, 'ENOENT', `file was removed: ${filepath}`)
	}
})
