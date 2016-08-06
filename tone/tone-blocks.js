/*
 * Extensions to Snap's blocks.js
*/

(function() {

  "use strict";

  // var darrowCvsReady = false;
  //
  // var downArrowImg = new Image();
  // downArrowImg.src = 'tone/img/down-arrow.png';
  // //var darrowurl = 'tone/img/down-arrow.png';
  // var darrowCvs;

  // downArrowImg.onload = function () {
  //     darrowCvs = newCanvas(new Point(downArrowImg.width, downArrowImg.height), true);
  //     darrowCvs.getContext('2d').drawImage(downArrowImg, 0, 0);
  //     //target.droppedImage(canvas, aFile.name);
  //     darrowCvsReady = true;
  // };

  ImageMorph.prototype = new BoxMorph();
  ImageMorph.prototype.constructor = ImageMorph;
  ImageMorph.uber = BoxMorph.prototype;

  function ImageMorph(imagekey, sizex, sizey) {
      this.init(imagekey);
  };

  ImageMorph.prototype.init = function(imagekey, sizex, sizey) {

    this.imgBundle = imageCache[imagekey];
    this.cvs = null;
    this.sizex = sizex;
    this.sizey = sizey;

  };

  ImageMorph.prototype.drawNew = function() {

    if (this.imgBundle.isLoaded) {
      console.log('img now loaded');

      //ImageMorph.uber.drawNew.call(this);
      this.image = newCanvas(this.extent());
      this.image.getContext('2d').drawImage(this.imgBundle.img, 0, 0, this.sizex || 40 , this.sizey || 40);
    } else {
      console.log('img is not loaded yet, not drawing');
    }

  };

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
        case '%tempoSlider':
          // console.log('hmm');
          // var input;
          // var val;
          // this.children.some(function(child) {
          //   console.log(child.constructor.name);
          //   if (child.constructor.name === 'InputSlotMorph') {
          //     input = child;
          //     return true;
          //   } // [object InputSlotMorph])
          // });
          // if (input) {
          //   val = input.defaultContents || 60;
          //   console.log(val);
          // }
          ////// **** blocks.js 6868 ****** also see SyntaxElementMorph
          /// create a new block morph that extends toneblock to encapsulate
          /// all of the icons and the slider for tempo block
          // this block must override inputs() in order to expose the Slider
          // as an input
          // also create a new morph to extend the slider morph but add the
          // evaluate() function so that the framework can get the current value
          // of the slider
          // this _should_ allow for using the slider directly and not have to try and
          // create a hidden text input field of some sort so that the process can
          // pass the slider value to the process.musicTempo function that runs when
          // the tempo block is evaluated by snap
          // this will also let us modify how the tempo block looks since we don't want
          // it to be able to connect to anything
          part = new SliderMorph(1, 256, 60, 50, 'horizontal'); // look up 'useSliderForInput' in morpic.js
          //part.linkedInput = input;
          part.alpha = 1;
          part.color = new Color(225, 225, 225);
          part.button.color = new Color(225, 225, 225); //menu.borderColor;
          part.button.highlightColor = part.button.color.copy();
          part.button.highlightColor.b += 100;
          part.button.pressColor = part.button.color.copy();
          part.button.pressColor.b += 150;
          part.silentSetHeight(MorphicPreferences.scrollBarSize);
          part.silentSetWidth(MorphicPreferences.menuFontSize * 10);
          part.drawNew();
          // part.action = function (num) {
          //     input.changed();
          //     //aStringOrTextMorph.text = Math.round(num).toString();
          //     input.setContents(num);
          //     //input.children[0].drawNew();
          //     input.changed();
          //     input.escalateEvent(
          //         'reactToSliderEdit',
          //         input
          //     );
          // };

          break;
        case '%turtleicon':
          part = new ImageMorph('turtle');
          console.log('calling drawNew');
          part.drawNew();
          console.log('done calling drawNew');

          break;
        case '%rabbiticon':
          part = new ImageMorph('rabbit');
          console.log('calling drawNew');
          part.drawNew();
          console.log('done calling drawNew');
          break;
        case '%metronomeicon':
          part = new ImageMorph('metronome', 25, 25);
          console.log('calling drawNew');
          part.drawNew();
          console.log('done calling drawNew');
          break;
        default:
          part = oldLabelPart.call(this, spec);
      }
      return part;
    };
  }(SyntaxElementMorph.prototype.labelPart));

}());
