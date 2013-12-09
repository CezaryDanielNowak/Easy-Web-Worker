EasyWorker = (function(root){
  if(!root.Worker) {
    root.Worker = function(){
    
    };
  }
  var WorkerCreator = function(data) {
    if(typeof data === 'function') {
      data = 'data:text/javascript;charset=UTF-8,(' + encodeURIComponent(data) + ')();';
    }
    this.rawWorker = new root.Worker(data);
    return this;
  };
  return function(script) {
    return new WorkerCreator(script);
  }
})(window);


var test = EasyWorker(function() {
  // TODO: make console wrapper in Worker
  // TODO: make communication layer like in jQuery: .success, .error, .when
});
