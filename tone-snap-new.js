var toneMap = {};

var addSynthToToneMap = function(toneSynth) {
  var existingSynth = toneMap[toneSynth.id];

  if (!existingSynth) {
    toneMap[toneSynth.id] = toneSynth;
  } else {
    // reset notes array
    existingSynth.clearNotes();
  }
};

var addNoteToToneMap = function(id, noteObj) {
  var existingSynth = toneMap[id];

  if (existingSynth) {
    existingSynth.addNote(noteObj);
  }
};

var createAndPlaySynth = function() {

  var keys = Object.keys(toneMap);

  // each key is a synth with notes that we need to play
  // for now, let's just get a single synth to work, so
  // just use the first key

  var aSynthObj = toneMap[keys[0]];
  var synth = aSynthObj.synth;
  var notes = aSynthObj.notes;

  var trigTime = '0.01';

  console.log('going through notes array for synth obj: ' + aSynthObj.id);
  notes.forEach(function(entry) {
    console.log('triggering note');
    synth.triggerAttackRelease(entry.note, entry.time, '+' + trigTime);
    trigTime = trigTime + ' + ' + entry.time;
  });

};

ToneSynth.prototype = new Object();
function ToneSynth(id, synth) {
  this.id = id;
  this.synth = synth;
  this.notes = [];
};

ToneSynth.prototype.addNote = function(noteobj) {
  this.notes.push(noteobj);
};

ToneSynth.prototype.clearNotes = function() {
  this.notes = [];
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
  console.log('id of simple synth: ' + this.context.expression.id);
  // create the synth object here and store it in the toneMap

  var synth = new Tone.MonoSynth({type: 'sine'});
  synth.toMaster();

  var toneSynth = new ToneSynth(this.context.expression.id, synth);

  addSynthToToneMap(toneSynth);

  var outer = this.context.outerContext;
  outer.expression = this.context.expression.id;
  this.popContext();
      if (body) {
          this.pushContext(body.blockSequence(), outer);
      }
  this.pushContext();
};

Process.prototype.toneTest = function(note, time) {
  var outerId = this.context.outerContext.expression;
  console.log('in Process.toneTest function, outerId = ' + outerId);

  addNoteToToneMap(outerId, {note: note, time: time});
  return null;

};
