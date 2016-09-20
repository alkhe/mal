import types from './types'

export default (outer = null, binds = [], exprs = []) => {
	let symbols = {}

	let env = {
		set: (k, v) => symbols[k] = v,
		find: k =>
			symbols.hasOwnProperty(k)
				? env
			: outer
				? outer.find(k)
				: null,
		get: k => {
			let target_env = env.find(k)
			if (target_env != null) {
				return target_env.unsafe_get(k)
			} else {
				throw `${ k } not found`
			}
		},
		unsafe_get: k => symbols[k],
		initialize: s => symbols = s,
		get_all: () => symbols
	}

	for (let i = 0; i < binds.length; i++) {
		env.set(binds[i], exprs[i])
	}

	return env
}
