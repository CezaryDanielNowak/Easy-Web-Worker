Easy Web Worker
==============

This library make use Web Workers easier for developer


Documentation
==============

easyWorkerInstance = EasyWorker(workerFunction[, options])
---------------------
EasyWorker returns new instance of EasyWorker;
Pass workerFunction, that you want to be executed inside worker.
options argument is plain object, and can take following fields:
- `autoStart`: no extra message will be sent to run the worker
- `argumentsOnAutoStart`: array of arguments passed to workerFunction on autoStart

easyWorkerInstance.onDone(callback)
---------------------
onDone will execute when done() function is called in worker scope. It takes one
parameter with worker result. You can terminate your worker now.

easyWorkerInstance.onError(callback)
---------------------
onError will execute when any error will be throwed from worker.

easyWorkerInstance.msg(callbackOrType, callback)
---------------------
Post message to the Worker. You can easly capture events by worker.onMsg

easyWorkerInstance.terminate()
---------------------
Immediately shut down the worker. You can't reuse it, when terminate is called.

easyWorkerInstance.run(args...)
---------------------
Run workerFunction with passed arguments.


Sample Usage
==============

```javascript
// EastWorker creates new instance by default, no need to add new keyword
var test = EasyWorker(function(prefix, count) {
  /* do some calculations */
  var result = [];
  for(var i = count; i--;) {
    result.push(prefix + i);
  }
  onMsg('default', function(msg) {
    postMessage('thanks for msg! It\'s your message: ' + JSON.stringify(msg));
  });
  console.log('uff almost ready...');
  done(result);
}).onDone(function(responseResult) {
  console.log('Yay, I\'ve received some data from worker:', responseResult);
}).run('foo-', 10);
```

Functions available in Worker scope
==============

self.onMsg(callbackOrType[, callback])
---------------------
Worker is expecting message with specific Type.
Default type is 'default'
To execute onMsg callback, defined as:
`self.onMsg('custom', function() { /* do something */ });`
trigger:
`easyWorkerInstance.msg('custom', {thisIsMy:'data'});`

self.console(args...)
---------------------
EasyWorker adds console functionality to Workers. You can use any of following:
- console.debug,
- console.error,
- console.exception,
- console.group,
- console.groupCollapsed,
- console.groupEnd,
- console.info,
- console.log,
- console.time,
- console.timeEnd,
- console.warn

self.done(result)
---------------------
When job is done, trigger done() function.
Handle result by `easyWorkerInstance.onDone(callback)`

...
