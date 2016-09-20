import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit } from './types'
import create_env from './env'

let log = ::console.log
let { stdout } = process

let READ = s => read_str(s)

let RESOLVE_AST = (ast, env) => {
	let { value, type } = ast
	switch (type) {
		case types.symbol:
			return env.get(Symbol.keyFor(value))
		case types.list:
			return unit(value.map(x => EVAL(x, env)), type)
		case types.vector:
			return unit(value.map(x => EVAL(x, env)), type)
		case types.map:
			let resolved = {}
			for (let k in value) {
				if (value.hasOwnProperty(k)) {
					resolved[k] = EVAL(value[k], env)
				}
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
			let form_symbol = value[0].value

			switch (Symbol.keyFor(form_symbol)) {
				case 'def!':
					let key = value[1].value
					let assign_value = EVAL(value[2], env)
					env.set(Symbol.keyFor(key), assign_value)
					return assign_value
				case 'let*':
					let bindings = value[1].value
					let expr = value[2]
					let child_env = create_env(env)
					for (let i = 0; i < bindings.length; i++) {
						let key = bindings[i].value
						let assign_value = EVAL(bindings[i + 1], child_env)
						child_env.set(Symbol.keyFor(key), assign_value)
						i++
					}
					return EVAL(expr, child_env)
				default:
					let [{ value: op, type: optype }, ...args] = RESOLVE_AST(ast, env).value
					return unit(op(...args.map(x => x.value)), optype)
			}
		} else {
			return ast
		}
	} else {
		return RESOLVE_AST(ast, env)
	}
}

let PRINT = (ast, print_readably) => pr_str(ast, print_readably)

let repl_env = create_env(null)
repl_env.initialize({
	'+': unit((a, b) => a + b, types.number),
	'-': unit((a, b) => a - b, types.number),
	'*': unit((a, b) => a * b, types.number),
	'/': unit((a, b) => a / b | 0, types.number)
})

let rep = s => PRINT(EVAL(READ(s), repl_env), true)

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
