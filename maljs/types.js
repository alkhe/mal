let types = {
	symbol: Symbol('symbol'),
	number: Symbol('number'),
	nil: Symbol('nil'),
	bool: Symbol('nil'),
	string: Symbol('string'),
	keyword: Symbol('keyword'),
	list: Symbol('list'),
	vector: Symbol('vector'),
	map: Symbol('map'),
	debug: Symbol('debug')
}

export let unit = (value, type) => ({ value, type })

export default types
