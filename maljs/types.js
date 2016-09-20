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
	debug: Symbol('debug')
}

export let unit = (value, type) => ({ value, type })
export let fn = (lambda, type) => unit((...args) => unit(lambda(...args), type), types.fn)
export let compose = (F, G) => unit((...args) => G.value(F.value(...args)), types.fn)
export let apply = (F, ...args) => F.value(...args).value

export default types
