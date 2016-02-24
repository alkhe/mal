// TODO: remove this once time-ms and slurp use standard library calls
import Glibc

func IntOp(op: (Int, Int) -> Int, _ a: MalVal, _ b: MalVal) throws -> MalVal {
    switch (a, b) {
    case (MV.MalInt(let i1), MV.MalInt(let i2)):
        return MV.MalInt(op(i1, i2))
    default:
        throw MalError.General(msg: "Invalid IntOp call")
    }
}

func CmpOp(op: (Int, Int) -> Bool, _ a: MalVal, _ b: MalVal) throws -> MalVal {
    switch (a, b) {
    case (MV.MalInt(let i1), MV.MalInt(let i2)):
        return wraptf(op(i1, i2))
    default:
        throw MalError.General(msg: "Invalid CmpOp call")
    }
}



let core_ns: Dictionary<String,(Array<MalVal>) throws -> MalVal> = [
    "=":  { wraptf(equal_Q($0[0], $0[1])) },
    "throw": { throw MalError.MalException(obj: $0[0]) },

    "nil?": {
        switch $0[0] {
        case MV.MalNil(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "true?": {
        switch $0[0] {
        case MV.MalTrue(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "false?": {
        switch $0[0] {
        case MV.MalFalse(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "string?": {
        switch $0[0] {
        case MV.MalString(let s) where s.characters.count == 0:
            return MV.MalTrue
        case MV.MalString(let s):
            return wraptf(s[s.startIndex] != "\u{029e}")
        default: return MV.MalFalse
        }
    },
    "symbol": {
        switch $0[0] {
        case MV.MalSymbol(_): return $0[0]
        case MV.MalString(let s): return MV.MalSymbol(s)
        default: throw MalError.General(msg: "Invalid symbol call")
        }
    },
    "symbol?": {
        switch $0[0] {
        case MV.MalSymbol(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "keyword": {
        switch $0[0] {
        case MV.MalString(let s) where s.characters.count > 0:
            if s[s.startIndex] == "\u{029e}" { return $0[0] }
            else { return MV.MalString("\u{029e}\(s)") }
        default: throw MalError.General(msg: "Invalid symbol call")
        }
    },
    "keyword?": {
        switch $0[0] {
        case MV.MalString(let s) where s.characters.count > 0:
            return wraptf(s[s.startIndex] == "\u{029e}")
        default: return MV.MalFalse
        }
    },

    "pr-str":  {
        return MV.MalString($0.map { pr_str($0,true) }.joinWithSeparator(" "))
    },
    "str": {
        return MV.MalString($0.map { pr_str($0,false) }.joinWithSeparator(""))
    },
    "prn": {
        print($0.map { pr_str($0,true) }.joinWithSeparator(" "))
        return MV.MalNil
    },
    "println": {
        print($0.map { pr_str($0,false) }.joinWithSeparator(" "))
        return MV.MalNil
    },
    "read-string": {
        switch $0[0] {
        case MV.MalString(let str): return try read_str(str)
        default: throw MalError.General(msg: "Invalid read-string call")
        }
    },
    "readline": {
        switch $0[0] {
        case MV.MalString(let prompt):
            print(prompt, terminator: "")
            let line = readLine(stripNewline: true)
            if line == nil { return MalVal.MalNil }
            return MalVal.MalString(line!)
        default: throw MalError.General(msg: "Invalid readline call")
        }
    },
    "slurp": {
        switch $0[0] {
        case MV.MalString(let file):
            // TODO: replace with this when it is available
            // let data = try String(contentsOfFile: file, encoding: NSUTF8StringEncoding)

            let BUFSIZE = 1024
            var pp      = popen("cat " + file, "r")
            var buf     = [CChar](count:BUFSIZE, repeatedValue:CChar(0))
            var data    = String()
             
            while fgets(&buf, Int32(BUFSIZE), pp) != nil {
                data = data + String.fromCString(buf)!;
            }
            return MV.MalString(data)
        default: throw MalError.General(msg: "Invalid slurp call")
        }
    },


    "<":  { try CmpOp({ $0 < $1},  $0[0], $0[1]) },
    "<=": { try CmpOp({ $0 <= $1}, $0[0], $0[1]) },
    ">":  { try CmpOp({ $0 > $1},  $0[0], $0[1]) },
    ">=": { try CmpOp({ $0 >= $1}, $0[0], $0[1]) },
    "+":  { try IntOp({ $0 + $1},  $0[0], $0[1]) },
    "-":  { try IntOp({ $0 - $1},  $0[0], $0[1]) },
    "*":  { try IntOp({ $0 * $1},  $0[0], $0[1]) },
    "/":  { try IntOp({ $0 / $1},  $0[0], $0[1]) },
    "time-ms": {
        $0; // no parameters

        // TODO: replace with something more like this
        // return MV.MalInt(NSDate().timeIntervalSince1970 )

        var tv:timeval = timeval(tv_sec: 0, tv_usec: 0)
        gettimeofday(&tv, nil)
        return MV.MalInt(tv.tv_sec * 1000 + Int(tv.tv_usec)/1000)
    },

    "list": { MV.MalList($0) },
    "list?": {
        switch $0[0] {
        case MV.MalList(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "vector": { MV.MalVector($0) },
    "vector?": {
        switch $0[0] {
        case MV.MalVector(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "hash-map": { try hash_map($0) },
    "map?": {
        switch $0[0] {
        case MV.MalHashMap(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "assoc": {
        switch $0[0] {
        case MV.MalHashMap(let dict):
            return MV.MalHashMap(try _assoc(dict, Array($0[1..<$0.endIndex])))
        default: throw MalError.General(msg: "Invalid assoc call")
        }
    },
    "dissoc": {
        switch $0[0] {
        case MV.MalHashMap(let dict):
            return MV.MalHashMap(try _dissoc(dict, Array($0[1..<$0.endIndex])))
        default: throw MalError.General(msg: "Invalid dissoc call")
        }
    },
    "get": {
        switch ($0[0], $0[1]) {
        case (MV.MalHashMap(let dict), MV.MalString(let k)):
            return dict[k] ?? MV.MalNil
        case (MV.MalNil, MV.MalString(let k)):
            return MV.MalNil
        default: throw MalError.General(msg: "Invalid get call")
        }
    },
    "contains?": {
        switch ($0[0], $0[1]) {
        case (MV.MalHashMap(let dict), MV.MalString(let k)):
            return dict[k] != nil ? MV.MalTrue : MV.MalFalse
        case (MV.MalNil, MV.MalString(let k)):
            return MV.MalFalse
        default: throw MalError.General(msg: "Invalid contains? call")
        }
    },
    "keys": {
        switch $0[0] {
        case MV.MalHashMap(let dict):
            return MV.MalList(dict.keys.map { MV.MalString($0) })
        default: throw MalError.General(msg: "Invalid keys call")
        }
    },
    "vals": {
        switch $0[0] {
        case MV.MalHashMap(let dict):
            return MV.MalList(dict.values.map { $0 })
        default: throw MalError.General(msg: "Invalid vals call")
        }
    },


    "sequential?": {
        switch $0[0] {
        case MV.MalList(_): return MV.MalTrue
        case MV.MalVector(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "cons": {
        if $0.count != 2 { throw MalError.General(msg: "Invalid cons call") }
        switch ($0[0], $0[1]) {
        case (let mv, MV.MalList(let lst)):
            return MV.MalList([mv] + lst)
        case (let mv, MV.MalVector(let lst)):
            return MV.MalList([mv] + lst)
        default: throw MalError.General(msg: "Invalid cons call")
        }
    },
    "concat": {
        var res = Array<MalVal>()
        for seq in $0 {
            switch seq {
            case MV.MalList(let lst):   res = res + lst
            case MV.MalVector(let lst): res = res + lst
            default: throw MalError.General(msg: "Invalid concat call")
            }
        }
        return MV.MalList(res)
    },
    "nth": {
        if $0.count != 2 { throw MalError.General(msg: "Invalid nth call") }
        switch ($0[0], $0[1]) {
        case (MV.MalList(let lst), MV.MalInt(let idx)):
            if idx >= lst.count {
                throw MalError.General(msg: "nth: index out of range")
            }
            return try _nth($0[0], idx)
        case (MV.MalVector(let lst), MV.MalInt(let idx)):
            if idx >= lst.count {
                throw MalError.General(msg: "nth: index out of range")
            }
            return try _nth($0[0], idx)
        default:
            throw MalError.General(msg: "Invalid nth call")
        }
    },
    "first": {
        switch $0[0] {
        case MV.MalList(let lst):
            return lst.count > 0 ? lst[0] : MalVal.MalNil
        case MV.MalVector(let lst):
            return lst.count > 0 ? lst[0] : MalVal.MalNil
        case MV.MalNil: return MalVal.MalNil
        default: throw MalError.General(msg: "Invalid first call")
        }
    },
    "rest": {
        switch $0[0] {
        case MV.MalList(let lst):
            return lst.count > 0 ? try rest($0[0]) : MalVal.MalList([])
        case MV.MalVector(let lst):
            return lst.count > 0 ? try rest($0[0]) : MalVal.MalList([])
        case MV.MalNil: return MalVal.MalList([])
        default: throw MalError.General(msg: "Invalid rest call")
        }
    },
    "empty?": {
        switch $0[0] {
        case MV.MalList(let lst):
            return lst.count == 0 ? MV.MalTrue : MV.MalFalse
        case MV.MalVector(let lst):
            return lst.count == 0 ? MV.MalTrue : MV.MalFalse
        case MV.MalNil: return MV.MalTrue
        default: throw MalError.General(msg: "Invalid empty? call")
        }
    },
    "count": {
        switch $0[0] {
        case MV.MalList(let lst): return MV.MalInt(lst.count)
        case MV.MalVector(let lst): return MV.MalInt(lst.count)
        case MV.MalNil: return MV.MalInt(0)
        default: throw MalError.General(msg: "Invalid count call")
        }
    },
    "apply": {
        let fn: (Array<MalVal>) throws -> MalVal
        switch $0[0] {
        case MV.MalFunc(let f, _, _, _, _, _): fn = f
        default: throw MalError.General(msg: "Invalid apply call")
        }

        var args = Array($0[1..<$0.endIndex-1])
        switch $0[$0.endIndex-1] {
        case MV.MalList(let l): args = args + l
        case MV.MalVector(let l): args = args + l
        default: throw MalError.General(msg: "Invalid apply call")
        }

        return try fn(args)
    },
    "map": {
        let fn: (Array<MalVal>) throws -> MalVal
        switch $0[0] {
        case MV.MalFunc(let f, _, _, _, _, _): fn = f
        default: throw MalError.General(msg: "Invalid map call")
        }

        var lst = Array<MalVal>()
        switch $0[1] {
        case MV.MalList(let l): lst = l
        case MV.MalVector(let l): lst = l
        default: throw MalError.General(msg: "Invalid map call")
        }

        var res = Array<MalVal>()
        for mv in lst {
            res.append(try fn([mv]))
        }
        return MalVal.MalList(res)
    },

    "conj": {
        return $0[0]
    },
    "seq": {
        if $0.count < 1 { throw MalError.General(msg: "Invalid seq call") }
        switch $0[0] {
        case MV.MalList(let lst):
            if lst.count == 0 { return MV.MalNil }
            return $0[0]
        case MV.MalVector(let lst):
            if lst.count == 0 { return MV.MalNil }
            return MV.MalList(lst)
        case MV.MalString(let str):
            if str.characters.count == 0 { return MV.MalNil }
            return MV.MalList(str.characters.map { MV.MalString(String($0)) })
        case MV.MalNil:
            return MV.MalNil
        default: throw MalError.General(msg: "Invalid seq call")
        }
    },

    "meta": {
        switch $0[0] {
        case MV.MalFunc(_, _, _, _, _, let m):
            return m != nil ? m![0] : MalVal.MalNil
        default: throw MalError.General(msg: "meta called on non-function")
        }
    },
    "with-meta": {
        switch $0[0] {
        case MV.MalFunc(let f, let a, let e, let p, let m, _):
            return MV.MalFunc(f,ast:a,env:e,params:p,macro:m,meta:[$0[1]])
        default: throw MalError.General(msg: "with-meta called on non-function")
        }
    },
    "atom": {
        return MV.MalAtom(MutableAtom(val: $0[0]))
    },
    "atom?": {
        switch $0[0] {
        case MV.MalAtom(_): return MV.MalTrue
        default: return MV.MalFalse
        }
    },
    "deref": {
        switch $0[0] {
        case MV.MalAtom(let ma): return ma.val
        default: throw MalError.General(msg: "Invalid deref call")
        }
    },
    "reset!": {
        switch $0[0] {
        case MV.MalAtom(var a):
            a.val = $0[1]
            return $0[1]
        default: throw MalError.General(msg: "Invalid reset! call")
        }
    },
    "swap!": {
        switch ($0[0], $0[1]) {
        case (MV.MalAtom(var a), MV.MalFunc(let fn, _, _, _, _, _)):
            var args = [a.val]
            if $0.count > 2 {
                args = args + Array($0[2..<$0.endIndex])
            }
            a.val = try fn(args)
            return a.val
        default: throw MalError.General(msg: "Invalid swap! call")
        }
    },
]