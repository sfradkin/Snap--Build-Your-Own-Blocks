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
      if (findSnapMusicBlock(block)) {
        hasToneChild = true;
      } else {
        hasToneChild = false;
      }

      console.log('hasToneChild: ', hasToneChild);

      // if (block.children.length > 0) {
      //   hasToneChild = block.children.some(function(child) {
      //     if (child.selector === 'toneSimpleSynth') {
      //       return true;
      //     }
      //   });
      // }

      block.hasToneChild = hasToneChild;

      if ((block.isTone && block.isTone()) || hasToneChild) {
        if (Tone.Transport.state === 'stopped') {
          // add some initialization
          console.log('scheduling sweep clean');
          Tone.Transport.scheduleRepeat(sweepClean, 5, 0);
          console.log('samples: ', samples);
          if (!samples || samples.length === 0) {
            console.log('preloading samples');
            preloadSamples();
          }
          console.log('default synth: ', defaultSynth);
          if (!defaultSynth) {
            console.log('generating default synth');
            defaultSynth = generateDefaultSynth();
          } else {
            defaultSynth = null;
            defaultSynth = generateDefaultSynth();
          }
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

  Process.prototype.evaluateContext = (function(oldEvaluateContext) {
    return function() {
      var exp = this.context.expression;
      var hasMusic = false;
      console.log('evaluateContext: evaluating exp: ', exp);
      if (exp instanceof Array) {
        if ((!this.homeContext.expression || !this.homeContext.expression.curPartId) && (this.topBlock.selector === 'receiveGo' || this.topBlock === exp[0]) && this.context.pc === 0) {
          // go through each block to see if we find one of the music blocks
          if (exp.some(function(block) {
            return findSnapMusicBlock(block);
          })) {
            // if == true
            var partId = initMusicPart();
            // put the partId into the home context
            this.homeContext.expression = {curPartId: partId};
            // add a fake block to the end of the array
            exp.push('musicEnd');
          } else {
            /// if == false
            // do nothing
          }
        }
      } else if (exp === 'musicEnd') {
        musicEnd(this.homeContext.expression.curPartId);
        this.popContext();
      } else if (exp === 'loopEnd') {
        loopEnd(this.homeContext.expression.curPartId);
        this.popContext();
      }

      if (exp !== 'musicEnd' && exp !== 'loopEnd') {
        return oldEvaluateContext.call(this);
      }

    };
  }(Process.prototype.evaluateContext));

}());
