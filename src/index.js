const signals = [ 'SIGINT', 'SIGTERM', 'SIGUSR2', 'SIGHUP' ]

/*
	All consumers of this module share process event listners and one global state because it's efficient and should have no negative consequence.
	Otherwise, there would potentially be many needless event listeners and possibly surprising warnings:
	https://nodejs.org/dist/latest-v18.x/docs/api/events.html#eventsdefaultmaxlisteners
*/
const exit_dispose_fns = new Map()

const on_exit = signal => {
	process.off('exit', on_exit)
	for (const [ id, dispose ] of exit_dispose_fns) {
		dispose()
	}
}

const on_signal = signal => {
	if (process.listenerCount(signal) === 1) {
		signals.forEach(signal => process.off(signal, on_signal))
		process.exit(0)
	}
}

signals.forEach(signal => process.on(signal, on_signal))

process.on('exit', on_exit)

export const create_disposer = ({ dispose, dispose_on_exit }) => {
	return async (reference, use) => {
		const id = Symbol()
		exit_dispose_fns.set(id, () => dispose_on_exit(reference))
		try {
			return await use(reference)
		} finally {
			exit_dispose_fns.delete(id)
			await dispose(reference)
		}
	}
}
