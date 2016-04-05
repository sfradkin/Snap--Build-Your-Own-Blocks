/*
 * Extensions to Snap's blocks.js
*/

(function() {

  "use strict";

  SyntaxElementMorph.prototype.labelPart = (function(oldLabelPart) {
    return function(spec) {
      var part;
      switch (spec) {
        case '%tonefx':
            part = new InputSlotMorph(
                null,
                false,
                {   reverb : 'reverb',
                    //tremolo : 'tremolo',
                    vibrato : 'vibrato',
                    bitcrusher : 'bitcrusher',
                    distortion : 'distortion',
                    phaser : 'phaser'
                },
                true
            );
            part.setContents('reverb');
            break;
        case '%toneSP':
            part = new ToneInputSlotMorph(
              null,
              false,
              'getSynthProps',
              true
            );
            break;
        case '%toneOscType':
            part = new ToneInputSlotMorph(
              null,
              false,
              'getOscTypes',
              true
            );
            break;
        case '%toneNoiseType':
            part = new ToneInputSlotMorph(
              null,
              false,
              'getNoiseTypes',
              true
            );
            break;
        case '%toneSynths':
          part = new InputSlotMorph(
              null,
              false,
              {   monosynth : 'monosynth',
                  fmsynth: 'fmsynth'
              },
              true
          );
          part.setContents('monosynth');
          break;
        case '%toneSamples':
          part = new InputSlotMorph(
              null,
              false,
              {   'bass drum' : 'bd',
                  'snare' : 'sn',
                  'closed hi hat' : 'ch',
                  'open hi hat' : 'oh'
              },
              true
          );
          part.setContents('bd');
          break;
        default:
          part = oldLabelPart.call(this, spec);
      }
      return part;
    };
  }(SyntaxElementMorph.prototype.labelPart));

}());
