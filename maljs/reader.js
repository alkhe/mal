import types, { unit } from './types'

let log = ::console.log

let read_str = s => {
	let reader = {
		tokens: tokenizer(s),
		position: 0,
		peek: () => reader.tokens[reader.position],
		next: () => reader.tokens[reader.position++]
	}

	return reader.tokens.length > 0 ? read_form(reader) : unit('', types.debug)
}

let tokenizer = s => {	
	let regex_machine = /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"|;.*|[^\s\[\]{}('"`,;)]*)/g
	let tokens = []
	
	for (let match = regex_machine.exec(s)[1]; match !== ''; match = regex_machine.exec(s)[1]) {
		if (match[0] === ';') {
			continue
		}
		tokens.push(match)
	}

	return tokens
}

let read_form = reader => {
	let t = reader.peek()
	
	switch (t) {
		case undefined:
			throw Error('got EOF')
		case '(':
			return read_list(reader)
		case '[':
			return read_vector(reader)
		case '{':
			return read_map(reader)
		case '\'':
			return read_quote(reader)
		case '`':
			return read_quasiquote(reader)
		case '~':
			return read_unquote(reader)
		case '~@':
			return read_splice_unquote(reader)
		case '@':
			return read_deref(reader)
		case '^':
			return read_with_meta(reader)
		default:
			return read_atom(reader)
	}
}

let read_list = reader => {
	reader.next()
	let elements = []

	for (let t = reader.peek(); t !== ')'; t = reader.peek()) {
		elements.push(read_form(reader))
	}

	reader.next()

	return unit(elements, types.list)
}

let read_vector = reader => {
	reader.next()
	let elements = []

	for (let t = reader.peek(); t !== ']'; t = reader.peek()) {
		elements.push(read_form(reader))
	}

	reader.next()

	return unit(elements, types.vector)
}

let read_map = reader => {
	reader.next()
	let map = []

	for (let t = reader.peek(); t !== '}'; t = reader.peek()) {
		let Key = read_form(reader)
		let Value = read_form(reader)
		map.push([Key, Value])
	}

	reader.next()

	return unit(map, types.map)
}

let quote_node = unit('quote', types.symbol)

let read_quote = reader => {
	reader.next()
	return unit([quote_node, read_form(reader)], types.list)
}

let quasiquote_node = unit('quasiquote', types.symbol)

let read_quasiquote = reader => {
	reader.next()
	return unit([quasiquote_node, read_form(reader)], types.list)
}

let unquote_node = unit('unquote', types.symbol)

let read_unquote = reader => {
	reader.next()
	return unit([unquote_node, read_form(reader)], types.list)
}

let splice_unquote_node = unit('splice-unquote', types.symbol)

let read_splice_unquote = reader => {
	reader.next()
	return unit([splice_unquote_node, read_form(reader)], types.list)
}

let deref_node = unit('deref', types.symbol)

let read_deref = reader => {
	reader.next()
	return unit([deref_node, read_form(reader)], types.list)
}

let with_meta_node = unit('with-meta', types.symbol)

let read_with_meta = reader => {
	reader.next()

	let meta = read_form(reader)
	let obj = read_form(reader)

	return unit([with_meta_node, obj, meta], types.list)
}

let parse_string = t => {
	let output = ''

	for (let i = 1; i < t.length; i++) {
		let c = t[i]

		if (c === '"') {
			break
		} else if (c === '\\') {
			let d = t[i + 1]
			
			switch (d) {
				case '"':
					output += '"'
					break
				case 'n':
					output += '\n'
					break
				case '\\':
					output += '\\'
					break
				default:
					throw Error(`bad string: ${ t }`)
			}

			i++
		} else {
			output += c
		}
	}

	return output
}

let read_atom = reader => {
	let t = reader.next()

	if (t[0] === '"') {
		return unit(parse_string(t), types.string)
	} else if (t[0] === ':') {
		return unit(t, types.keyword)
	} else if (t.match(/^-?[0-9]+$/)) {
		return unit(parseInt(t, 10), types.number)
	} else {
		switch (t) {
			case 'nil':
				return unit(null, types.nil)
			case 'true':
				return unit(true, types.bool)
			case 'false':
				return unit(false, types.bool)
			default:
				return unit(t, types.symbol)
		}
	}
}

export default read_str
