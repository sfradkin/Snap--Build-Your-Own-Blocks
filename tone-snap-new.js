var toneMap = {};

var addSynthToToneMap = function(toneSynth) {
  var existingSynth = toneMap[toneSynth.id];

  if (!existingSynth) {
    toneMap[toneSynth.id] = toneSynth;
  }

};

var scheduleNote = function(id, noteObj, store) {
  var existingSynth = toneMap[id];

  if (existingSynth) {
    // convert note length into seconds
    noteObj.seconds = Tone.Transport.toSeconds(noteObj.time);

    console.log('scheduling note: ', noteObj.note, ' for length: ', noteObj.time, ' which is: ', noteObj.seconds, 's and at virtual time: ', existingSynth.curVirtTime);
    console.log('schedule note at transport tick: ', (existingSynth.transportTimeStart + existingSynth.offSetTicks));

    Tone.Transport.scheduleOnce(function(time) {
      console.log('playing note: ' + noteObj.note + ' for length: ' + noteObj.time + ' at transport tick time: ' + Tone.Transport.ticks);
      existingSynth.synth.triggerAttackRelease(noteObj.note, noteObj.time);
    }, (existingSynth.transportTimeStart + existingSynth.offSetTicks) + 'i');

    // update the virtual time of the synth
    existingSynth.curVirtTime = existingSynth.curVirtTime + noteObj.seconds;

    //existingSynth.nextTime = existingSynth.synth.toSeconds('+' + noteObj.time, existingSynth.nextTime);

    existingSynth.offSet += existingSynth.synth.toSeconds(noteObj.time);
    existingSynth.offSetTicks = Tone.Transport.toTicks(existingSynth.offSet);
    console.log('offset time in seconds: ', existingSynth.offSet, ' offset time in ticks: ', existingSynth.offSetTicks);

    if (store) {
      existingSynth.notes.push(noteObj);
      existingSynth.loopTime = existingSynth.loopTime + noteObj.seconds;
    }
  }
};

var createAndPlaySynth = function(synthid) {

  console.log('at end of synth block: ', synthid);

  // set a flag on each of the synths to tell it to use "recorded mode"
  // kick off "recorded mode playback"
  var keys = Object.keys(toneMap);

  keys.forEach(function(key) {
    synthObj = toneMap[key];
    synthObj.recordedMode = true;
    synthObj.totalLoopOffset = synthObj.offSet;
  });

  doToneRecordedMode();

};

var stopTone = function() {
  console.log('in stopTone');

  console.log('stopping transport');
  // stop the Transport
  Tone.Transport.stop();

  // clean up synths
  var keys = Object.keys(toneMap);

  console.log('cleaning up synths');
  keys.forEach(function(key) {
    synthObj = toneMap[key];
    synthObj.synth.dispose();
  });
};

var doToneRecordedMode = function() {
  var synthObj, notes;
  var loopStart = {};
  var loopEnd = {};
  var keys = Object.keys(toneMap);

    keys.forEach(function(key) {

      synthObj = toneMap[key];

      console.log('time now: ', Tone.Transport.now(), ', schedule periodic callback 1 for synth id: ', synthObj.id, ' every ', (synthObj.loopTime - 0.05));
      Tone.Transport.scheduleRepeat(function(time) {
        console.log('---------callback 1 fired at ' + Tone.Transport.now());
      //console.log('transport status: ' + Tone.Transport.state);
      //console.log('synthObj.recordedMode = ' + synthObj.recordedMode);
      //console.log('time now: ' + Tone.Transport.now() + ', schedule callback 2 for: ' + (loopStart[key] ? ((loopStart[key] + synthObj.totalLoopOffset) - Tone.Transport.now() - 0.05) : 0.05));

      // Tone.Transport.scheduleOnce(function(time) {
      //   console.log('---------in callback 2 fired at ' + Tone.Transport.now());
      //   loopStart[key] = Tone.Transport.now();
      //   // check for recorded mode === false here and return right away
      //   if (synthObj.recordedMode === false) {
      //     return;
      //   }

        notes = synthObj.notes;

        notes.forEach(function(noteObj) {
          //if (synthObj.recordedMode) {
            scheduleNote(synthObj.id, noteObj, false);
          //}
        });
        //loopEnd[key] = synthObj.synth.now();
    //  }, '+' + (loopStart[key] ? ((loopStart[key] + synthObj.totalLoopOffset) - Tone.Transport.now() - 0.05) : 0.05));
      }, (synthObj.loopTime - 0.05));
    });
};

ToneSynth.prototype = new Object();
function ToneSynth(id, synth) {
  this.id = id;
  this.synth = synth;
  this.notes = [];
  this.startTime = Tone.Transport.now(); // shouldn't need
  this.nextTime = this.startTime + 0.05; // shouldn't need
  this.offSet = 0; // shouldn't need
  this.totalLoopOffset = 0; // shouldn't need
  this.recordedMode = false;  // shouldn't need
  this.transportTimeStart = 0;  // The transport time this synth was started at
  this.curVirtTime = 0;  // The current virtual time of this synth
  this.loopTime = 0;  // The time it takes to make a loop of the notes defined in this synth
  this.offSetTicks = 0;
};

ToneBlockMorph.prototype = new CommandBlockMorph();
ToneBlockMorph.prototype.constructor = ToneBlockMorph;
ToneBlockMorph.uber = CommandBlockMorph.prototype;

function ToneBlockMorph() {
    this.init();
};

ToneBlockMorph.prototype.init = function() {
    ToneBlockMorph.uber.init.call(this);
};

ToneBlockMorph.prototype.isTone = function() {
  return true;
}

ToneBlockMorph.prototype.receiveUserInteraction = function(interaction) {
    var stage = this.parentThatIsA(StageMorph),
        procs = [],
        hats;
    if (!stage) {return; } // currently dragged
    hats = this.allHatBlocksForInteraction(interaction);
    hats.forEach(function (block) {
        procs.push(stage.threads.startProcess(block, stage.isThreadSafe, false, createAndPlaySynth));
    });
    return procs;
};

ToneBlockMorph.prototype.reactToTemplateCopy = function() {
  ToneBlockMorph.uber.reactToTemplateCopy.call(this);
  this.id = '' + (Math.random() * (100 - 0) + 0);
};

Process.prototype.toneSimpleSynth = function (body) {

  console.log('id of simple synth: ' + this.context.expression.id);
  // create the synth object here and store it in the toneMap

  var existingSynth = toneMap[this.context.expression.id];

  if (!existingSynth) {

    var synth = new Tone.MonoSynth({type: 'sine'});
    synth.toMaster();
    synth.oscillator.sync();

    var toneSynth = new ToneSynth(this.context.expression.id, synth);
    toneSynth.transportTimeStart = Tone.Transport.ticks;
    toneSynth.curVirtTime = 0;

    addSynthToToneMap(toneSynth);
    existingSynth = toneSynth;
  } else {
    existingSynth.recordedMode = false;
  }

  var outer = this.context.outerContext;
  outer.expression = this.context.expression.id;
  this.popContext();
      if (body) {
          this.pushContext(body.blockSequence(), outer);
      }
  this.pushContext();

};

Process.prototype.toneNote = function(note, time) {
  var outerId = this.context.outerContext.expression;
  console.log('in Process.toneTest function, outerId = ' + outerId);

  scheduleNote(outerId, {note: note, time: time}, true);  // when processing the actual note block we send a boolean true to store for later
  return null;

};
