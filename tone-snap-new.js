var toneMap = {};

var shortestOffsetTime = function() {
  var keys = Object.keys(toneMap);

  var shortestOffset = -1;

  keys.forEach(function(key) {
    synthObj = toneMap[key];

    if (shortestOffset === -1) {
      shortestOffset = synthObj.totalLoopOffset;
    } else {
      if (synthObj.totalLoopOffset < shortestOffset) {
        shortestOffset = synthObj.totalLoopOffset;
      }
    }
  });

  return shortestOffset - 0.05 > 0 ? shortestOffset - 0.05 : 0.05;
};

var endRecordedMode = function() {
  var keys = Object.keys(toneMap);

  return keys.some(function(key) {
    synthObj = toneMap[key];

    if (!synthObj.recordedMode) {
      return true;
    } else {
      return false;
    }
  });
};

var addSynthToToneMap = function(toneSynth) {
  var existingSynth = toneMap[toneSynth.id];

  if (!existingSynth) {
    toneMap[toneSynth.id] = toneSynth;
  }

  console.log('start time: ' + toneSynth.startTime);
};

var scheduleNote = function(id, noteObj) {
  var existingSynth = toneMap[id];

  if (existingSynth) {
    console.log('playing note: ' + noteObj.note + ' for length: ' + noteObj.time + ' at time: ' + existingSynth.nextTime);
    existingSynth.synth.triggerAttackRelease(noteObj.note, noteObj.time, existingSynth.nextTime);

    existingSynth.nextTime = existingSynth.synth.toSeconds('+' + noteObj.time, existingSynth.nextTime);

    existingSynth.offSet += existingSynth.synth.toSeconds(noteObj.time);

    if (!existingSynth.recordedMode) {
      existingSynth.notes.push(noteObj);
    }
  }
};

var createAndPlaySynth = function() {

  console.log('at end of synth block');

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
  // set flags on all synths to tell it to stop using "recorded mode"
  var keys = Object.keys(toneMap);

  keys.forEach(function(key) {
    synthObj = toneMap[key];
    synthObj.recordedMode = false;
  });

  // stop the Transport
  Tone.Transport.stop();
};

var doToneRecordedMode = function() {
  var synthObj, notes;
  var loopStart = {};
  var loopEnd = {};
  var keys = Object.keys(toneMap);

  Tone.Transport.setInterval(function() {
    console.log('---------callback 1 fired at ' + Tone.Transport.now());
    keys.forEach(function(key) {

      synthObj = toneMap[key];

      console.log('transport status: ' + Tone.Transport.state);
      console.log('synthObj.recordedMode = ' + synthObj.recordedMode);
      console.log('creating timeout, setting time to timeout as ' + (loopStart[key] ? ((loopStart[key] + synthObj.totalLoopOffset) - synthObj.synth.now() - 0.05) : 0.05));

      Tone.Transport.setTimeout(function() {
        console.log('---------in callback 2 fired at ' + Tone.Transport.now());
        loopStart[key] = synthObj.synth.now();
        // check for recorded mode === false here and return right away
        if (synthObj.recordedMode === false) {
          return;
        }

        notes = synthObj.notes;

        notes.forEach(function(noteObj) {
          if (synthObj.recordedMode) {
            scheduleNote(synthObj.id, noteObj);
          }
        });
        loopEnd[key] = synthObj.synth.now();
      }, (loopStart[key] ? ((loopStart[key] + synthObj.totalLoopOffset) - synthObj.synth.now() - 0.05) : 0.05));
    });
  }, shortestOffsetTime());

};

ToneSynth.prototype = new Object();
function ToneSynth(id, synth) {
  this.id = id;
  this.synth = synth;
  this.notes = [];
  this.startTime = synth.now();
  this.nextTime = this.startTime + 0.05;
  this.offSet = 0;
  this.totalLoopOffset = 0;
  this.recordedMode = false;
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
        procs.push(stage.threads.startProcess(block, stage.isThreadSafe, false, createAndPlaySynth()));
    });
    return procs;
};

ToneBlockMorph.prototype.reactToTemplateCopy = function() {
  ToneBlockMorph.uber.reactToTemplateCopy.call(this);
  this.id = '' + (Math.random() * (100 - 0) + 0);
};

Process.prototype.toneSimpleSynth = function (body) {

  if (Tone.Transport.state === 'stopped') {
    console.log('starting transport');
    Tone.Transport.start();
    console.log('transport state ' + Tone.Transport.state);
  } else {
    Tone.Transport.clearIntervals();
    Tone.Transport.clearTimeouts();
  }

  console.log('id of simple synth: ' + this.context.expression.id);
  // create the synth object here and store it in the toneMap

  var existingSynth = toneMap[this.context.expression.id];

  if (!existingSynth) {

    var synth = new Tone.MonoSynth({type: 'sine'});
    synth.toMaster();
    synth.oscillator.sync();

    var toneSynth = new ToneSynth(this.context.expression.id, synth);

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

  scheduleNote(outerId, {note: note, time: time});
  return null;

};
