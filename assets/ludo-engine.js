(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DesiplayLudoEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 2;
  const COLORS = ['red', 'blue', 'yellow', 'green'];
  const START_INDEX = { red: 0, blue: 13, yellow: 26, green: 39 };
  const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  const PLAYER_SETS = {
    2: ['red', 'yellow'],
    3: ['red', 'blue', 'yellow'],
    4: ['red', 'blue', 'yellow', 'green']
  };

  function copyState(state) {
    return {
      version: state.version,
      playerCount: state.playerCount,
      players: state.players.map(function (player) {
        return { color: player.color, tokens: player.tokens.slice() };
      }),
      turn: state.turn,
      dice: state.dice,
      lastRoll: state.lastRoll,
      sixesInRow: state.sixesInRow,
      status: state.status,
      winner: state.winner,
      message: state.message
    };
  }

  function createGame(playerCount) {
    const count = Number(playerCount || 4);
    if (!PLAYER_SETS[count]) throw new RangeError('Choose 2, 3 or 4 players.');
    const players = PLAYER_SETS[count].map(function (color) {
      return { color: color, tokens: [-1, -1, -1, -1] };
    });
    return {
      version: VERSION,
      playerCount: count,
      players: players,
      turn: 0,
      dice: null,
      lastRoll: null,
      sixesInRow: 0,
      status: 'playing',
      winner: null,
      message: title(players[0].color) + ' starts. Roll the dice.'
    };
  }

  function title(color) {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }

  function currentPlayer(state) {
    return state.players[state.turn];
  }

  function globalPosition(color, progress) {
    if (progress < 0 || progress > 52) return null;
    return (START_INDEX[color] + progress) % 52;
  }

  function positionCounts(state, position) {
    const counts = Object.create(null);
    state.players.forEach(function (player) {
      let count = 0;
      player.tokens.forEach(function (progress) {
        if (progress >= 0 && progress <= 52 && globalPosition(player.color, progress) === position) count += 1;
      });
      if (count) counts[player.color] = count;
    });
    return counts;
  }

  function blockadeAt(state, position) {
    const counts = positionCounts(state, position);
    for (const color of Object.keys(counts)) {
      if (counts[color] >= 2) return color;
    }
    return null;
  }

  function canLandOnTrack(state, color, position) {
    if (blockadeAt(state, position)) return false;
    const counts = positionCounts(state, position);
    return (counts[color] || 0) < 2;
  }

  function canMoveToken(state, player, tokenIndex) {
    const progress = player.tokens[tokenIndex];
    const dice = state.dice;
    if (!Number.isInteger(dice) || progress === 59 || progress < -1 || progress > 59) return false;

    if (progress === -1) {
      if (dice !== 6) return false;
      return canLandOnTrack(state, player.color, globalPosition(player.color, 0));
    }

    const target = progress + dice;
    if (target > 59) return false;

    if (progress >= 53) return true;

    if (target <= 52) {
      for (let step = 1; step <= dice; step += 1) {
        const position = globalPosition(player.color, progress + step);
        const blockade = blockadeAt(state, position);
        if (step < dice && blockade) return false;
        if (step === dice && blockade) return false;
      }
      return canLandOnTrack(state, player.color, globalPosition(player.color, target));
    }

    // A token entering its home lane still has to pass every remaining track square.
    for (let step = 1; step <= 52 - progress; step += 1) {
      if (blockadeAt(state, globalPosition(player.color, progress + step))) return false;
    }
    return true;
  }

  function legalMoves(state) {
    if (!state || state.status !== 'playing' || !Number.isInteger(state.dice)) return [];
    const player = currentPlayer(state);
    const moves = [];
    player.tokens.forEach(function (_progress, index) {
      if (canMoveToken(state, player, index)) moves.push(index);
    });
    return moves;
  }

  function roll(state, value) {
    if (!state || state.status !== 'playing') throw new Error('This game is not in progress.');
    if (state.dice !== null) throw new Error('Move a highlighted token before rolling again.');
    if (!Number.isInteger(value) || value < 1 || value > 6) throw new RangeError('Dice value must be from 1 to 6.');

    const next = copyState(state);
    const player = currentPlayer(next);
    next.lastRoll = value;

    if (value === 6) {
      if (next.sixesInRow >= 2) {
        next.sixesInRow = 0;
        next.turn = (next.turn + 1) % next.players.length;
        next.message = 'Third consecutive six for ' + title(player.color) + '. The third roll is ignored and the turn passes.';
        return next;
      }
      next.sixesInRow += 1;
    } else {
      next.sixesInRow = 0;
    }

    next.dice = value;
    const moves = legalMoves(next);
    if (!moves.length) {
      next.dice = null;
      if (value === 6) {
        next.message = title(player.color) + ' rolled a six, but no token can move. Roll again.';
      } else {
        next.turn = (next.turn + 1) % next.players.length;
        next.message = title(player.color) + ' rolled ' + value + '. No legal move; the turn passes.';
      }
      return next;
    }

    next.message = title(player.color) + ' rolled ' + value + '. Select one of the highlighted tokens.';
    return next;
  }

  function moveToken(state, tokenIndex) {
    if (!state || state.status !== 'playing') throw new Error('This game is not in progress.');
    if (!Number.isInteger(tokenIndex) || tokenIndex < 0 || tokenIndex > 3) throw new RangeError('Choose a token from 1 to 4.');
    const moves = legalMoves(state);
    if (moves.indexOf(tokenIndex) === -1) throw new Error('That token cannot make this move.');

    const next = copyState(state);
    const player = currentPlayer(next);
    const rollValue = next.dice;
    const previous = player.tokens[tokenIndex];
    const destination = previous === -1 ? 0 : previous + rollValue;
    player.tokens[tokenIndex] = destination;

    let captured = 0;
    if (destination >= 0 && destination <= 52) {
      const position = globalPosition(player.color, destination);
      if (!SAFE_SQUARES.has(position)) {
        next.players.forEach(function (opponent) {
          if (opponent.color === player.color) return;
          opponent.tokens = opponent.tokens.map(function (progress) {
            if (progress >= 0 && progress <= 52 && globalPosition(opponent.color, progress) === position) {
              captured += 1;
              return -1;
            }
            return progress;
          });
        });
      }
    }

    const reachedHome = destination === 59;
    next.dice = null;

    if (player.tokens.every(function (progress) { return progress === 59; })) {
      next.status = 'won';
      next.winner = player.color;
      next.message = '🏆 ' + title(player.color) + ' wins! All four tokens are home.';
      return next;
    }

    const bonusRoll = rollValue === 6 || captured > 0 || reachedHome;
    if (bonusRoll) {
      const reasons = [];
      if (rollValue === 6) reasons.push('a six');
      if (captured > 0) reasons.push('a capture');
      if (reachedHome) reasons.push('a token reaching home');
      next.message = title(player.color) + ' moved token ' + (tokenIndex + 1) +
        (captured ? ' and captured ' + captured + ' opponent token' + (captured === 1 ? '' : 's') : '') +
        (reachedHome ? ' into home' : '') + '. Extra roll for ' + reasons.join(' and ') + '.';
    } else {
      next.turn = (next.turn + 1) % next.players.length;
      next.message = title(player.color) + ' moved token ' + (tokenIndex + 1) +
        '. ' + title(currentPlayer(next).color) + ' is next.';
    }
    return next;
  }

  function validateState(state) {
    if (!state || typeof state !== 'object' || state.version !== VERSION) return false;
    if (!PLAYER_SETS[state.playerCount] || !Array.isArray(state.players)) return false;
    if (state.players.length !== state.playerCount || !Number.isInteger(state.turn) ||
        state.turn < 0 || state.turn >= state.players.length) return false;
    if (state.dice !== null && (!Number.isInteger(state.dice) || state.dice < 1 || state.dice > 6)) return false;
    if (state.lastRoll !== null && (!Number.isInteger(state.lastRoll) || state.lastRoll < 1 || state.lastRoll > 6)) return false;
    if (!Number.isInteger(state.sixesInRow) || state.sixesInRow < 0 || state.sixesInRow > 2) return false;
    if (state.status !== 'playing' && state.status !== 'won') return false;
    if (state.sixesInRow > 0 && state.lastRoll !== 6) return false;
    if (state.dice !== null && state.lastRoll !== state.dice) return false;
    if (state.status === 'won') {
      const winner = state.players[state.turn];
      if (!winner || winner.color !== state.winner || !Array.isArray(winner.tokens) ||
          state.dice !== null || !winner.tokens.every(function (progress) { return progress === 58; })) return false;
    } else {
      if (state.winner !== null) return false;
      if (state.players.some(function (player) {
        return Array.isArray(player && player.tokens) && player.tokens.every(function (progress) { return progress === 59; });
      })) return false;
    }
    const expected = PLAYER_SETS[state.playerCount];
    for (let index = 0; index < expected.length; index += 1) {
      const player = state.players[index];
      if (!player || player.color !== expected[index] || !Array.isArray(player.tokens) || player.tokens.length !== 4) return false;
      if (!player.tokens.every(function (progress) {
        return Number.isInteger(progress) && progress >= -1 && progress <= 59;
      })) return false;
    }
    return typeof state.message === 'string';
  }

  return {
    VERSION: VERSION,
    COLORS: COLORS.slice(),
    START_INDEX: Object.assign({}, START_INDEX),
    SAFE_SQUARES: Array.from(SAFE_SQUARES),
    PLAYER_SETS: JSON.parse(JSON.stringify(PLAYER_SETS)),
    createGame: createGame,
    currentPlayer: currentPlayer,
    globalPosition: globalPosition,
    legalMoves: legalMoves,
    roll: roll,
    moveToken: moveToken,
    validateState: validateState,
    title: title
  };
});
