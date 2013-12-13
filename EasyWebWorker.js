'use strict';

var EasyWorker = (function(root) {
  if(!root.Worker) {
    root.Worker = function(){
      // Web Workers not defined. TODO: make fallback function for that
    };
  }
  var WorkerCreator = function(data, options) {
    // TODO: support transferable objects (?)
    if(!options) {
      options = {};
    }
    if(typeof data !== 'function') {
      throw new Error('EasyWorker data parameter must contain function.');
    }
    /* XXX: Don't use inline comments in head_scripts block */
    var head_scripts = function() {
      /* Make console available in Worker */
      self.console = (function (c) {
        var method, console = {};
        while (method = c.pop()) {
          console[method] = (function(method) {
            return function() {
              self.postMessage(JSON.stringify({
                'easyWorkerMessageType': 'console',
                'easyWorkerMessageMethod': method,
                'easyWorkerMessageData': Array.slice(arguments)
              }));
            };
          })(method);
        }
        return console;
      })('assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn'.split(','));

      self.done = function() {
        self.postMessage(JSON.stringify({
          'easyWorkerMessageType': 'done',
          'easyWorkerMessageData': Array.slice(arguments)
        }));
      };

      var messageCallbacks = {};
      self.onMsg = function(type, func) {
        if(arguments.length < 2) {
          func = type;
          type = 'default';
        }
        messageCallbacks[type] = func;
      };
      self.onmessage = function(msg) {
        var data;
        try {
          data = JSON.parse(msg.data);
        } catch (err) {
          console.error('wrong data passed in msg', msg.data);
          return;
        }
        return typeof messageCallbacks[data.type] === 'function' ? messageCallbacks[data.type].call(this, data.data) : null;
      };
    };
    data = 'data:text/javascript;charset=UTF-8,' + encodeURIComponent('(' + head_scripts + ')();self.WorkerFunction = ' + data + ';');
    
    if(options.autoStart) {
      if(!(options.argumentsOnAutoStart instanceof Array)) {
        throw new Error('argumentsOnAutoStart option need to be Array');
      }
      data += encodeURIComponent('self.WorkerFunction.apply(self, '+ (options.argumentsOnAutoStart ? JSON.stringify(options.argumentsOnAutoStart) : '[]') +');');
    }
    this.rawWorker = new root.Worker(data);
    var _this = this;
    this.rawWorker.addEventListener("message", function(e) {
      var isObject = false, data;
      try {
        data = JSON.parse(e.data);
        isObject = true;
      } catch (err) {
        data = e.data;
      }
      if(isObject) {
        if(data.easyWorkerMessageType === 'done') {
          return _this.onDoneFunc.apply(_this, data.easyWorkerMessageData);
        }
        else if(data.easyWorkerMessageType === 'console') {
          return console[data.easyWorkerMessageMethod]('WORKER CONSOLE: ', data.easyWorkerMessageData);
        }
      }
      // XXX: debug, remove it when lib is finished
      console.log('Response from Worker: ', data);
    }, false);
    
    this.rawWorker.addEventListener("error", function() {
      _this.onErrorFunc.apply(_this, arguments);
    }, false);

    return this;
  };
  
  WorkerCreator.prototype = {
    msg: function(type, data) {
      if(arguments.length < 2) {
        data = type;
        type = 'default';
      }
      this.rawWorker.postMessage( JSON.stringify( {type:type, data:data}) );
      return this;
    },
    onDoneFunc: function() {
      console.log('WORKER DONE, RESULT: ', arguments);
    },
    onDone: function(func) {
      this.onDoneFunc = func;
      return this;
    },
    onErrorFunc: function() {
      console.log("WORKER ERROR: ", arguments);
    },
    onError: function(func) {
      this.onErrorFunc = func;
      return this;
    },
    close: function() {
      this.rawWorker.terminate();
      return this;
    }
  };
  return function(script, options) {
    return new WorkerCreator(script, options);
  };
})(window);

var test = EasyWorker(function(count) {
  /* do some calculations */
  var result = [];
  for(var i = count; i--;) {
    result.push('element' + i);
  }
  onMsg('default', function(msg) {
    postMessage('thanks for msg! It\'s your message: ' + JSON.stringify(msg));
  });
  console.log('uff almost ready...');
  done(result);
}, {
  autoStart: true,
  argumentsOnAutoStart: [10]
}).onDone(function(responseResult) {
  console.log('Yay, I\'ve received some data from worker:', responseResult);
});

test.msg('default', {"pretty message": "pretty message content"});
