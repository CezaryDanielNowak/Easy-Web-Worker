EasyWorker = (function(root) {
  if(!root.Worker) {
    root.Worker = function(){
      // Web Workers not defined. TODO: make fallback function for that
    };
  }
  var WorkerCreator = function(data) {
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
                'easyWorkerMessageData': arguments
              }));
            };
          })(method);
        }
        return console;
      })( 'assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn'.split(',') );

      self.onmessage = function(msg) {
        self.postMessage(msg.data);
      };
    };
    data = 'data:text/javascript;charset=UTF-8,(' + head_scripts + ')();(' + encodeURIComponent(data) + ')();';
    this.rawWorker = new root.Worker(data);
    this.rawWorker.addEventListener("message", function(e) {
      var isObject = false, data;
      try {
        data = JSON.parse(e.data);
        isObject = true;
      } catch (e) {
        data = e.data;
      }
      if(isObject && data.easyWorkerMessageType === 'console') {
        return console[data.easyWorkerMessageMethod]('WORKER CONSOLE: ', data.easyWorkerMessageData);
      }
      console.log('Response from Worker: ', data);
    }, false);
    this.rawWorker.addEventListener("error", function() {
      console.log("WORKER ERROR: ", arguments);
    }, false);
    this.msg = function(data) {
      test.rawWorker.postMessage(typeof data === 'string' ? data : JSON.stringify(data))
    };
    return this;
  };
  return function(script) {
    return new WorkerCreator(script);
  }
})(window);


var test = EasyWorker(function() {
  /* TODO: make communication layer like in jQuery: .success, .error, .when */
  console.log('it\'s alive !');
});


test.msg({"pretty message": "pretty message content"}); // start the worker.