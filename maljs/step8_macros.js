import { readFileSync as read } from 'fs'

import { readline } from './readline'
import read_str from './reader'
import pr_str from './printer'
import types, { unit, fn, apply, falsy, listy,
	$symbol, $nil, $string, $list, $vector, $map, $userfn, $symbol_cmp } from './types'
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
			return $list(value.map(x => EVAL(x, env)))
		case types.vector:
			return $vector(value.map(x => EVAL(x, env)))
		case types.map:
			let map = []
			for (let [K, V] of value) {
				map.push([K, EVAL(V, env)])
			}
			return $map(map)
		default:
			return ast
	}
}

let form_def_mal = ([{ value: key }, Expr], env) => {
	let Value = EVAL(Expr, env)
	env.set(key, Value)
	return Value
}

let form_fn_mal = ([{ value: Binds }, Expr], env) => {
	let params = Binds.map(x => x.value)
	let f = (...args) => EVAL(Expr, create_env(env, params, args))
	f.meta = {
		ast: Expr,
		params,
		env,
		macro: false
	}
	return $userfn(f)
}

let form_defn = ([{ value: key }, { value: Binds }, Expr], env) => {
	let params = Binds.map(x => x.value)
	let f = (...args) => EVAL(Expr, create_env(env, params, args))
	f.meta = {
		ast: Expr,
		params,
		env,
		macro: false
	}
	let F = $userfn(f)
	env.set(key, F)
	return F
}

let form_defmacro_mal = ([{ value: key }, Expr], env) => {
	let Value = EVAL(Expr, env)
	Value.value.meta.macro = true
	env.set(key, Value)
	return Value
}

let form_defmacro = ([{ value: key }, { value: Binds }, Expr], env) => {
	let params = Binds.map(x => x.value)
	let f = (...args) => EVAL(Expr, create_env(env, params, args))
	f.meta = {
		ast: Expr,
		params,
		env,
		macro: true
	}
	let F = $userfn(f)
	env.set(key, F)
	return F
}

let form_let_mal = ([{ value: bindings }, Expr], env) => {
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
	RESOLVE_AST($list(args.slice(0, -1)), env) // resolve inits
	return args[args.length - 1] // last
}

let form_if = ([Cond_Expr, True_Expr, False_Expr], env) => {
	let { value: cond } = EVAL(Cond_Expr, env)
	return !falsy(cond)
		? True_Expr
		: False_Expr != null
			? False_Expr
			: $nil(null)
}

let is_pair = ({ value, type }) => listy(type) && value.length > 0

let form_quasiquote = ast => {
	let contents = ast.value

	if (!is_pair(ast)) {
		return $list([$symbol('quote'), ast])
	}

	let [H, ...tail] = contents
	let { value: h } = H

	if ($symbol_cmp(H, 'unquote')) {
		return contents[1]
	}

	if (is_pair(H) && $symbol_cmp(h[0], 'splice-unquote')) {
		return $list([$symbol('concat'), h[1], form_quasiquote($list(tail))])
	}

	return $list([$symbol('cons'), form_quasiquote(H), form_quasiquote($list(tail))])
}

let is_macro_call = (ast, env) => {
	if (ast.type === types.list && ast.value.length > 0) {
		let [Head] = ast.value
		if (Head.type === types.symbol) {
			let target_env = env.find(Head.value)
			if (target_env != null) {
				let Var = target_env.unsafe_get(Head.value)
				return Var.type === types.userfn && Var.value.meta.macro
			}
		}
	}
	return false
}

let macroexpand = (ast, env) => {
	while (is_macro_call(ast, env)) {
		let [Key, ...args] = ast.value
		let Macro = env.get(Key.value)
		ast = Macro.value(...args)
	}
	return ast
}

let EVAL = (ast, env) => {
	while (true) {
		ast = macroexpand(ast, env)
		if (ast.type === types.list) {
			if (ast.value.length > 0) {
				let [{ value: form }, ...args] = ast.value
				switch (form) {
					case 'def!':
						return form_def_mal(args, env)
					case 'fn*':
						return form_fn_mal(args, env)
					case 'defn':
						return form_defn(args, env)
					case 'defmacro!':
						return form_defmacro_mal(args, env)
					case 'defmacro':
						return form_defmacro(args, env)
					case 'let*':
						[ast, env] = form_let_mal(args, env)
						continue
					case 'do':
						ast = form_do(args, env)
						continue
					case 'if':	
						ast = form_if(args, env)
						continue
					case 'quote':
						return args[0]
					case 'quasiquote':
						ast = form_quasiquote(args[0])
						continue
					case 'macroexpand':
						return macroexpand(ast.value[1], env)
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

let re = s => READ(s).map(ast => EVAL(ast, repl_env))
let rep = s => re(s).map(ast => PRINT(ast, true))

let [script, ..._raw_argv] = argv.slice(2)

let repl_env = create_env()
repl_env.initialize({
	...core,
	'eval': fn(ast => EVAL(ast, repl_env)),
	'*ARGV*': $list(_raw_argv.map($string))
})

re('(defn load-file [f] (eval (read-string (str `(do ~(slurp f))))))')

let include = filename => re(`(load-file "${ filename }")`)

include('./std.lisp')

if (script == null) {
	while (true) {
		let line = readline('user> ')
		if (line == null) {
			break
		}

		try {
			let result = rep(line).join(' ')
			if (result.length > 0) {
				stdout.write(result + '\n')
			}
		} catch (err) {
			stdout.write(err.message + '\n')
			// stdout.write(err.stack + '\n')
		}
	}
} else {
	include(script)
	process.exit(0)
}
