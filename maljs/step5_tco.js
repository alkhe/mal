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
	return [Expr, child_env]
}

let form_do = (args, env) => {
	let Statements = args.slice(0, args.length - 1)
	let Expr = args[args.length - 1]
	for (let s of Statements) {
		EVAL(s, env)
	}
	return Expr
}

let form_if = ([Cond_Expr, True_Expr, False_Expr], env) => {
	let { value: cond } = EVAL(Cond_Expr, env)
	return !falsy(cond)
		? True_Expr
		: False_Expr != null
			? False_Expr
			: unit(null, types.nil)
}

let form_fn = ([{ value: Binds }, Expr], env) =>
	unit({
		ast: Expr,
		params: Binds.map(x => x.value),
		env
	}, types.userfn)

let EVAL = (ast, env) => {
	while (true) {
		if (ast.type === types.list) {
			if (ast.value.length > 0) {
				let [{ value: form }, ...args] = ast.value
				switch (form) {
					case 'def!':
						return form_def(args, env)
					case 'let*':
						[ast, env] = form_let(args, env)
						continue
					case 'do':
						ast = form_do(args, env)
						continue
					case 'if':
						ast = form_if(args, env)
						continue
					case 'fn*':
						return form_fn(args, env)
					default:
						let [{ value: f, type }, ...resolved_args] = RESOLVE_AST(ast, env).value
						if (type === types.userfn) {
							ast = f.ast
							env = create_env(f.env, f.params, resolved_args)
							continue
						}
						return f(...resolved_args)
				}
			} else {
				return ast
			}
		} else {
			return RESOLVE_AST(ast, env)
		}
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
