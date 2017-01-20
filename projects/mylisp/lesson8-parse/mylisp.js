// reader part
var tokenize = function(str) {
  return str.replace(/\\"/g,'\0').split('"').map(function(x, i) {
    return (i % 2 === 0)
      ? x.replace(/\(/g, ' ( ').replace(/\)/g, ' ) ').replace(/\s/g, '\0') // not in double quotes
      : x.replace(/\0/g, '\\"'); // in double quotes
  }).join('"').split(/\0+/).filter(function(x){return x.length !== 0;});
};
var read = function(tokens) {
  if (tokens.length === 0) {throw ['SyntaxError','unexpected EOF while reading'];}
  var token = tokens.shift();
  if ('(' === token) {
    var list = [];
    while (tokens[0] !== ')') {list.push(read(tokens));}
    tokens.shift();
    return list;
  } else if (')' === token) {
    throw ['SyntaxError','unexpected )'];
  } else if ("'" === token) { // quote reader macro
    return ['quote', read(tokens)];
  } else {
    return token;
  }
};
var parse = function(s) {return read(tokenize(s));};
// eval part
var Env = function(binding, outerEnv) {
  return {
    binding: binding,
    outerEnv: outerEnv,
    findEnv: function(key) {return (key in this.binding || this.outerEnv === undefined)
                            ? this
                            : this.outerEnv.findEnv(key);}
  };
};
var evaluate = function(x, env) {
  if (Array.isArray(x)) {
    if (x[0] === 'if') { // (if test a b)
      return String(evaluate(x[1], env)) !== 'false'
        ? evaluate(x[2], env)
        : evaluate(x[3], env);
    } else if (x[0] === 'def') { // (def var exp)
      return env.binding[x[1]] = evaluate(x[2], env);
    } else if (x[0] === 'set!') { // (set! var exp)
      return env.findEnv(x[1]).binding[x[1]] = evaluate(x[2], env);
    } else if (x[0] === 'fn') { // (fn (args*) body...)
      return function() {
        var args = array(arguments); // 関数実行時に渡される実引数
        var params = x[1];           // 関数定義における仮引数
        var ampIdx = params.indexOf('&'); // 可変長引数が始まる場所を検索
        var newEnv = {}; // 関数呼び出し毎に新しいローカル変数領域を作成
        params.forEach(function(param, i) {newEnv[param] = ((ampIdx === -1 || i < ampIdx)
                                                            ? args[i] : args.slice(i - 1));});
        return evaluate(['do'].concat(x.slice(2)), Env(newEnv, env));
      };
    } else if (x[0] === 'eval') { // (eval exp*)
      return evaluate(macroexpand(evaluate(x[1], env)), env);
    } else if (x[0] === 'quote') { // (quote exp)
      return x[1];
    } else { // execute function
      var exps = x.map(function(exp) {return evaluate(exp, env);});
      var proc = exps.shift();
      return proc.apply(null, exps);
    }
  } else {
    var y = env.findEnv(x).binding[x];
    return y !== undefined ? y : x;
  }
};
// macro
var macroTable = {};
var macroexpand = function(x) {
  if (Array.isArray(x)) {
    if (x[0] === 'defmacro') { // (defmacro name (args*) body...) ←マクロ定義
      var macrofn = ['fn'].concat(macroexpand(x.slice(2)));
      macroTable[x[1]] = evaluate(macrofn, globalEnv);
      return undefined;
    } else if (x[0] in macroTable) { // (macro args ...) ←マクロ展開
      return macroexpand(macroTable[x[0]].apply(null, macroexpand(x.slice(1))));
    } else { // 再帰的にマクロ展開
      return x.reduce(function(acc, x) {return acc.concat([macroexpand(x)]);}, []);
    }
  } else { // マクロに関係ない部分はそのままにする
    return x;
  }
};
// library
var astToStr = function(exp) {return (Array.isArray(exp)) ? '(' + exp.map(astToStr).join(' ') + ')' : (exp instanceof Function) ? '#fn#' : exp;};
var array = function(xs) {return Array.prototype.map.call(xs, function(x) {return x;});};
var gensymIdx = 0;
var globalEnv = Env({
  'do': function() {return arguments[arguments.length - 1];},
  '+': function() {return array(arguments).reduce(function(a, b) {return Number(a) + Number(b);}, 0);},
  '-': function() {return arguments.length === 0 ? 0
                   : arguments.length === 1 ? -arguments[0]
                   : array(arguments).reduce(function(a, b) {return Number(a) - Number(b);});},
  '*': function() {return array(arguments).reduce(function(a, b) {return Number(a) * Number(b);});},
  '/': function() {return array(arguments).reduce(function(a, b) {return Number(a) / Number(b);});},
  'mod': function(num, div) {return Number(num) % Number(div);},
  'not': function(x) {return !x;},
  '=': function() {var xs = array(arguments); return xs.every(function(x, i) {return i === 0 ? true : xs[i-1] == xs[i];});},
  '>': function() {var xs = array(arguments); return xs.every(function(x, i) {return i === 0 ? true : xs[i-1] > xs[i];});},
  '<': function() {var xs = array(arguments); return xs.every(function(x, i) {return i === 0 ? true : xs[i-1] < xs[i];});},
  '<=': function() {var xs = array(arguments); return xs.every(function(x, i) {return i === 0 ? true : xs[i-1] <= xs[i];});},
  '>=': function() {var xs = array(arguments); return xs.every(function(x, i) {return i === 0 ? true : xs[i-1] >= xs[i];});},
  'first': function(xs) {return xs[0];},
  'rest': function(xs) {return xs.slice(1);},
  'append': function(xs, x){return xs.concat([x]);},
  'cons': function(x, xs) {return [x].concat(xs);},
  'list': function() {return array(arguments);},
  'count': function(xs) {return xs.length;},
  'concat': function() {return array(arguments).reduce(function(xs, ys) {return xs.concat(ys);});},
  'nth': function(xs, index, notFound) {return index < xs.length ? xs[index] : notFound;},
  'nthrest': function(xs, n) {return xs.slice(n);},
  'atom?': function(x) {return !Array.isArray(x);},
  'map': function(f, xs) {return Array.prototype.map.call(xs, function(x) {return f(x);});},
  'reduce': function(f, xs) {return Array.prototype.reduce.call(xs, function(a, b) {return f(a, b);});},
  'fold': function(f, xs, init) {return Array.prototype.reduce.call(xs, function(acc, x) {return f(acc, x);}, init);},
  'every': function(f, xs) {return Array.prototype.every.call(xs, function(x) {return f(x);});},
  'some': function(f, xs) {return Array.prototype.some.call(xs, function(x) {return f(x);});},
  'range': function(n) {var xs = []; for (var i = 0; i < n; i++) {xs.push(i);} return xs;},
  'str':  function() {var xs = array(arguments); return xs.reduce(function(acc, x) {return acc + astToStr(x);}, "");},
  'read-string': function(s) {return parse(s.slice(1, s.length - 1));},
  'gensym': function(label) {return (label ? String(label) : 'G') + '__' + (gensymIdx++);},
  'macroexpand': function(form) {return macroexpand(form);},
  'now': function() {return Date.now();},
  'print': function() {console.log.apply(console, array(arguments).map(astToStr));},
  'alert': function() {alert(astToStr(array(arguments)));}
});
evaluate(macroexpand(parse(
  "(do " +
    "  (defmacro when (test & body) (list if test (cons do body) null))" +
    "  (defmacro cond (& body)" +
    "    (if (<= (count body) 2)" +
    "        (list if (nth body 0) (nth body 1) null)" +
    "        (list if (nth body 0) (nth body 1) (cons cond (nthrest body 2)))))" +
    "  (defmacro let (vars & body)" +
    "    (if (<= (count vars) 2)" +
    "        (list (concat (list fn (list (first vars))) body) (nth vars 1))" +
    "        (list (list fn (list (first vars)) (concat (list let (nthrest vars 2)) body)) (nth vars 1))))" +
    "  (defmacro defn (name params & body) (list def name (concat (list fn params) body)))" +
    "  (defn inc (n) (+ n 1))" +
    "  (defn dec (n) (- n 1))" +
    "  (defn even? (n) (= (mod n 2) 0))" +
    "  (defn odd? (n) (not (even? n)))" +
    "  )"
)), globalEnv);
