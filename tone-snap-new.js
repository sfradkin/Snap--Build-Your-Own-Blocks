var toneArray = [];

var addToToneArray = function(toneObj) {
  toneArray.push(toneObj);
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
