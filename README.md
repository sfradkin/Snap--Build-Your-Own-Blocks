
This is a customized version of Snap! in which I am attempting to provide
abstractions for using Tone.js inside of Snap! so that users can create
much more sophisticated sound.

11-27-2015

There is a Tone category of blocks.  Currently there are 2 blocks available.  A
C-block that defines a synth can hold notes, and a note block that allows the
user to define a note and length.

The app should respond to clicks on a synth block and play the defined notes.
The user is able to create multiple synth blocks with notes and trigger the blocks
by a Green Flag block and they will all play at the same time.

Working towards being able to redefine blocks in a basic sequence and then
re-evaluate the blocks. This will allow for live coding to occur.

Things up next to implement:
- Fix issues with timing
- Fix issues with re-eval of blocks so that this works as a live coding environment
- Clicking on a block that starts with a green flag block doesn't work
- Add new C-block that implements a Tone reverb effect that can be applied
  around a synth block
- Ability to add periods of rest
- Ability to change the type of synth
- Other effects
- Ability to modify aspects of synths
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
