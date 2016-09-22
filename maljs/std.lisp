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
			(let* [cond (gensym)]
				`(let* [~cond ~(first l)]
					(if ~cond
						~cond
						(or ~@(rest l))))))))

(def *gensym-counter* (atom 0))

(defn inc [x] (+ x 1))

(defn gensym []
	(symbol (str "@@" (swap! *gensym-counter* inc))))

(defn peek [x]
	(do (internal/print (str x))
		x))

(defn hash-map [& l]
	  (apply assoc {} l))

(defn conj [l & xs]
	(if (empty? xs)
		l
		(if (list? l)
			(apply conj (cons (first xs) l) (rest xs))
			(apply vector (concat l xs)))))

(defn seq [l]
	(cond
		(empty? l) nil
		(list? l) l
		(vector? l) (apply list l)
		(string? l) (internal/chars l)))

