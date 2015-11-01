var toneArray = [];

var addToToneArray = function(toneObj) {
  toneArray.push(toneObj);
};

Process.prototype.toneTest = function(note, time) {
  console.log('in Process.toneTest function');
  var osc;
  if (!osc) {
   osc = new Tone.Oscillator('c3');
  }

  var env;
  if (!env) {
    env  = new Tone.AmplitudeEnvelope();
  }

  osc.connect(env);
  env.toMaster();

  if (osc.state === 'stopped') {
    osc.start();
  }

  console.log('volume: ' + osc.volume.value);
  osc.volume.value = 12;
  osc.frequency.value = note;
  env.triggerAttackRelease(time);

  // osc.stop();
  // env.dispose();
  // osc.dispose();
};

Process.prototype.toneRest = function(time) {
  console.log('in Process.toneRest function');
  var osc;
  if (!osc) {
   osc = new Tone.Oscillator('c3');
  }

  var env;
  if (!env) {
    env  = new Tone.AmplitudeEnvelope();
  }

  osc.connect(env);
  env.toMaster();

  if (osc.state === 'stopped') {
    osc.start();
  }

  osc.volume.value = 0;
  env.triggerAttackRelease(time);
}
