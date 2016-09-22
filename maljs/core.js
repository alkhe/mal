import { readFileSync as read } from 'fs'

import types, { fn, compose, apply, listy,
	$symbol, $string, $keyword, $nil, $list, $vector, $map, enkey, dekey } from './types'
import pr_str, { pretty, ugly } from './printer'
import read_str from './reader'
import readline from './readline'

let print = s => console.log(s)

let __print = fn(({ value: s }) => {
	print(s)
	return null
}, types.nil)

let _add = fn(({ value: a }, { value: b }) => a + b, types.number)
let _sub = fn(({ value: a }, { value: b }) => a - b, types.number)
let _mul = fn(({ value: a }, { value: b }) => a * b, types.number)
let _div = fn(({ value: a }, { value: b }) => {
	if (b === 0) {
		throw Error('division by zero')
	}
	let quotient = a / b
	if (!Number.isFinite(quotient)) {
		throw Error('not a finite inumber')
	}
	return quotient | 0
}, types.number)

let _symbol = fn(({ value }) => $symbol(value))
let _keyword = fn(S =>
	S.type === types.keyword
		? S
		: $keyword(S.value)
)
let _list = fn((...args) => args, types.list)
let _vector = fn((...args) => args, types.vector)

let _atom = fn(ast => ast, types.atom)

let _is_nil = fn(x => x.type === types.nil, types.bool)
let _is_true = fn(x => x.value === true, types.bool)
let _is_false = fn(x => x.value === false, types.bool)
let _is_keyword = fn(x => x.type === types.keyword, types.bool)
let _is_string = fn(x => x.type === types.string, types.bool)
let _is_symbol = fn(x => x.type === types.symbol, types.bool)

let _is_list = fn(x => x.type === types.list, types.bool)
let _is_vector = fn(x => x.type === types.vector, types.bool)
let _is_map = fn(x => x.type === types.map, types.bool)

let _is_atom = fn(({ type }) => type === types.atom, types.bool)

let _is_sequential = fn(x => listy(x.type), types.bool)
let _is_empty = fn(({ value, type }) => (type === types.nil) || (value.length === 0), types.bool)
let _count = fn(({ value, type }) => type === types.nil ? 0 : value.length, types.number)

let _contains = fn(({ value: map, type }, K) => {
	if (type === types.nil) {
		return $nil(null)
	}
	return map.has(enkey(K))
}, types.bool)
let _keys = fn(({ value: map, type }) => {
	if (type === types.nil) {
		return $nil(null)
	}
	return $list(Array.from(map.keys()).map(dekey))
})
let _vals = fn(({ value: map, type }) => {
	if (type === types.nil) {
		return $nil(null)
	}
	return $list(Array.from(map.values()))
})
let _assoc = fn(({ value: old_map }, ...args) => {
	let map = new Map(old_map)
	for (let i = 0; i < args.length; i++) {
		map.set(enkey(args[i]), args[i + 1])
		i++
	}
	return map
}, types.map)
let _dissoc = fn(({ value: old_map }, ...keysources) => {
	let map = new Map(old_map)
	for (let ks of keysources) {
		map.delete(enkey(ks))
	}
	return map
}, types.map)
let _get = fn(({ value: map, type }, K) => {
	if (type === types.nil) {
		return $nil(null)
	}
	let key = enkey(K)
	return map.has(key) ? map.get(key) : $nil(null)
})

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
			if (Array.from(a.keys()).length !== Array.from(b.keys()).length) {
				return false
			}

			for (let [k, V] of a) {
				if (!apply(_equals, V, b.get(k))) {
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

let _read_string = fn(({ value }) => read_str(value)[0])

let _slurp = fn(({ value }) => read(value, 'utf8'), types.string)

let _pr_str = fn((...args) => args.map(pretty).join(' '), types.string)
let _str = fn((...args) => args.map(ugly).join(''), types.string)

let _prn = compose(_pr_str, __print)
let _println = compose(
	fn((...args) => args.map(ugly).join(' '), types.nil),
	__print
)

let __chars = fn(S => S.value.split('').map($string), types.list)

let _deref = fn(({ value }) => value)
let _reset = fn((atom, ast) => atom.value = ast)
let _swap = fn((atom, { value: f }, ...args) => atom.value = f(atom.value, ...args))

let _cons = fn((Head, { value: tail }) => [Head].concat(tail), types.list)
let _concat = fn((...args) => args.reduce((acc, { value }) => acc.concat(value), []), types.list)

let _nth = fn(({ value: list }, { value: index }) => {
	if (index < list.length) {
		return list[index]
	}
	throw Error('out of bounds')
})
let _first = fn(({ value, type }) =>
	type === types.nil || value.length === 0
		? $nil(null)
		: value[0]
)
let _rest = fn(({ value, type }) => $list(type === types.nil ? [] : value.slice(1)))

let _throw = fn(object => {
	throw object
})

let _apply = fn((F, ...args) => {
	let fargs = args.slice(0, -1).concat(args[args.length - 1].value)
	return F.value(...fargs)
})

let _map = fn((F, L) => L.value.map(F.value), types.list)

let _readline = fn(P => {
	let line = readline(P.value)
	if (line == null) {
		return $nil(null)
	}
	return $string(line)
})

let _with_meta = fn((O, Meta) => ({ ...O, meta: Meta }))
let _meta = fn(O => O.meta)

let _time_ms = fn(::Date.now, types.number)

export default {
	'+': _add,
	'-': _sub,
	'*': _mul,
	'/': _div,
	'symbol': _symbol,
	'keyword': _keyword,
	'list': _list,
	'vector': _vector,
	'atom': _atom,
	'symbol?': _is_symbol,
	'nil?': _is_nil,
	'true?': _is_true,
	'false?': _is_false,
	'string?': _is_string,
	'keyword?': _is_keyword,
	'list?': _is_list,
	'vector?': _is_vector,
	'map?': _is_map,
	'atom?': _is_atom,
	'sequential?': _is_sequential,
	'empty?': _is_empty,
	'count': _count,
	'contains?': _contains,
	'keys': _keys,
	'vals': _vals,
	'assoc': _assoc,
	'dissoc': _dissoc,
	'get': _get,
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
	'deref': _deref,
	'reset!': _reset,
	'swap!': _swap,
	'cons': _cons,
	'concat': _concat,
	'nth': _nth,
	'first': _first,
	'rest': _rest,
	'throw': _throw,
	'apply': _apply,
	'map': _map,
	'readline': _readline,
	'with-meta': _with_meta,
	'meta': _meta,
	'time-ms': _time_ms,

	'internal/enkey': fn(enkey, types.ref),
	'internal/dekey': fn(x => dekey(x.value), types.ref),
	'internal/print': __print,
	'internal/chars': __chars
}
