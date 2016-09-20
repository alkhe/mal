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
export let fn = (lambda, type) => ({ value: (...args) => unit(lambda(...args), type), type: types.fn })

export default types
