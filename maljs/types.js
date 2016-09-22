let types = {
	symbol: Symbol('symbol'),
	number: Symbol('number'),
	nil: Symbol('nil'),
	bool: Symbol('bool'),
	string: Symbol('string'),
	keyword: Symbol('keyword'),

	list: Symbol('list'),
	vector: Symbol('vector'),
	map: Symbol('map'),
	
	fn: Symbol('fn'),
	userfn: Symbol('userfn'),

	atom: Symbol('atom'),
	
	ref: Symbol('ref'),
	debug: Symbol('debug')
}

export let unit = (value, type) => ({ value, type, meta: Nil })

let ctor = t => x => unit(x, t)

export let $symbol = ctor(types.symbol)
export let $number = ctor(types.number)
export let $nil = ctor(types.nil)
export let $bool = ctor(types.bool)
export let $string = ctor(types.string)
export let $keyword = ctor(types.keyword)
export let $list = ctor(types.list)
export let $vector = ctor(types.vector)
export let $map = ctor(types.map)
export let $fn = ctor(types.fn)
export let $userfn = ctor(types.userfn)
export let $atom = ctor(types.atom)
export let $ref = ctor(types.ref)
export let $debug = ctor(types.debug)

export let Nil = $nil(null)

export let fn = (lambda, type) =>
	type != null
		? $fn((...args) => unit(lambda(...args), type))
		: $fn(lambda)

export let compose = (F, G) => $fn((...args) => G.value(F.value(...args)))
export let apply = (F, ...args) => F.value(...args).value

export let listy = t => t === types.list || t === types.vector
export let falsy = b => b === null || b === false

let reversemap = new Map

let keymaps = {
	[types.symbol]: new Map,
	[types.number]: new Map,
	[types.nil]: new Map,
	[types.bool]: new Map,
	[types.string]: new Map,
	[types.keyword]: new Map,
	[types.list]: new Map,
	[types.vector]: new Map,
	[types.map]: new Map,
	[types.fn]: new Map,
	[types.userfn]: new Map,
	[types.atom]: new Map,
	[types.ref]: new Map,
	[types.debug]: new Map
}

export let enkey = K => {
	let { value, type } = K
	let keymap = keymaps[type]

	if (keymap.has(value)) {
		return keymap.get(value)
	} else {
		let sym = Symbol()
		keymap.set(value, sym)
		reversemap.set(sym, K)
		return sym
	}
}

export let dekey = sym => reversemap.get(sym)

export let $symbol_cmp = (S, name) => S.type === types.symbol && S.value === name

export default types
