/*
  Extensions to Snap's objects.js
*/

(function() {

  "use strict";

  SpriteMorph.prototype.categories.push('music');

  SpriteMorph.prototype.blockColor['music'] = new Color(212, 98, 255);

  var initMusicBlocks = function() {

    SpriteMorph.prototype.blocks.musicPlay =
    {
      only: SpriteMorph,
      type: 'command',
      category: 'music',
      spec: 'play note %s for time %s',
      defaults: ['c3', '4n']
    };

    SpriteMorph.prototype.blocks.musicRest =
    {
      only: SpriteMorph,
      type: 'command',
      category: 'music',
      spec: 'silence for time %s',
      defaults: ['4n']
    };

    SpriteMorph.prototype.blocks.liveLoop =
    {
      only: SpriteMorph,
      type: 'command',
      category: 'music',
      spec: 'live loop %c'
    };

    SpriteMorph.prototype.blocks.toneSimpleSynth =
    {
      type: 'toneblock',
      category: 'music',
      spec: 'use synth %toneSynths %c'
    };

    SpriteMorph.prototype.blocks.toneSynthProps =
    {
      type: 'toneblock',
      category: 'music',
      spec: 'set synth property %toneSP to %s'
    };

    SpriteMorph.prototype.blocks.toneFx =
    {
      type: 'toneblock',
      category: 'music',
      spec: 'add fx %tonefx for %c'
    };

    SpriteMorph.prototype.blocks.musicSample =
    {
      type: 'command',
      category: 'music',
      spec: 'play sample %toneSamples'
    };

    SpriteMorph.prototype.blocks.musicTempo =
    {
      type: 'command',
      category: 'music',
      spec: 'set tempo to %n bpm',
      defaults: [120]
    }
  };

  initMusicBlocks();

  SpriteMorph.prototype.blockForSelector = (function(oldBlockForSelector) {
    return function(selector, setDefaults) {
      var migration, info, block, defaults, inputs, i;
      migration = this.blockMigrations[selector];
      info = this.blocks[migration ? migration.selector : selector];
      if (!info) {return null; }
      if (info.type === 'toneblock') {
        block = new ToneBlockMorph();

        block.color = this.blockColor[info.category];
        block.category = info.category;
        block.selector = migration ? migration.selector : selector;
        if (contains(['reifyReporter', 'reifyPredicate'], block.selector)) {
            block.isStatic = true;
        }
        block.setSpec(localize(info.spec));
        if ((setDefaults && info.defaults) || (migration && migration.inputs)) {
            defaults = migration ? migration.inputs : info.defaults;
            block.defaults = defaults;
            inputs = block.inputs();
            if (inputs[0] instanceof MultiArgMorph) {
                inputs[0].setContents(defaults);
                inputs[0].defaults = defaults;
            } else {
                for (i = 0; i < defaults.length; i += 1) {
                    if (defaults[i] !== null) {
                        inputs[i].setContents(defaults[i]);
                    }
                }
            }
        }
      } else {
        block = oldBlockForSelector.call(this, selector, setDefaults);
      }

      return block;
    };
  }(SpriteMorph.prototype.blockForSelector));

  SpriteMorph.prototype.blockTemplates = (function(oldBlockTemplates) {
    return function(category) {

      function block(newthis, selector) {
          if (StageMorph.prototype.hiddenPrimitives[selector]) {
              return null;
          }
          var newBlock = SpriteMorph.prototype.blockForSelector.call(newthis, selector, true);
          newBlock.isTemplate = true;
          return newBlock;
      }

      var blocks = oldBlockTemplates.call(this, category);

      if (category === 'music') {
        blocks.push(block(this, 'musicPlay'));
        blocks.push(block(this, 'musicRest'));
        blocks.push(block(this, 'liveLoop'));
        //blocks.push(block(this, 'toneSimpleSynth'));
        //blocks.push(block(this, 'toneSynthProps'));
        //blocks.push(block(this, 'toneFx'));
        blocks.push(block(this, 'musicSample'));
        blocks.push(block(this, 'musicTempo'));
      }

      return blocks;
    };
  }(SpriteMorph.prototype.blockTemplates));

  StageMorph.prototype.fireGreenFlagEvent = (function(oldFireGreenFlagEvent) {
    return function() {
      var procs = oldFireGreenFlagEvent.call(this);

      cleanUpParts();

      var hats = [],
      myself = this,
      hasToneChild = false;

      this.children.concat(this).forEach(function (morph) {
          if (morph instanceof SpriteMorph || morph instanceof StageMorph) {
              hats = hats.concat(morph.allHatBlocksFor('__shout__go__'));
          }
      });

      hats.forEach(function (block) {

        if (block.children.length > 0) {
          hasToneChild = block.children.some(function(child) {
            if (child.selector === 'toneSimpleSynth') {
              return true;
            }
          });
        }

        block.hasToneChild = hasToneChild;

        if (hasToneChild) {
          console.log('green flag event, has tone child, start process');
          procs.push(myself.threads.startProcess(
              block,
              myself.isThreadSafe,
              false,
              createAndPlaySynth
          ));
        }
      });

      return procs;
    };
  }(StageMorph.prototype.fireGreenFlagEvent));

  StageMorph.prototype.fireStopAllEvent = (function(oldFireStopAllEvent) {
    return function() {
      stopTone(); // stopping everything, so we need to call our stopTone() function to clean things up
      oldFireStopAllEvent.call(this);
    };
  }(StageMorph.prototype.fireStopAllEvent));

}());
