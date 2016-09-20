import types from './types'

export default outer => {
	let data = {
	}

	let env = {
		set: (k, v) => data[k] = v,
		find: k =>
			data.hasOwnProperty(k)
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
		unsafe_get: k => data[k],
		initialize: d => data = d,
		get_all: () => data
	}

	return env
}
