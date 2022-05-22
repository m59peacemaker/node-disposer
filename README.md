# @m59/disposer

Create a disposer function that uses a reference and cleans it up afterward.

```node
import { create_disposer } from '@m59/disposer'
```

<!--js
import { create_disposer } from './index.js'
-->

```js
import { randomBytes } from  'node:crypto'
import { rmSync } from 'node:fs'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join as join_path } from 'node:path'
import { tmpdir } from 'node:os'

// Create the disposer function.
const use_filepath = create_disposer({
	// Dispose of the reference normally.
	dispose: rm,
	/*
		Dispose of the reference when the process is exiting.
		This must be synchronous! https://nodejs.org/api/process.html#event-exit
	*/
	dispose_on_exit: rmSync
})

const temporary_file = join_path(tmpdir(), randomBytes(16).toString('hex'))
await writeFile(temporary_file, 'some contents')

// Call the disposer function, passing a reference to be disposed and a function that uses that reference.
const result = await use_filepath(
	temporary_file,
	async path =>
		readFile(temporary_file, 'utf8')
)
result // => 'some contents'

// The file has been disposed.
const error = await readFile(temporary_file)
	.catch(error => error)
error.code // => 'ENOENT'
```
