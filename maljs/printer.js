import types, { dekey } from './types'

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
			return ':' + value
		case types.list:
			return `(${ value.map(pr_consistent(human)).join(' ') })`
		case types.vector:
			return `[${ value.map(pr_consistent(human)).join(' ') }]`
		case types.map:
			let serials = []
			for (let [k, V] of value) {
				serials.push(
					pr_str(dekey(k), true),
					pr_str(V, human)
				)
			}
			return `{${ serials.join(' ') }}`
		case types.fn:
		case types.userfn:
			return '#<function>'
		case types.atom:
			return `(atom ${ pr_str(value, human) })`
		case types.debug:
			return value
		default:
			throw Error('bad AST')
	}
}

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
