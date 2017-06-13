import * as raw from './raw/index';
import * as test from './test.json';

import * as boat from './pending/boat.json';

const working = {
  fishbase: raw.fishbase,
  birdbase: raw.birdbase,
  waterbombbase: raw.waterbombbase,
  pinwheel: raw.pinwheel,
  catamaran: raw.catamaran,
  miura: raw.miura,
  boat: raw.boat,
  crown: raw.crown,
  crane: raw.crane,
  mouse: raw.mouse,
  butterfly: raw.butterfly, // index error
  waterbomb: raw.waterbomb,
  frog: raw.frog,
  dragon: raw.dragon,
  pigeon: raw.pigeon,
  fortune: raw.fortune,
  seahorse: raw.seahorse,
  yakko: raw.yakko, //Yakko-san
  pine: raw.pine
};

// some included to examine
const testing = {
  phoenix: raw.phoenix, // So sweet but the tail is wrong?
  rose: raw.rose, // yes nearly! soem flaps are missing
  table: raw.table, // the legs are missing
  chair: raw.chair, // run 37/49 - FOLD_ROTATION  -90 not rotating
  sanbow: raw.sanbow, // Candybox, very off
  helicopter: raw.helicopter, // nearly
  pelican: raw.pelican, // Somehow broken?
  lily: raw.lily, // last rotation not working
  glynn: raw.glynnbox, // Sth. very wrong here. Gift box (Robin Glynn)
  kabuto: raw.kabuto, // Samurai Helmet, nearly
  kazaribox: raw.kazaribox, // Somethign is very wrong.
  leporello: raw.leporello, // Just ignore, not in Java included
  masubox: raw.masubox, // Seems easy, but broken
  ...raw
};

// excluded
const excluded = {
  airplane: raw.airplane, // din a4 (okayish when paper format is changed)
  goldfish: raw.goldfish, // mutilation
  whale: raw.whale // mutilation
};

export {
  working,
  testing
};

// dina 4
// +airplane
