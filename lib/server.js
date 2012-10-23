
/**
 * Module dependencies.
 */

var debug = require('debug');

module.exports = Server;

function Server(sock) {
  sock.format('json');
  this.sock = sock;
  this.methods = {};
  this.sock.on('message', this.onmessage.bind(this));
}

Server.prototype.methodDescriptions = function(){
  var obj = {};
  var fn;

  for (var name in this.methods) {
    fn = this.methods[name];
    obj[name] = {
      name: name,
      params: params(fn)
    };
  }

  return obj;
};

Server.prototype.respondWithMethods = function(reply){
  reply({ methods: this.methodDescriptions() });
};

Server.prototype.onmessage = function(msg, reply){
  if ('methods' == msg.type) return this.respondWithMethods(reply);

  // .method
  var meth = msg.method;
  if (!meth) return reply({ error: '.method required' });

  // ensure .method is exposed
  var fn = this.methods[meth];
  if (!fn) return reply({ error: 'method "' + meth + '" does not exist' });

  // .args
  var args = msg.args;
  if (!args) return reply({ error: '.args required' });

  // invoke
  args.push(function(err){
    if (err) return reply({ error: err.message });
    var args = [].slice.call(arguments, 1);
    reply({ args: args });
  });

  fn.apply(null, args);
};


Server.prototype.expose = function(name, fn){
  if (1 == arguments.length) {
    for (var key in name) {
      this.expose(key, name[key]);
    }
  } else {
    debug('expose "%s"', name);
    this.methods[name] = fn;
  }
};

function params(fn) {
  var ret = fn.toString().match(/^function *(\w*)\((.*?)\)/)[2];
  if (ret) return ret.split(/ *, */);
  return [];
}