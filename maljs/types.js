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
export let fn = (lambda, type) =>
	type != null
		? unit((...args) => unit(lambda(...args), type), types.fn)
		: unit(lambda, types.fn)
export let compose = (F, G) => unit((...args) => G.value(F.value(...args)), types.fn)
export let apply = (F, ...args) => F.value(...args).value

export let listy = t => t === types.list || t === types.vector
export let falsy = b => b === null || b === false

export default types
