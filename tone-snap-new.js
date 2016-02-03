var toneMap = {};
var toneFxMap = {};

var addSynthToToneMap = function(toneSynth) {
  var existingSynth = toneMap[toneSynth.id];

  if (!existingSynth) {
    toneMap[toneSynth.id] = toneSynth;
  }

};

var addFxToToneMap = function(toneFx) {
  var existingFx = toneFxMap[toneFx.id];

  if (!existingFx) {
    toneFxMap[toneFx.id] = toneFx;
  }

};

var synthSettings = {
  monosynth: 'set detune to %s %br set oscillator type to %toneOscType',
  fmsynth: 'set modulation index to %s'
};

var scheduleNote = function(id, noteObj, store) {
  var existingSynth = toneMap[id];

  if (existingSynth) {
    // convert note length into seconds
    noteObj.seconds = Tone.Transport.toSeconds(noteObj.time);

    console.log('scheduling note: ', noteObj.note, ' for length: ', noteObj.time, ' which is: ', noteObj.seconds, 's and at virtual time: ', existingSynth.curVirtTime);
    console.log('schedule note at transport tick: ', (existingSynth.transportTimeStart + existingSynth.offSetTicks));


    var noteEventId = Tone.Transport.scheduleOnce(function(time) {
      console.log('event id: ', noteEventId, ' playing note: ', noteObj.note, ' for length: ', noteObj.time, ' at transport tick time: ', Tone.Transport.ticks);
      if (noteObj.note !== 'sleep') {
        existingSynth.synth.triggerAttackRelease(noteObj.note, noteObj.time);
      }
      var eventIdx = existingSynth.noteEvents.indexOf(noteEventId);
      existingSynth.noteEvents.slice(eventIdx, 1);
    }, (existingSynth.transportTimeStart + existingSynth.offSetTicks) + 'i');

    existingSynth.noteEvents.push(noteEventId);

    // update the virtual time of the synth
    existingSynth.curVirtTime = existingSynth.curVirtTime + noteObj.seconds;

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

  // kick off "recorded mode playback"
  var keys = Object.keys(toneMap);

  keys.forEach(function(key) {
    synthObj = toneMap[key];
    if (!synthObj.scheduled) {
      synthObj.totalLoopOffset = synthObj.offSet;
    }
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

  console.log('cleaning up fx nodes');
  keys = Object.keys(toneFxMap);
  keys.forEach(function(key) {
    fxNode = toneFxMap[key];
    fxNode.fxNode.dispose();
  });

  toneMap = {};
  toneFxMap = {};
  Tone.Transport.cancel();
};

var doToneRecordedMode = function() {
  var synthObj, notes;

  var keys = Object.keys(toneMap);

    keys.forEach(function(key) {

      synthObj = toneMap[key];
      if (synthObj.scheduled) {
        console.log('synth: ', synthObj.id, ' already scheduled');
      } else {
        console.log('time now: ', Tone.Transport.now(), ', schedule periodic callback 1 for synth id: ', synthObj.id, ' every ', (synthObj.loopTime - 0.05));
        synthObj.scheduled = Tone.Transport.scheduleRepeat(synthObj.synthScheduleCallback, (synthObj.loopTime - 0.05));
      }
    });
};

ToneSynth.prototype = new Object();
function ToneSynth(id, synth) {
  this.id = id;
  this.synth = synth;
  this.notes = [];
  this.offSet = 0;
  this.transportTimeStart = 0;  // The transport time this synth was started at
  this.curVirtTime = 0;  // The current virtual time of this synth
  this.loopTime = 0;  // The time it takes to make a loop of the notes defined in this synth
  this.offSetTicks = 0;
  this.noteEvents = [];

  var thisSynth = this;

  this.synthScheduleCallback = function(time) {

    console.log('--------- synthScheduleCallback fired at ', Tone.Transport.now());

    console.log('scheduling notes for synth: ', thisSynth.id);
    thisSynth.notes.forEach(function(noteObj) {
        scheduleNote(thisSynth.id, noteObj, false);
    });
  };
};

ToneFx.prototype = new Object();
function ToneFx(id, fxNode, fxType) {
  this.id = id;
  this.fxNode = fxNode;
  this.fxType = fxType;
};

ToneBlockMorph.prototype = new CommandBlockMorph();
ToneBlockMorph.prototype.constructor = ToneBlockMorph;
ToneBlockMorph.uber = CommandBlockMorph.prototype;

function ToneBlockMorph() {
    this.init();
    this.synthType = '';
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

ToneBlockMorph.prototype.snap = function() {
  ToneBlockMorph.uber.snap.call(this);

  if (this.selector === 'toneSynthProps') {
    console.log('parent synth block type is: ', this.parent.parent.children[2].children[0].text);
    this.setSpec(synthSettings[this.parent.parent.children[2].children[0].text]);
  }
};

ToneInputSlotMorph.prototype = new InputSlotMorph();
ToneInputSlotMorph.prototype.constructor = ToneInputSlotMorph;
ToneInputSlotMorph.uber = InputSlotMorph.prototype;

function ToneInputSlotMorph(text, isNumeric, choiceDict, isReadOnly) {
    this.init(text, isNumeric, choiceDict, isReadOnly);
};

ToneInputSlotMorph.prototype.init = function(text, isNumeric, choiceDict, isReadOnly) {
    ToneInputSlotMorph.uber.init.call(this, text, isNumeric, choiceDict, isReadOnly);
};

ToneInputSlotMorph.prototype.getSynthProps = function() {
  // this should check the synth type and return a dynamic dictionary based
  // on the type, but right now we only have SimpleSynth

  return {
          'oscillatorType': 'oscillatorType',
          'detune': 'detune'
         };
};

ToneInputSlotMorph.prototype.getOscTypes = function() {
  //  square, triangle, sawtooth, pulse or pwm

  return {
          'sine': 'sine',
          'square': 'square',
          'triangle': 'triangle',
          'sawtooth': 'sawtooth',
          'pulse': 'pulse',
          'pwm': 'pwm'
         };
};

ToneInputSlotMorph.prototype.getNoiseTypes = function() {
  return {
    'white': 'white',
    'brown': 'brown',
    'pink': 'pink'
  };
};

Process.prototype.toneFx = function(fxType, body) {
  console.log('id of fx node: ', this.context.expression.id);
  console.log('fxType: ', fxType, ' body: ', body);

  var existingFxNode = toneFxMap[this.context.expression.id];
  var toneFxNode;
  var toneNode;

  if (!existingFxNode) {
    if (fxType === 'reverb') {
      console.log('creating new Reverb node');
      toneNode = new Tone.Freeverb();
    } else if (fxType === 'tremolo') {
      console.log('creating new Tremolo node');
      toneNode = new Tone.Tremolo();
      // tremolo requires the LFO of the Tremolo to be started
      // until I figure out the best way to do this, tremolo will be disabled
    } else if (fxType === 'vibrato') {
      console.log('creating new Vibrato node');
      toneNode = new Tone.Vibrato();
    } else if (fxType === 'bitcrusher') {
      console.log('creating new bitcrusher node');
      toneNode = new Tone.BitCrusher();
    } else if (fxType === 'distortion') {
      console.log('creating new distortion node');
      toneNode = new Tone.Distortion();
    } else if (fxType === 'phaser') {
      console.log('creating new phaser node');
      toneNode = new Tone.Phaser();
    }

    toneFxNode = new ToneFx(this.context.expression.id, toneNode, fxType);
    addFxToToneMap(toneFxNode);

    console.log('current fx map: ', toneFxMap);

    existingFxNode = toneFxNode;
  }

  var outer = this.context.outerContext;
  outer.expression = {id: this.context.expression.id, type: 'fx'};
  this.popContext();
  if (body) {
      this.pushContext(body.blockSequence(), outer);
  }
  this.pushContext();

};

Process.prototype.toneSimpleSynth = function(type, body) {

  console.log('id of simple synth: ', this.context.expression.id);

  console.log('outer context: ', this.context.outerContext.expression);

  this.synthType = type;

  var outerContextObj = this.context.outerContext.expression;

  // create the synth object here and store it in the toneMap

  var existingSynth = toneMap[this.context.expression.id];

  if (!existingSynth) {

    var synth;

    if (type === 'monosynth') {
      synth = new Tone.MonoSynth({oscillator: {type: 'sine'}});
    } else if (type === 'fmsynth') {
      synth = new Tone.FMSynth();
    } else {
      console.log('unknown synth type: ', type);
    }

    if (outerContextObj) {
      if (outerContextObj.type === 'fx') {
        var fxNode = toneFxMap[outerContextObj.id];
        console.log('found fx node: ', fxNode);
        fxNode.fxNode.toMaster();
        synth.connect(fxNode.fxNode);
      }
    } else {
      synth.toMaster();
    }

    if (type === 'monosynth') {
      synth.oscillator.sync();
    } else if (type === 'fmsynth') {
      synth.carrier.oscillator.sync();
      synth.modulator.oscillator.sync();
    }

    var toneSynth = new ToneSynth(this.context.expression.id, synth);
    toneSynth.transportTimeStart = Tone.Transport.ticks;
    toneSynth.curVirtTime = 0;

    addSynthToToneMap(toneSynth);
    existingSynth = toneSynth;
  } else {
    // if the synth currently exists, we need to clear out events from the timeline
    Tone.Transport.clear(existingSynth.scheduled);
    existingSynth.noteEvents.forEach(function(noteEventId) {
      Tone.Transport.clear(noteEventId);
    });
    existingSynth.noteEvents = [];

    existingSynth.transportTimeStart = Tone.Transport.ticks;
    existingSynth.curVirtTime = 0;
    existingSynth.notes = [];
    existingSynth.offSet = 0;
    existingSynth.loopTime = 0;
    existingSynth.offSetTicks = 0;
    existingSynth.scheduled = undefined;
  }

  var outer = this.context.outerContext;
  outer.expression = {id: this.context.expression.id, type: 'synth'};
  this.popContext();
      if (body) {
          this.pushContext(body.blockSequence(), outer);
      }
  this.pushContext();

};

Process.prototype.toneNote = function(note, time) {
  var outerId = this.context.outerContext.expression.id;
  console.log('in Process.toneNote function, outerId = ' + outerId);

  scheduleNote(outerId, {note: note, time: time}, true);  // when processing the actual note block we send a boolean true to store for later
  return null;

};

Process.prototype.toneSleep = function(time) {
  var outerId = this.context.outerContext.expression.id;
  console.log('in Process.toneSleep function, outerId = ' + outerId);

  scheduleNote(outerId, {note: 'sleep', time: time}, true);  // when processing the actual note block we send a boolean true to store for later
  return null;

};

Process.prototype.toneSynthProps = function(propType, propValue) {
  if (this.context.outerContext.expression.type === 'synth') {
    var curSynthId = this.context.outerContext.expression.id;
    var existingSynth = toneMap[curSynthId];
    if (existingSynth) {
      if (propType === 'oscillatorType') {
        existingSynth.synth.oscillator.type = propValue;
      } else if (propType === 'detune') {
        existingSynth.synth.detune.value = propValue;
      }
    }
  }
}
