import { types } from './types'

let log = ::console.log

let read_str = s => {
	let reader = {
		tokens: tokenizer(s),
		position: 0,
		peek: () => reader.tokens[reader.position],
		next: () => reader.tokens[reader.position++]
	}

	return reader.tokens.length > 0 ? read_form(reader) : ['', types.debug]
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
			throw 'got EOF'
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

	return [elements, types.list]
}

let read_vector = reader => {
	reader.next()
	let elements = []

	for (let t = reader.peek(); t !== ']'; t = reader.peek()) {
		elements.push(read_form(reader))
	}

	reader.next()

	return [elements, types.vector]
}

let read_map = reader => {
	reader.next()
	let map = {}

	for (let t = reader.peek(); t !== '}'; t = reader.peek()) {
		let key = read_form(reader)[0]
		map[key] = read_form(reader)
	}

	reader.next()

	return [map, types.map]
}

let quote_node = [Symbol.for('quote'), types.symbol]

let read_quote = reader => {
	reader.next()
	return [[quote_node, read_form(reader)], types.list]
}

let quasiquote_node = [Symbol.for('quasiquote'), types.symbol]

let read_quasiquote = reader => {
	reader.next()
	return [[quasiquote_node, read_form(reader)], types.list]
}

let unquote_node = [Symbol.for('unquote'), types.symbol]

let read_unquote = reader => {
	reader.next()
	return [[unquote_node, read_form(reader)], types.list]
}

let splice_unquote_node = [Symbol.for('splice-unquote'), types.symbol]

let read_splice_unquote = reader => {
	reader.next()
	return [[splice_unquote_node, read_form(reader)], types.list]
}

let deref_node = [Symbol.for('deref'), types.symbol]

let read_deref = reader => {
	reader.next()
	return [[deref_node, read_form(reader)], types.list]
}

let with_meta_node = [Symbol.for('with-meta'), types.symbol]

let read_with_meta = reader => {
	reader.next()

	let meta = read_form(reader)
	let obj = read_form(reader)

	return [[with_meta_node, obj, meta], types.list]
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
					throw `bad string: ${ t }`
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
		return [parse_string(t), types.string]
	} else if (t[0] === ':') {
		return ['\u0000' + t, types.keyword]
	} else if (t.match(/^-?[0-9]+$/)) {
		return [parseInt(t, 10), types.number]
	} else {
		switch (t) {
			case 'nil':
				return [null, types.nil]
			case 'true':
				return [true, types.bool]
			case 'false':
				return [false, types.bool]
			default:
				return [Symbol.for(t), types.symbol]
		}
	}
}

export default read_str
