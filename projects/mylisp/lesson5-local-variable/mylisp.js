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
      return env.binding[x[1]] = evaluate(x[2], env); // ← envのAPIが変わったため追従
    } else if (x[0] === 'set!') { // (set! var exp) ← 内から外に向かってバインディングを探して、そこに代入
      return env.findEnv(x[1]).binding[x[1]] = evaluate(x[2], env);
    } else if (x[0] === 'fn') { // (fn (args*) exp)
      return function() {
        var args = arguments; // 関数実行時に渡される実引数
        var params = x[1];    // 関数定義における仮引数
        // 関数に渡された実引数を、関数定義の仮引数に代入
        var newEnv = {}; // 関数呼び出し毎に新しいローカル変数領域を作成
        params.forEach(function(param,i) {newEnv[param] = args[i];});
        return evaluate(['do'].concat(x.slice(2)), Env(newEnv, env));
      };
    } else { // execute function
      var exps = x.map(function(exp) {return evaluate(exp, env);});
      var proc = exps.shift();
      return proc.apply(null, exps);
    }
  } else {
    var y = env.findEnv(x).binding[x]; // ローカルのスコープからグローバルなスコープへと探す
    return y !== undefined ? y : x;
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
  'alert': function() {alert(array(arguments));}
});
