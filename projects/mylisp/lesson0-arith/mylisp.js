// eval part
var evaluate = function(x, env) {
  if (Array.isArray(x)) {
    var exps = x.map(function(exp) {return evaluate(exp, env);});
    var proc = exps.shift();
    return proc.apply(null, exps);
  } else {
    var y = env[x];
    return y !== undefined ? y : x;
  }
};
// library
var array = function(xs) {return Array.prototype.map.call(xs, function(x) {return x;});};
var globalEnv = {
  '+': function() {return array(arguments).reduce(function(a, b) {return Number(a) + Number(b);}, 0);},
  '-': function() {return arguments.length === 0 ? 0
                   : arguments.length === 1 ? -arguments[0]
                   : array(arguments).reduce(function(a, b) {return Number(a) - Number(b);});},
  '*': function() {return array(arguments).reduce(function(a, b) {return Number(a) * Number(b);});},
  '/': function() {return array(arguments).reduce(function(a, b) {return Number(a) / Number(b);});},
  'mod': function(num, div) {return Number(num) % Number(div);}
};
