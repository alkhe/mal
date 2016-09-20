import { readline } from './readline'

let log = ::console.log

let READ = s => s

let EVAL = s => s

let PRINT = s => s

let rep = s => PRINT(EVAL(READ(s)))

while (true) {
	let line = readline('user> ')
	if (line == null) {
		break
	} else {
		log(rep(line))
	}
}
