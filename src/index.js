/*
	All consumers of this module share process event listners and one global state because it's efficient and should have no negative consequence.
	Otherwise, there would potentially be many needless event listeners and possibly surprising warnings:
	https://nodejs.org/dist/latest-v18.x/docs/api/events.html#eventsdefaultmaxlisteners
*/
const exit_dispose_fns = new Map()

const handle_exit_signal = signal => {
	process.off('SIGTERM', handle_exit_signal)
	process.off('SIGINT', handle_exit_signal)
	for (const [ id, dispose ] of exit_dispose_fns) {
		dispose()
	}
	// NOTE: you must do this to forward the signal on, otherwise this listener intercepts the signal and stops the process from exiting
	process.kill(process.pid, signal)
}

process.on('SIGTERM', handle_exit_signal)
process.on('SIGINT', handle_exit_signal)

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
