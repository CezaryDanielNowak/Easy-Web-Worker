EasyWorker = (function(root) {
  if(!root.Worker) {
    root.Worker = function(){
      // Web Workers not defined. TODO: make fallback function for that
    };
  }
  var WorkerCreator = function(data, options) {
    if(!options) {
      options = {}
    }
    if(typeof data !== 'function') {
      throw new Error('EasyWorker data parameter must contain function.');
      return false;
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
      })( 'assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn'.split(',') );
      self.done = function() {
        self.postMessage(JSON.stringify({
          'easyWorkerMessageType': 'done',
          'easyWorkerMessageData': Array.slice(arguments)
        }));
      };
      self.onmessage = function(msg) {
        self.postMessage('thanks for msg! It\'s your message: ' + msg.data);
      };
    };
    data = 'data:text/javascript;charset=UTF-8,(' + encodeURIComponent(head_scripts + ')();self.WorkerFunction = ' + data + ';');
    
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
      console.log('Response from Worker: ', data);
    }, false);
    
    this.rawWorker.addEventListener("error", function() {
      console.log("WORKER ERROR: ", arguments);
    }, false);
    
    this.msg = function(data) {
      this.rawWorker.postMessage(typeof data === 'string' ? data : JSON.stringify(data));
      return this;
    };
    this.onDoneFunc = function() {
      console.log('WORKER DONE, RESULT: ', arguments);
    }
    this.onDone = function(func) {
      this.onDoneFunc = func;
      return this;
    };

    return this;
  };
  return function(script, options) {
    return new WorkerCreator(script, options);
  }
})(window);


var test = EasyWorker(function(a,b,c) {
  /* do some calculations */
  var result = [];
  for(var i = 10; i--;) {
    result.push('element' + i);
  }
  
  console.log('uff almost ready...');
  done(result);
}, {
  autoStart: true,
  argumentsOnAutoStart: [1,2,3]
})
.onDone(function(responseResult) {
  console.log('Yay, I\'ve received some data from worker:', responseResult);
});


test.msg({"pretty message": "pretty message content"}); // start the worker.