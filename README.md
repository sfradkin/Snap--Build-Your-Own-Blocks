
This is a customized version of Snap! in which I am attempting to provide
abstractions for using Tone.js inside of Snap! so that users can create
much more sophisticated sound.

12-22-2015

There is a Tone category of blocks.  Currently there are 4 blocks available:
- A C-block that defines a synth can hold notes
- A note block that allows the user to define a note and length
- A silence block that allows the user to define a period of silence
- A C-block that defines FX that can be applied to everything inside
- Reverb FX available

The app should respond to clicks on a synth/fx block and play the defined notes.
The user is able to create multiple synth/fx blocks with notes and trigger the blocks
by a Green Flag block and they will all play at the same time.

Clicking on a synth/fx c-block will immediately re-evaluate just that block.
Any synth/fx c-blocks that also have green flag hats on them to respond to the
green flag button press will all redefine upon pressing the green flag button.

Things up next to implement:
- Fix adding/removing FX blocks without stopping, currently does not connect/
  disconnect correctly
- Modify re-evaluation of blocks to ensure current loops fully end before
  starting newly evaluated blocks
- Ability to change the type of synth
- Other effects
- Ability to modify aspects of synths
- Chords
- Scales
- Looping over lists of notes
- More of the full Tone functionality

-----------------------------------

Snap! Build Your Own Blocks

http://snap.berkeley.edu

a visual, blocks based programming language
inspired by Scratch

written by Jens Mönig and Brian Harvey
jens@moenig.org, bh@cs.berkeley.edu

Copyright (C) 2015 by Jens Mönig and Brian Harvey

Snap! is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of
the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
