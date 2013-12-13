EasyWebWorkers
==============

This library make use WebWorkers easier for developer


Sample Usage
==============

```javascript
// EastWorker creates new instance by default, no need to add new keyword
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
```

Custom functions available in Worker scope
==============

self.onMsg(callbackOrType[, callback])
---------------------
Worker is expecting message with specific Type.
Default type is 'default'
To execute onMsg callback, defined as:
`self.onMsg('custom', function(){ /* do something */ });`
trigger:
`easyWorkerInstance.msg('custom', {thisIsMy:'data'});`

self.console(args...)
---------------------
EasyWorker adds console functionality to Workers. You can use any of following:
- console.assert,
- console.count,
- console.debug,
- console.dir,
- console.dirxml,
- console.error,
- console.exception,
- console.group,
- console.groupCollapsed,
- console.groupEnd,
- console.info,
- console.log,
- console.markTimeline,
- console.profile,
- console.profileEnd,
- console.time,
- console.timeEnd,
- console.trace,
- console.warn

self.done(result)
---------------------
When job is done, trigger done() function.
Handle result by `easyworkerInstance.onDone(callback)`

...
