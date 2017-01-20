// eval part
var evaluate = function(x, env) {
  if (Array.isArray(x)) {
    if (x[0] === 'if') { // (if test a b)
      return String(evaluate(x[1], env)) !== 'false'
        ? evaluate(x[2], env)
        : evaluate(x[3], env);
    } else if (x[0] === 'def') { // (def var exp)
      return env[x[1]] = evaluate(x[2], env);
    } else { // execute function
      var exps = x.map(function(exp) {return evaluate(exp, env);});
      var proc = exps.shift();
      return proc.apply(null, exps);
    }
  } else {
    var y = env[x];
    return y !== undefined ? y : x;
  }
};
// library
var array = function(xs) {return Array.prototype.map.call(xs, function(x) {return x;});};
var globalEnv = {
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
};
