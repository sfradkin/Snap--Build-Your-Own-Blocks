/*
 * Extensions to Snap's threads.js
*/

(function() {

  "use strict";

  ThreadManager.prototype.toggleProcess = (function(oldToggleProcess) {
    return function(block) {
      var active = this.findProcess(block);
      if (active) {
          active.stop();
      } else {
          if (block.isTone && block.isTone()) {  // if the block is a ToneBlock, then we need to set the block complete callback
            return this.startProcess(block, false, false, createAndPlaySynth);
          } else {
            return oldToggleProcess.call(this, block);
          }
      }
    };
  }(ThreadManager.prototype.toggleProcess));

  ThreadManager.prototype.startProcess = (function(oldStartProcess) {
    return function(block, isThreadSafe, exportResult, callback, isClicked) {

      var hasToneChild;
      // before we start a process for a set of Tone blocks, check to see if
      // the Tone.Transport is started
      // if it's not started, then start it up
      // if it's already started, then don't do anything
      console.log('block is: ', block);
      if (block.children.length > 0) {
        hasToneChild = block.children.some(function(child) {
          if (child.selector === 'toneSimpleSynth') {
            return true;
          }
        });
      }

      block.hasToneChild = hasToneChild;

      if ((block.isTone && block.isTone()) || hasToneChild) {
        if (Tone.Transport.state === 'stopped') {
          console.log('starting transport');
          Tone.Transport.start();
        }
        console.log('transport state ' + Tone.Transport.state);
      }

      return oldStartProcess.call(this, block, isThreadSafe, exportResult, callback, isClicked);

    };
  }(ThreadManager.prototype.startProcess));

  ThreadManager.prototype.removeTerminatedProcesses = (function(oldRemoveTerminatedProcesses) {
    return function() {

      this.processes.forEach(function (proc) {
        if (proc.topBlock instanceof ToneBlockMorph || proc.topBlock.hasToneChild) {
          if (proc.onComplete instanceof Function) {
              proc.onComplete(proc.homeContext.expression); // this passes in the ToneBlock generated id to onComplete
          }
        }
      });

      return oldRemoveTerminatedProcesses.call(this);

    };
  }(ThreadManager.prototype.removeTerminatedProcesses));

}());
