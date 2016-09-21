import types, {
	$symbol, $number, $nil, $bool, $string, $keyword,
	$list, $vector, $map,
	$debug } from './types'

let log = ::console.log

let read_str = s => {
	let reader = {
		tokens: tokenizer(s),
		position: 0,
		peek: () => reader.tokens[reader.position],
		next: () => reader.tokens[reader.position++]
	}

	return reader.tokens.length > 0 ? read_form(reader) : $debug('')
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

	return $list(elements)
}

let read_vector = reader => {
	reader.next()
	let elements = []

	for (let t = reader.peek(); t !== ']'; t = reader.peek()) {
		elements.push(read_form(reader))
	}

	reader.next()

	return $vector(elements)
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

	return $map(map)
}

let read_quote = reader => {
	reader.next()
	return $list([$symbol('quote'), read_form(reader)])
}

let read_quasiquote = reader => {
	reader.next()
	return $list([$symbol('quasiquote'), read_form(reader)])
}

let read_unquote = reader => {
	reader.next()
	return $list([$symbol('unquote'), read_form(reader)])
}

let read_splice_unquote = reader => {
	reader.next()
	return $list([$symbol('splice-unquote'), read_form(reader)])
}

let read_deref = reader => {
	reader.next()
	return $list([$symbol('deref'), read_form(reader)])
}

let read_with_meta = reader => {
	reader.next()

	let meta = read_form(reader)
	let obj = read_form(reader)

	return $list([$symbol('with-meta'), obj, meta])
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
		return $string(parse_string(t))
	} else if (t[0] === ':') {
		return $keyword(t)
	} else if (t.match(/^-?[0-9]+$/)) {
		return $number(parseInt(t, 10))
	} else {
		switch (t) {
			case 'nil':
				return $nil(null)
			case 'true':
				return $bool(true)
			case 'false':
				return $bool(false)
			default:
				return $symbol(t)
		}
	}
}

export default read_str
