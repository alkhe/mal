import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit, fn } from './types'
import create_env from './env'

let log = ::console.log
let { stdout } = process

let READ = s => read_str(s)

let RESOLVE_AST = (ast, env) => {
	let { value, type } = ast
	switch (type) {
		case types.symbol:
			return env.get(value)
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
			let [{ value: form }, ...args] = value

			switch (form) {
				case 'def!':
					let [{ value: key }, assign_expr] = args
					let assign_value = EVAL(assign_expr, env)

					env.set(key, assign_value)
					return assign_value
				case 'let*':
					let [{ value: bindings }, expr] = args
					let child_env = create_env(env)
					for (let i = 0; i < bindings.length; i++) {
						let key = bindings[i].value
						let assign_value = EVAL(bindings[i + 1], child_env)
						child_env.set(key, assign_value)
						i++
					}
					return EVAL(expr, child_env)
				case 'do':
					let values = args.map(expr => EVAL(expr, env))
					return values[values.length - 1]
				case 'if':
					let [cond_expr, true_expr, false_expr] = args
					let cond = EVAL(cond_expr, env).value

					return cond !== null && cond !== false
						? EVAL(true_expr, env)
					: false_expr != null
						? EVAL(false_expr, env)
						: unit(null, types.nil)
				case 'fn*':
					let [{ value: binds }, fnexpr] = args
					return unit((...fnargs) => EVAL(fnexpr, create_env(env, binds.map(x => x.value), fnargs)), types.fn)
				default:
					let [{ value: op }, ...resolved_args] = RESOLVE_AST(ast, env).value
					return op(...resolved_args)
			}
		} else {
			return ast
		}
	} else {
		return RESOLVE_AST(ast, env)
	}
}

let PRINT = (ast, print_readably) => pr_str(ast, print_readably)

let repl_env = create_env()
repl_env.initialize({
	'+': fn(({ value: a }, { value: b }) => a + b, types.number),
	'-': fn(({ value: a }, { value: b }) => a - b, types.number),
	'*': fn(({ value: a }, { value: b }) => a * b, types.number),
	'/': fn(({ value: a }, { value: b }) => a / b | 0, types.number)
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
