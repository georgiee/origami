import * as crane from './crane.json';
import * as birdbase from './bird.json';
import * as butterfly from './butterfly.json';
import * as start from './star.json';
import * as seahorse from './seahorse.json';
import * as crown from './crown.json'; // good
import * as fortune from './fortune.json';
import * as tree from './tree.json';
import * as test from './test.json';
import * as boat from './pending/boat.json';

// out of the box
import * as miura from './working/miura.json';
// out of the box
import * as pinwheel from './working/pinwheel.json';
// last reflection with polygon wasn't working. Doing it manuall worked.
import * as catamaran from './working/catamaran.json';

const working = {
  pinwheel, catamaran, miura
};

const pending = {
  boat
};

export {
  working,
  crane,
  birdbase,
  butterfly,
  start,
  seahorse,
  fortune,
  tree,
  test,
  pinwheel
};
