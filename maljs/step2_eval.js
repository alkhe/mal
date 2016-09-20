import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit } from './types'

let log = ::console.log
let { stdout } = process

let ENV = {
	'+': unit((a, b) => a + b, types.number),
	'-': unit((a, b) => a - b, types.number),
	'*': unit((a, b) => a * b, types.number),
	'/': unit((a, b) => a / b | 0, types.number)
}

let strip_meta = list => list.map(element => element.value)

let READ = s => read_str(s)

let RESOLVE_AST = (ast, env) => {
	let { value, type } = ast
	switch (type) {
		case types.symbol:
			let data = env[value]
			if (data == null) {
				throw `${ value } not found`
			}
			return data
		case types.list:
			return unit(value.map(x => EVAL(x, env)), type)
		case types.vector:
			return unit(value.map(x => EVAL(x, env)), type)
		case types.map:
			let resolved = []
			for (let [K, V] of value) {
				resolved.push([K, EVAL(V, env)])
			}
			return unit(resolved, type)
		default:
			return ast
	}
}

let EVAL = (ast, env) => {
	let { value, type } = ast
	if (type === types.list) {
		if (value.length > 0) {
			let [{ value: op, type: optype }, ...args] = RESOLVE_AST(ast, env).value
			return unit(op(...strip_meta(args)), optype)
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
