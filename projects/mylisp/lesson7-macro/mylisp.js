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
var array = function(xs) {return Array.prototype.map.call(xs, function(x) {return x;});};
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
  'alert': function() {alert(array(arguments));},
  'macroexpand': function(form) {return macroexpand(form);},
  'first': function(xs) {return xs[0];},
  'rest': function(xs) {return xs.slice(1);},
  'append': function(xs, x){return xs.concat([x]);},
  'cons': function(x, xs) {return [x].concat(xs);},
  'list': function() {return array(arguments);},
  'count': function(xs) {return xs.length;},
  'concat': function() {return array(arguments).reduce(function(xs, ys) {return xs.concat(ys);});},
  'nth': function(xs, index, notFound) {return index < xs.length ? xs[index] : notFound;},
  'nthrest': function(xs, n) {return xs.slice(n);}
});
