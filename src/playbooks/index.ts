import * as raw from './raw/index';
import * as test from './test.json';

import * as boat from './pending/boat.json';

const working = {
  pinwheel: raw.pinwheel,
  catamaran: raw.catamaran,
  miura: raw.miura,
  fishbase: raw.fishbase,
  boat: raw.boat,
  waterbombbase: raw.waterbombbase,

};

// some included to examine
const testing = {
  butterfly: raw.butterfly, // index error
  waterbomb: raw.waterbomb, // creasing good. some render problems (132/140) vs (92/164)
  chair: raw.chair, // creasing good. some render problems (102/240) vs (132/99)
  crown: raw.crown, // creasing good, soome render problems 32/47 vs 28/37
  dragon: raw.dragon, // huuuge and mostly shit 849/1609 vs 194/821 (plus ploygon index error)
  goldfish: raw.goldfish, // index error
  lily: raw.lily, // index error
  ...raw
};

// excluded
const excluded = {
  whale: raw.whale, // cutting.
  airplane: raw.airplane // din a4 (okayish when paper format is changed)
};

export {
  raw,
  working,
  testing,
  test
};

// dina 4
// +airplane
