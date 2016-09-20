import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit } from './types'

let log = ::console.log
let { stdout } = process

let READ = s => {
	try {
		return read_str(s)
	} catch (msg) {
		return [msg, types.debug]
	}
}

let EVAL = d => d

let PRINT = (d, print_readably) => pr_str(d, print_readably)

let rep = s => PRINT(EVAL(READ(s)), true)

while (true) {
	let line = readline('user> ')
	if (line == null) {
		break
	} else {
		let result = rep(line)
		if (result.length > 0) {
			stdout.write(result + '\n')
		}
	}
}
