var toneMap = {};
var toneFxMap = {};
var tonePlayerMap = {};
var musicParts = {};
var samples = {};
var toClean = [];

var preloadSamples = function() {
  var aSample = new Tone.Player('tone/samples/bd.wav');
  aSample.toMaster();
  samples['bd'] = aSample;

  aSample = new Tone.Player('tone/samples/sn.wav');
  aSample.toMaster();
  samples['sn'] = aSample;

  aSample = new Tone.Player('tone/samples/ch.wav');
  aSample.toMaster();
  samples['ch'] = aSample;

  aSample = new Tone.Player('tone/samples/oh.wav');
  aSample.toMaster();
  samples['oh'] = aSample;
};

var sweepClean = function() {
  for (var i = 0; i < toClean.length; i ++) {
    var part = musicParts[toClean[i]];
    if (part.tonePart.state === 'stopped') {
      part.tonePart.dispose();
      delete musicParts[toClean[i]];
      toClean.splice(i, 1);
    }
  }
};

Tone.Transport.scheduleRepeat(sweepClean, 5, 0);

var snapMusicBlocks = ['musicPlay', 'musicRest', 'liveLoop'];

preloadSamples();

var cleanUpParts = function() {
  Object.keys(musicParts).every(function(key) {
    var part = musicParts[key];
    if (part.tonePart.state === 'started') {
      part.stop();
      toClean.push(part.id);
    }
  });
};

var findSnapMusicBlock = function(block) {
  if (snapMusicBlocks.some(function(item) {
    return item === block.selector;
  })) {
    return true;
  } else {
    if (block.children && block.children.length > 0) {
      return block.children.some(function(child) {
        return findSnapMusicBlock(child);
      });
    } else {
      return false;
    }
  }
};

var initMusicPart = function() {
  //this.homeContext.expression = generateId();
  var partId = generateId();

  // create a new MusicPart
  var musicPart = new MusicPart(partId);
  addPart(musicPart);

  console.log('initializing Part: ', partId);

  return partId;
};

var musicEnd = function(partId) {
  musicPart = musicParts[partId];
  console.log('starting Part: ', partId);
  musicPart.start(0);
};

var loopEnd = function(partId) {
  musicPart = musicParts[partId];
  musicPart.loopEnd();
};

var loadSample = function(sampleName) {
  var aSample = samples[sampleName];
  if (!aSample) {
    aSample = new Tone.Player('tone/samples/' + sampleName + '.wav');
    aSample.toMaster();
    samples[sampleName] = aSample;
  }

  return aSample;
};

var addPart = function(musicPart) {
  var existingPart = musicParts[musicPart.id];

  if (!existingPart) {
    musicParts[musicPart.id] = musicPart;
  }
};

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

var addPlayerToToneMap = function(tonePlayer) {
  var existingPlayer = tonePlayerMap[tonePlayer.id];

  if (!existingPlayer) {
    tonePlayerMap[tonePlayer.id] = tonePlayer;
  }

};

/* generates a quick somewhat random id */
var generateId = function() {
  return '' + (Math.random() * (100 - 0) + 0);
};

/* callback function that Tone.Part will call to play an event */
var playEvents = function(time, event) {
  /*
  this.type = type;
  this.outputId = outputId;
  this.play = play;
  this.duration = duration;
  */

  if (event.type === 'NOTE') {
    var synth = toneMap[event.outputId];
    synth.synth.triggerAttackRelease(event.play, event.duration);
  } else if (event.type === 'SAMPLE') {
    var aSample = loadSample(event.play);
    aSample.start();
    console.log('attempting to start sample: ', event.play);
  }

};

var generateDefaultSynth = function() {

  var type = 'monosynth';
  var synth = new Tone.MonoSynth({oscillator: {type: 'sine'}});

  synth.toMaster();
  synth.oscillator.sync();

  var toneSynth = new ToneSynth(generateId(), synth);
  toneSynth.type = type;

  addSynthToToneMap(toneSynth);

  return toneSynth;
};

var defaultSynth = generateDefaultSynth();

var isTransportRunning = function() {
  if (Tone.Transport.state === 'stopped') {
    console.log('starting transport');
    Tone.Transport.start();
  }
};

var synthSettings = {
  monosynth: 'set detune to %s %br set oscillator type to %toneOscType',
  fmsynth: 'set modulation index to %s'
};

/* DEPRECATED */
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

/* DEPRECATED */
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

/* WILL NEED TO ADD IN DESTROYING THE PARTS */
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

  console.log('cleaning up players');
  keys = Object.keys(tonePlayerMap);
  keys.forEach(function(key) {
    player = tonePlayerMap[key];
    player.player.dispose();
  });

  console.log('cleaning up music parts');
  keys = Object.keys(musicParts);
  keys.forEach(function(key) {
    musicpart = musicParts[key];
    musicpart.tonePart.dispose();
  });

  toneMap = {};
  toneFxMap = {};
  tonePlayerMap = {};
  musicParts = {};
  Tone.Transport.cancel();
};

/* DEPRECATED */
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

MusicPart.prototype = new Object();
function MusicPart(id) {
  this.id = id;
  this.offset = 0;
  this.tonePart = new Tone.Part(playEvents);

  /* calculate the correct offset for when to invoke this event
     and add to the Tone.Part */
  this.add = function(event) {
    if (event.type === 'NOTE') {
      // this note should be scheduled to start at the end of the duration of
      // the previously scheduled event

      this.tonePart.add(this.offset + 'i', event);

      // recalc the offset
      this.offset += this.tonePart.toTicks(event.duration);


    } else if (event.type === 'REST') {
      // a rest does not trigger any sounds, but it _does_ update the calculated
      // offset so that the next event can be scheduled correctly

      this.tonePart.add(this.offset + 'i', event);

      // recalc the offset
      this.offset += this.tonePart.toTicks(event.duration);

    } else if (event.type === 'SAMPLE') {
      // samples are played through Tone.Player
      // the duration of a sample can be retrieved via Tone.Player.buffer.duration

      this.tonePart.add(this.offset + 'i', event);

      // recalc the offset
      this.offset += this.tonePart.toTicks(event.duration);
    }
  };

  this.start = function(time) {
    isTransportRunning();
    this.tonePart.start(time);
  };

  this.stop = function() {
    this.tonePart.stop(this.offset);
  };

  this.loop = function() {
    this.tonePart.loop = true;
    this.tonePart.loopStart = 0;
  };

  this.loopEnd = function() {
    this.tonePart.loopEnd = this.offset;
  };

};

MusicEvent.prototype = new Object();
function MusicEvent(type, outputId, play, duration) {
  this.type = type;
  this.outputId = outputId;
  this.play = play;
  this.duration = duration;
};

ToneSynth.prototype = new Object();
function ToneSynth(id, synth) {
  this.id = id;
  this.synth = synth;

  /* deprecate begin */
  this.notes = [];
  this.offSet = 0;
  this.transportTimeStart = 0;  // The transport time this synth was started at
  this.curVirtTime = 0;  // The current virtual time of this synth
  this.loopTime = 0;  // The time it takes to make a loop of the notes defined in this synth
  this.offSetTicks = 0;
  this.noteEvents = [];
  /* deprecate end */

  this.type = '';

  var thisSynth = this;

  /* DEPRECATED */
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

/* DECIDE WHETHER OR NOT WE NEED THE CUSTOM TONEBLOCKMORPH
   MIGHT WANT TO KEEP IT AROUND, BUT WE MAY NOT NEED ALL OF
   THE CURRENT FUNCTIONALITY */
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

/* THINK ABOUT REWRITING THIS TO NOT BE A C-BLOCK, CALL IT "USE SYNTH" */
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

Process.prototype.liveLoop = function(body) {

  var musicPart;

  if (this.homeContext.expression) {
    musicPart = musicParts[this.homeContext.expression.curPartId];
  }

  musicPart.loop();

  this.popContext();
      if (body) {
          this.pushContext(body.blockSequence(), this.context.outerContext);
      }
  //this.pushContext();
  this.pushContext('loopEnd');
};

Process.prototype.musicPlay = function(note, duration) {

  // THE OUTER CONTEXT IS USED RIGHT NOW ONLY FOR SYNTH C-BLOCKS OR
  // FX C-BLOCKS SO THAT WE UNDERSTAND THE hierarchy

  // THE HOMECONTEXT.EXPRESSION SHOULD ALWAYS BE POPULATED WITH THE MUSICPART OBJECT
  // FOR THIS SET OF BLOCKS

  var outerId;
  if (this.context.outerContext.expression) {
    outerId = this.context.outerContext.expression.id;
  }

  var musicPart;

  // if outer id is null, then we're not within a synth or fx c-block
  if (!outerId) {

      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }

    // since we didn't have an outer id which indicates either a synth or fx this is within,
    // grab the id of the default synth to use as the synth to sound the note
    outerId = defaultSynth.id;

  } else {
    // there's an outer id which means that this block is within a synth c-block or an fx c-block
    // if we're in a synth c-block, then the outer id should go with the note
    // if we're in an fx c-block, things get more complex
    // solve the fx issue later, but we probably need to clone the default synth and run it through the
    // fx node, then store the synth id somewhere so music play blocks further down the line have the correct
    // synth id

    if (this.context.outerContext.expression.type === 'fx') {
      // don't do anything now
    }


      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }

  }

  var event = new MusicEvent('NOTE', outerId, note, duration);

  musicPart.add(event); // the MusicPart will figure out the correct time to invoke the note event
  console.log('added note event: ', event);
};

Process.prototype.musicRest = function(duration) {

  // THE OUTER CONTEXT IS USED RIGHT NOW ONLY FOR SYNTH C-BLOCKS OR
  // FX C-BLOCKS SO THAT WE UNDERSTAND THE hierarchy

  // THE HOMECONTEXT.EXPRESSION SHOULD ALWAYS BE POPULATED WITH THE MUSICPART OBJECT
  // FOR THIS SET OF BLOCKS

  var outerId;
  if (this.context.outerContext.expression) {
    outerId = this.context.outerContext.expression.id;
  }

  var musicPart;

  // if outer id is null, then we're not within a synth or fx c-block
  if (!outerId) {

      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }
    // since we didn't have an outer id which indicates either a synth or fx this is within,
    // grab the id of the default synth to use as the synth to sound the note
    outerId = defaultSynth.id;

  } else {
    // there's an outer id which means that this block is within a synth c-block or an fx c-block
    // if we're in a synth c-block, then the outer id should go with the note
    // if we're in an fx c-block, things get more complex
    // solve the fx issue later, but we probably need to clone the default synth and run it through the
    // fx node, then store the synth id somewhere so music play blocks further down the line have the correct
    // synth id

    if (this.context.outerContext.expression.type === 'fx') {
      // don't do anything now
    }


      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }


  }

  var event = new MusicEvent('REST', outerId, null, duration);

  musicPart.add(event); // the MusicPart will figure out the correct time to invoke the note event
  console.log('added rest event: ', event);

};


/* DEPRECATED */
Process.prototype.toneNote = function(note, time) {
  var outerId = this.context.outerContext.expression.id;
  console.log('in Process.toneNote function, outerId = ' + outerId);

  scheduleNote(outerId, {note: note, time: time}, true);  // when processing the actual note block we send a boolean true to store for later
  return null;

};

/* DEPRECATED */
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

Process.prototype.musicSample = function(samplename) {

  var aSample = loadSample(samplename);

  var outerId;
  if (this.context.outerContext.expression) {
    outerId = this.context.outerContext.expression.id;
  }

  var musicPart;

  // if outer id is null, then we're not within a synth or fx c-block
  if (!outerId) {

      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }
    // since we didn't have an outer id which indicates either a synth or fx this is within,
    // grab the id of the default synth to use as the synth to sound the note
    outerId = defaultSynth.id;

  } else {
    // there's an outer id which means that this block is within a synth c-block or an fx c-block
    // if we're in a synth c-block, then the outer id should go with the note
    // if we're in an fx c-block, things get more complex
    // solve the fx issue later, but we probably need to clone the default synth and run it through the
    // fx node, then store the synth id somewhere so music play blocks further down the line have the correct
    // synth id

    if (this.context.outerContext.expression.type === 'fx') {
      // don't do anything now
    }


      if (this.homeContext.expression) {
        musicPart = musicParts[this.homeContext.expression.curPartId];
      }


  }

  var event = new MusicEvent('SAMPLE', null, samplename, aSample.buffer.duration);

  musicPart.add(event); // the MusicPart will figure out the correct time to invoke the note event
  console.log('added sample event: ', event);
}
