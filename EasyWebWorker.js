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
                'easyWorkerMessageData': [].slice.call(arguments)
              }));
            };
          })(method);
        }
        return console;
      })('debug,error,exception,group,groupCollapsed,groupEnd,info,log,time,timeEnd,warn'.split(','));
      /* done: call it when calculations are done, pass result to your code */
      self.done = function(/* args... */) {
        self.postMessage(JSON.stringify({
          'easyWorkerMessageType': 'done',
          'easyWorkerMessageData': [].slice.call(arguments)
        }));
      };

      var messageCallbacks = {
        /* build in message callback to support easyWorkerInstance.run() */
        __run: function() {
          console.info('run', arguments);
          self.__WorkerFunction.apply(self, arguments);
        }
      };

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
          throw new Error('wrong data passed in msg: ' + msg.data);
        }
        return typeof messageCallbacks[data.type] === 'function' ? messageCallbacks[data.type].apply(this, data.data) : null;
      };
    };
    data = 'data:text/javascript;charset=UTF-8,' + encodeURIComponent('(' + head_scripts + ')();self.__WorkerFunction=' + data + ';');
    
    if(options.autoStart) {
      if(!(options.argumentsOnAutoStart instanceof Array)) {
        throw new Error('argumentsOnAutoStart option need to be Array');
      }
      data += encodeURIComponent('self.__WorkerFunction.apply(self, '+ (options.argumentsOnAutoStart ? JSON.stringify(options.argumentsOnAutoStart) : '[]') +');');
    }
    this.rawWorker = new root.Worker(data);
    var _this = this;
    this.rawWorker.addEventListener("message", function(e) {
      var isObject, data;
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
      if(this.terminated) {
        throw new Error('Worker has finished his job. You can\'t post message now');
      }
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
      console.error("WORKER ERROR: ", arguments);
    },
    onError: function(func) {
      this.onErrorFunc = func;
      return this;
    },
    terminate: function() {
      this.rawWorker.terminate();
      this.terminated = true;
      return this;
    },
    run: function() {
      this.msg('__run', [].slice.call(arguments));
      return this;
    },

    terminated: false
  };
  return function(script, options) {
    return new WorkerCreator(script, options);
  };
})(window);
