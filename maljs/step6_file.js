import { readFileSync as read } from 'fs'

import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit, fn, apply, falsy } from './types'
import create_env from './env'
import core from './core'

let log = ::console.log
let { argv, stdout } = process

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

let form_fn = ([{ value: Binds }, Expr], env) => {
	let params = Binds.map(x => x.value)
	let f = (...args) => EVAL(Expr, create_env(env, params, args))
	f.meta = {
		ast: Expr,
		params,
		env
	}
	return unit(f, types.userfn)
}

let form_defn = ([{ value: key }, { value: Binds }, Expr], env) => {
	let params = Binds.map(x => x.value)
	let f = (...args) => EVAL(Expr, create_env(env, params, args))
	f.meta = {
		ast: Expr,
		params,
		env
	}
	let F = unit(f, types.userfn)
	env.set(key, F)
	return F
}

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
					case 'defn':
						return form_defn(args, env)
					default:
						let [{ value: f, type }, ...resolved_args] = RESOLVE_AST(ast, env).value
						if (type === types.userfn) {
							let { meta } = f
							ast = meta.ast
							env = create_env(meta.env, meta.params, resolved_args)
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

let re = s => EVAL(READ(s), repl_env)
let rep = s => PRINT(re(s), true)

let [script, ..._raw_argv] = argv.slice(2)

let _eval = fn(ast => EVAL(ast, repl_env))
let _argv = unit(_raw_argv.map(x => unit(x, types.string)), types.list)

let repl_env = create_env()
repl_env.initialize({
	...core,
	'eval': _eval,
	'*ARGV*': _argv
})

re(`(defn load-file [f] (eval (read-string (str "(do " (slurp f) ")"))))`)

let include = filename => {
	re(`(load-file "${ filename }")`)
}

include('./std.lisp')

let run = line => {
	try {
		let result = rep(line)
		if (result.length > 0) {
			stdout.write(result + '\n')
		}
	} catch (err) {
		stdout.write(err.message + '\n')
		stdout.write(err.stack + '\n')
	}
}

if (script == null) {
	while (true) {
		let line = readline('user> ')
		if (line == null) {
			break
		} else {
			run(line)
		}
	}
} else {
	include(script)
}
