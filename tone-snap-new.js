var toneArray = [];

var addToToneArray = function(toneObj) {
  toneArray.push(toneObj);
};

var createAndPlaySynth = function() {

  var synth = new Tone.MonoSynth({type: 'sine'});
  synth.toMaster();
  var trigTime = '0.01';

    console.log('going through tone array');
      toneArray.forEach(function(entry) {
        console.log('triggering note');
        synth.triggerAttackRelease(entry.note, entry.time, '+' + trigTime);
        trigTime = trigTime + ' + ' + entry.time;
      });

};

ToneBlockMorph.prototype = new CommandBlockMorph();
ToneBlockMorph.prototype.constructor = ToneBlockMorph;
ToneBlockMorph.uber = CommandBlockMorph.prototype;

function ToneBlockMorph() {
    this.init();
};

ToneBlockMorph.prototype.init = function () {
    ToneBlockMorph.uber.init.call(this);
};

ToneBlockMorph.prototype.isTone = function() {
  return true;
}

ToneBlockMorph.prototype.receiveUserInteraction = function (interaction) {
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

Process.prototype.toneSimpleSynth = function (body) {

    var outer = this.context.outerContext;
    this.popContext();
        if (body) {
            this.pushContext(body.blockSequence(), outer);
        }
    this.pushContext();
};

Process.prototype.toneTest = function(note, time) {
  console.log('in Process.toneTest function');

  addToToneArray({note: note, time: time});
  return null;

};

Process.prototype.tonePlay = function() {

var synth = new Tone.MonoSynth({type: 'sine'});
synth.toMaster();
var trigTime = '0.01';

  console.log('going through tone array');
    toneArray.forEach(function(entry) {
      console.log('triggering note');
      synth.triggerAttackRelease(entry.note, entry.time, '+' + trigTime);
      trigTime = trigTime + ' + ' + entry.time;
    });

}
