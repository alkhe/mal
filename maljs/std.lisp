(defn not [a]
	(if a false true))

(defmacro cond [& l]
	(if (not (empty? l))
		(list 'if (first l)
			(if (> (count l) 1)
				(nth l 1)
				(throw "odd number of forms to cond"))
			(cons 'cond (rest (rest l))))))

(defmacro or [& l]
	(if (not (empty? l))
		(if (= 1 (count l))
			(first l)
			`(let* [o ~(first l)]
				(if o
					o
					(or ~@(rest l)))))))

(defn hash-map [& l]
	  (apply assoc {} l))
