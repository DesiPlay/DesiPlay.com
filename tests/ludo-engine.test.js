'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Ludo = require('../assets/ludo-engine.js');

test('creates the correct local player sets', function () {
  assert.deepEqual(Ludo.createGame(2).players.map(function (p) { return p.color; }), ['red', 'yellow']);
  assert.deepEqual(Ludo.createGame(3).players.map(function (p) { return p.color; }), ['red', 'blue', 'yellow']);
  assert.deepEqual(Ludo.createGame(4).players.map(function (p) { return p.color; }), ['red', 'blue', 'yellow', 'green']);
});

test('a token leaves the yard only on a six and a six grants another roll', function () {
  let state = Ludo.createGame(2);
  state = Ludo.roll(state, 5);
  assert.equal(state.dice, null);
  assert.equal(state.turn, 1);

  state = Ludo.createGame(2);
  state = Ludo.roll(state, 6);
  assert.deepEqual(Ludo.legalMoves(state), [0, 1, 2, 3]);
  state = Ludo.moveToken(state, 0);
  assert.equal(state.players[0].tokens[0], 0);
  assert.equal(state.turn, 0);
  assert.equal(state.dice, null);
});

test('a third consecutive six is ignored and ends the turn', function () {
  let state = Ludo.createGame(2);
  state = Ludo.roll(state, 6);
  state = Ludo.moveToken(state, 0);
  state = Ludo.roll(state, 6);
  state = Ludo.moveToken(state, 1);
  assert.equal(state.sixesInRow, 2);
  const before = state.players[0].tokens.slice();

  state = Ludo.roll(state, 6);
  assert.equal(state.turn, 1);
  assert.equal(state.dice, null);
  assert.equal(state.sixesInRow, 0);
  assert.deepEqual(state.players[0].tokens, before);
  assert.match(state.message, /Third consecutive six/);
});

test('captures a single opponent on a non-safe square and awards an extra roll', function () {
  let state = Ludo.createGame(4);
  state.players[0].tokens[0] = 9;
  state.players[1].tokens[0] = 49; // Both tokens map to global track square 10.
  state = Ludo.roll(state, 1);
  assert.deepEqual(Ludo.legalMoves(state), [0]);
  state = Ludo.moveToken(state, 0);

  assert.equal(state.players[0].tokens[0], 10);
  assert.equal(state.players[1].tokens[0], -1);
  assert.equal(state.turn, 0);
  assert.match(state.message, /captured 1 opponent token/);
});

test('does not capture an opponent on a safe square', function () {
  let state = Ludo.createGame(4);
  state.players[0].tokens[0] = 7;
  state.players[1].tokens[0] = 47; // Both map to safe square 8.
  state = Ludo.roll(state, 1);
  state = Ludo.moveToken(state, 0);

  assert.equal(state.players[0].tokens[0], 8);
  assert.equal(state.players[1].tokens[0], 47);
});

test('a blockade prevents tokens from passing through it', function () {
  let state = Ludo.createGame(4);
  state.players[0].tokens[0] = 5;
  state.players[1].tokens[0] = 46;
  state.players[1].tokens[1] = 46; // Blue blockade on global square 7.
  state = Ludo.roll(state, 3);

  assert.equal(state.dice, null);
  assert.equal(state.turn, 1);
  assert.match(state.message, /No legal move/);
});

test('a token cannot land on an opponent blockade', function () {
  let state = Ludo.createGame(4);
  state.players[0].tokens[0] = 6;
  state.players[1].tokens[0] = 46;
  state.players[1].tokens[1] = 46;
  state = Ludo.roll(state, 1);

  assert.equal(state.dice, null);
  assert.equal(state.turn, 1);
});

test('requires an exact roll to enter home and awards an extra roll on arrival', function () {
  let state = Ludo.createGame(2);
  state.players[0].tokens[0] = 56;
  state = Ludo.roll(state, 2);
  assert.equal(state.dice, null);
  assert.equal(state.turn, 1);

  state.turn = 0;
  state = Ludo.roll(state, 1);
  assert.deepEqual(Ludo.legalMoves(state), [0]);
  state = Ludo.moveToken(state, 0);
  assert.equal(state.players[0].tokens[0], 57);
  assert.equal(state.turn, 0);
  assert.match(state.message, /Extra roll/);
});

test('declares a winner when all four tokens reach home', function () {
  let state = Ludo.createGame(2);
  state.players[0].tokens = [57, 57, 57, 56];
  state = Ludo.roll(state, 1);
  state = Ludo.moveToken(state, 3);

  assert.equal(state.status, 'won');
  assert.equal(state.winner, 'red');
  assert.equal(state.players[0].tokens.every(function (progress) { return progress === 57; }), true);
});

test('validates saved match state and rejects invalid token positions', function () {
  const state = Ludo.createGame(3);
  assert.equal(Ludo.validateState(state), true);
  state.players[0].tokens[0] = 58;
  assert.equal(Ludo.validateState(state), false);
});
