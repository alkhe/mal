import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types from './types'

let log = ::console.log
let { stdout } = process

let ENV = {
	'+': [(a, b) => a + b, types.number],
	'-': [(a, b) => a - b, types.number],
	'*': [(a, b) => a * b, types.number],
	'/': [(a, b) => a / b | 0, types.number]
}

let strip_meta = list => list.map(([value]) => value)

let READ = s => read_str(s)

let RESOLVE_AST = (ast, env) => {
	let [value, type] = ast
	switch (type) {
		case types.symbol:
			let key = Symbol.keyFor(value)
			let data = env[key]
			if (data == null) {
				throw `${ key } not found`
			}
			return data
		case types.list:
			return [value.map(x => EVAL(x, env)), type]
		case types.vector:
			return [value.map(x => EVAL(x, env)), type]
		case types.map:
			let resolved = {}
			for (let k in value) {
				if (value.hasOwnProperty(k)) {
					resolved[k] = EVAL(value[k], env)
				}
			}
			return [resolved, type]
		default:
			return ast
	}
}

let EVAL = (ast, env) => {
	let [value, type] = ast
	if (type === types.list) {
		if (value.length > 0) {
			let [[[op, optype], ...args]] = RESOLVE_AST(ast, env)
			return [op(...strip_meta(args)), optype]
		} else {
			return ast
		}
	} else {
		return RESOLVE_AST(ast, env)
	}
}

let PRINT = (ast, print_readably) => pr_str(ast, print_readably)

let rep = s => PRINT(EVAL(READ(s), ENV), true)

while (true) {
	let line = readline('user> ')
	if (line == null) {
		break
	} else {
		try {
			let result = rep(line)
			if (result.length > 0) {
				stdout.write(result + '\n')
			}
		} catch (msg) {
			stdout.write(msg + '\n')
		}
	}
}
