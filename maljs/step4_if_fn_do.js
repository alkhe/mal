import { readFileSync as read } from 'fs'

import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit, fn, apply, falsy } from './types'
import create_env from './env'
import core from './core'

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
			let resolved = []
			for (let [K, V] of value) {
				resolved.push([K, EVAL(V, env)])
			}
			return unit(resolved, type)
		default:
			return ast
	}
}

let form_def = ([{ value: key }, Expr], env) => {
	let Value = EVAL(Expr, env)
	env.set(key, Value)
	return Value
}

let form_let = ([{ value: bindings }, Expr], env) => {
	let child_env = create_env(env)
	for (let i = 0; i < bindings.length; i++) {
		let { value: key } = bindings[i]
		let Value = EVAL(bindings[i + 1], child_env)
		child_env.set(key, Value)
		i++
	}
	return EVAL(Expr, child_env)
}

let form_do = (args, env) => {
	let Values = args.map(Expr => EVAL(Expr, env))
	return Values[Values.length - 1]
}

let form_if = ([Cond_Expr, True_Expr, False_Expr], env) => {
	let { value: cond } = EVAL(Cond_Expr, env)
	return !falsy(cond)
		? EVAL(True_Expr, env)
		: False_Expr != null
			? EVAL(False_Expr, env)
			: unit(null, types.nil)
}

let form_fn = ([{ value: Binds }, Expr], env) =>
	fn((...args) => EVAL(Expr, create_env(env, Binds.map(x => x.value), args)))

let EVAL = (ast, env) => {
	let { value, type } = ast
	if (type === types.list) {
		if (value.length > 0) {
			let [{ value: form }, ...args] = value
			switch (form) {
				case 'def!':
					return form_def(args, env)
				case 'let*':
					return form_let(args, env)
				case 'do':
					return form_do(args, env)
				case 'if':
					return form_if(args, env)
				case 'fn*':
					return form_fn(args, env)
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

let PRINT = (ast, human) => pr_str(ast, human)

let rep = s => PRINT(EVAL(READ(s), repl_env), true)

let repl_env = create_env()
repl_env.initialize(core)

let std = read('./std.mal', 'utf8').split(/\n+/)
for (let line of std) {
	EVAL(READ(line), repl_env)
}

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
		} catch (err) {
			stdout.write(err.message + '\n')
			// stdout.write(err.stack + '\n')
		}
	}
}
