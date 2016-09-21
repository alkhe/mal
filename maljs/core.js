import { readFileSync as read } from 'fs'

import types, { fn, compose, apply, listy } from './types'
import pr_str, { pretty, ugly } from './printer'
import read_str from './reader'

let print = s => console.log(s)

let _str_print = fn(({ value: s }) => {
	print(s)
	return null
}, types.nil)

let _add = fn(({ value: a }, { value: b }) => a + b, types.number)
let _sub = fn(({ value: a }, { value: b }) => a - b, types.number)
let _mul = fn(({ value: a }, { value: b }) => a * b, types.number)
let _div = fn(({ value: a }, { value: b }) => a / b | 0, types.number)

let _list = fn((...args) => args, types.list)
let _is_list = fn(({ type }) => type === types.list, types.bool)
let _is_empty = fn(({ value, type }) => (type === types.nil) || (value.length === 0), types.bool)
let _count = fn(({ value, type }) => type === types.nil ? 0 : value.length, types.number)

let _equals_type = fn(({ type: at }, { type: bt }) => at === bt, types.bool)
let _equals = fn(
	({ value: a, type: at }, { value: b, type: bt }) => {
		let is_listy = listy(at) && listy(bt)

		if (!is_listy && at !== bt) {
			return false
		}
		
		if (is_listy) {
			if (a.length !== b.length) {
				return false
			}

			for (let i = 0; i < a.length; i++) {
				if (!apply(_equals, a[i], b[i])) {
					return false
				}
			}

			return true
		} else if (at === types.map) {
			if (a.length !== b.length) {
				return false
			}

			for (let i = 0; i < a.length; i++) {
				if (
					!apply(_equals, a[i][0], b[i][0]) ||
					!apply(_equals, a[i][1], b[i][1])
				) {
					return false
				}
			}

			return true
		} else {
			return a === b
		}
	},
	types.bool
)

let _lt = fn(({ value: a }, { value: b }) => a < b, types.bool)
let _lte = fn(({ value: a }, { value: b }) => a <= b, types.bool)
let _gt = fn(({ value: a }, { value: b }) => a > b, types.bool)
let _gte = fn(({ value: a }, { value: b }) => a >= b, types.bool)

let _read_string = fn(({ value }) => read_str(value))

let _slurp = fn(({ value }) => read(value, 'utf8'), types.string)

let _pr_str = fn((...args) => args.map(pretty).join(' '), types.string)
let _str = fn((...args) => args.map(ugly).join(''), types.string)

let _prn = compose(_pr_str, _str_print)
let _println = compose(
	fn((...args) => args.map(ugly).join(' '), types.nil),
	_str_print
)

let _atom = fn(ast => ast, types.atom)
let _is_atom = fn(({ type }) => type === types.atom, types.bool)
let _deref = fn(({ value }) => value)
let _reset = fn((atom, ast) => atom.value = ast)
let _swap = fn((atom, { value: f }, ...args) => atom.value = f(atom.value, ...args))

let _cons = fn((Head, { value: tail }) => [Head].concat(tail), types.list)
let _concat = fn((...args) => args.reduce((acc, { value }) => acc.concat(value), []), types.list)

export default {
	'+': _add,
	'-': _sub,
	'*': _mul,
	'/': _div,
	'list': _list,
	'list?': _is_list,
	'empty?': _is_empty,
	'count': _count,
	'=': _equals,
	'<': _lt,
	'<=': _lte,
	'>': _gt,
	'>=': _gte,
	'read-string': _read_string,
	'slurp': _slurp,
	'pr-str': _pr_str,
	'str': _str,
	'prn': _prn,
	'println': _println,
	'atom': _atom,
	'atom?': _is_atom,
	'deref': _deref,
	'reset!': _reset,
	'swap!': _swap,
	'cons': _cons,
	'concat': _concat
}
