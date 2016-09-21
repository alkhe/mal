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
	
	debug: Symbol('debug')
}

export let unit = (value, type) => ({ value, type })

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
export let $debug = ctor(types.debug)

export let fn = (lambda, type) =>
	type != null
		? $fn((...args) => unit(lambda(...args), type))
		: $fn(lambda)

export let compose = (F, G) => $fn((...args) => G.value(F.value(...args)))
export let apply = (F, ...args) => F.value(...args).value

export let listy = t => t === types.list || t === types.vector
export let falsy = b => b === null || b === false

export let $symbol_cmp = (S, name) => S.type === types.symbol && S.value === name

export default types
