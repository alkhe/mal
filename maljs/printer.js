import types from './types'

let pr_str = ([value, type], print_readably) => {
	switch (type) {
		case types.symbol:
			return Symbol.keyFor(value)
		case types.number:
			return value.toString(10)
		case types.nil:
			return 'nil'
		case types.bool:
			return value.toString()
		case types.string:
			return print_readably
				? serialize_string(value)
				: value
		case types.keyword:
			return value.slice(1)
		case types.list:
			return `(${ value.map(pr_str).join(' ') })`
		case types.vector:
			return `[${ value.map(pr_str).join(' ') }]`
		case types.map:
			let serials = []
			for (let k in value) {
				if (value.hasOwnProperty(k)) {
					serials.push(
						serialize_key(k),
						pr_str(value[k])
					)
				}
			}
			return `{${ serials.join(' ') }}`
		case types.debug:
			return value
		default:
			return 'bad AST\n'
	}
}

let serialize_key = k =>
	k[0] === '\u0000'
		? k.slice(1)
		: serialize_string(k)

let serialize_string = s => {
	let output = '"'

	for (let c of s) {
		output +=
			c === '"'
				? '\\"'
			: c === '\n'
				? '\\n'
			: c === '\\'
				? '\\\\'
			: c
	}

	return output + '"'
}

export default pr_str
