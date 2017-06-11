import * as raw from './raw/index';
import * as test from './test.json';

import * as boat from './pending/boat.json';
// out of the box
import * as miura from './working/miura.json';
// out of the box
import * as pinwheel from './working/pinwheel.json';
// last reflection with polygon wasn't working. Doing it manuall worked.
import * as catamaran from './working/catamaran.json';

const working = {
  pinwheel, catamaran, miura, ...raw
};

const pending = {
  boat,
  pinwheel
};

export {
  raw,
  working,
  pending,
  test
};
