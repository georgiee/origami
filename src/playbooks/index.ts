import * as raw from './raw/index';
import * as test from './test.json';

import * as boat from './pending/boat.json';

const working = {
  squarebase: raw.squarebase,
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
  yakko: raw.yakko, // Yakko-san
  pine: raw.pine,
  rose: raw.rose, // yes fixed with using raw plane data
  table: raw.table, // yes fixed with using raw plane data
  chair: raw.chair, // yes fixed with using raw plane data
  helicopter: raw.helicopter,
  pelican: raw.pelican,
  sanbow: raw.sanbow,
  glynnbox: raw.glynnbox,
  kabuto: raw.kabuto, // Samurai Helmet, nearly
  kazaribox: raw.kazaribox, // Somethign is very wrong.
  masubox: raw.masubox, // Seems easy, but broken
  owl: raw.owl
};

// some included to examine
const testing = {
  phoenix: raw.phoenix, // So sweet but the tail is wrong?
  omegastar: raw.omegastar,
  lily: raw.lily, // last rotation not working
  ...raw
};

// excluded
const excluded = {
  airplane: raw.airplane, // din a4 (okayish when paper format is changed)
  goldfish: raw.goldfish, // mutilation
  whale: raw.whale, // mutilation
  leporello: raw.leporello // People chain, many cuts, not square
};

export {
  working,
  testing
};

// dina 4
// +airplane
