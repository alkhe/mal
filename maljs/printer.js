import types from './types'

export let pretty = x => pr_str(x, true)
export let ugly = x => pr_str(x, false)

let pr_consistent = human => x => pr_str(x, human)

let pr_str = ({ value, type }, human) => {

	switch (type) {
		case types.symbol:
			return value
		case types.number:
			return value.toString(10)
		case types.nil:
			return 'nil'
		case types.bool:
			return value.toString()
		case types.string:
			return human
				? serialize_string(value)
				: value
		case types.keyword:
			return value.slice(1)
		case types.list:
			return `(${ value.map(pr_consistent(human)).join(' ') })`
		case types.vector:
			return `[${ value.map(pr_consistent(human)).join(' ') }]`
		case types.map:
			let serials = []
			for (let [K, V] of value) {
				serials.push(
					serialize_key(K),
					pr_str(V, human)
				)
			}
			return `{${ serials.join(' ') }}`
		case types.fn:
			return '#<function>'
		case types.debug:
			return value
		default:
			return 'bad AST\n'
	}
}

let serialize_key = ({ value, type }) =>
	type === types.keyword
		? value
		: serialize_string(value)

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
