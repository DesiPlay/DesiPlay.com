(function () {
  'use strict';

  const Engine = window.DesiplayLudoEngine;
  if (!Engine) return;

  const COLORS = {
    red: '#e65c5c',
    blue: '#4f9cda',
    yellow: '#e6bd43',
    green: '#5da66b'
  };
  const LETTERS = { red: 'R', blue: 'B', yellow: 'Y', green: 'G' };
  const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const STORAGE_KEY = 'desiplay.ludo.match.v3';
  const TRACK = [];
  const LANES = {
    red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
    blue: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
    yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
    green: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]]
  };
  const YARD_SLOTS = {
    red: [[1, 1], [1, 4], [4, 1], [4, 4]],
    blue: [[1, 10], [1, 13], [4, 10], [4, 13]],
    yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
    green: [[10, 1], [10, 4], [13, 1], [13, 4]]
  };
  const SAFE = new Set(Engine.SAFE_SQUARES);
  const cells = new Map();

  for (let column = 1; column <= 5; column += 1) TRACK.push([6, column]);
  for (let row = 5; row >= 0; row -= 1) TRACK.push([row, 6]);
  TRACK.push([0, 7], [0, 8]);
  for (let row = 1; row <= 5; row += 1) TRACK.push([row, 8]);
  for (let column = 9; column <= 14; column += 1) TRACK.push([6, column]);
  TRACK.push([7, 14], [8, 14]);
  for (let column = 13; column >= 9; column -= 1) TRACK.push([8, column]);
  for (let row = 9; row <= 14; row += 1) TRACK.push([row, 8]);
  TRACK.push([14, 7], [14, 6]);
  for (let row = 13; row >= 9; row -= 1) TRACK.push([row, 6]);
  for (let column = 5; column >= 0; column -= 1) TRACK.push([8, column]);
  TRACK.push([7, 0], [6, 0]);

  const $ = function (id) { return document.getElementById(id); };
  const board = $('board');
  const playerCount = $('playerCount');
  const rollButton = $('rollButton');
  const newGameButton = $('newGame');
  const playersList = $('playersList');
  const gameStatus = $('gameStatus');
  let state = loadSavedState();

  function key(row, column) {
    return row + ',' + column;
  }

  function addCellClass(row, column, className) {
    const cell = cells.get(key(row, column));
    if (cell) cell.classList.add(className);
  }

  function buildBoard() {
    board.replaceChildren();
    cells.clear();
    const trackAt = new Map();
    TRACK.forEach(function (coordinate, index) {
      trackAt.set(key(coordinate[0], coordinate[1]), index);
    });

    for (let row = 0; row < 15; row += 1) {
      for (let column = 0; column < 15; column += 1) {
        const cell = document.createElement('div');
        cell.className = 'board-cell';
        cell.style.gridRow = String(row + 1);
        cell.style.gridColumn = String(column + 1);

        if (row < 6 && column < 6) cell.classList.add('yard-red');
        else if (row < 6 && column > 8) cell.classList.add('yard-blue');
        else if (row > 8 && column > 8) cell.classList.add('yard-yellow');
        else if (row > 8 && column < 6) cell.classList.add('yard-green');

        const trackIndex = trackAt.get(key(row, column));
        if (trackIndex !== undefined) {
          cell.classList.add('track');
          if (SAFE.has(trackIndex)) cell.classList.add('safe');
          Object.keys(Engine.START_INDEX).forEach(function (color) {
            if (Engine.START_INDEX[color] === trackIndex) cell.classList.add('start-' + color);
          });
        }

        Object.keys(LANES).forEach(function (color) {
          if (LANES[color].some(function (coordinate) {
            return coordinate[0] === row && coordinate[1] === column;
          })) cell.classList.add('lane-' + color);
        });

        if (row >= 6 && row <= 8 && column >= 6 && column <= 8) cell.classList.add('center-cell');
        if (row === 7 && column === 7) cell.classList.add('home-center');

        Object.keys(YARD_SLOTS).forEach(function (color) {
          if (YARD_SLOTS[color].some(function (coordinate) {
            return coordinate[0] === row && coordinate[1] === column;
          })) cell.classList.add('yard-slot');
        });

        board.appendChild(cell);
        cells.set(key(row, column), cell);
      }
    }
  }

  function loadSavedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Engine.validateState(parsed)) return parsed;
      }
    } catch (_error) {
      // Storage can be unavailable in private or restricted browsing modes.
    }
    return Engine.createGame(4);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      // The game remains playable even when local storage is blocked or full.
    }
  }

  function tokenCoordinate(color, progress, index) {
    if (progress === -1) return YARD_SLOTS[color][index];
    if (progress >= 0 && progress <= 51) {
      const trackIndex = (Engine.START_INDEX[color] + progress) % 52;
      return TRACK[trackIndex];
    }
    if (progress >= 52 && progress <= 57) return LANES[color][progress - 52];
    return [7, 7];
  }

  function progressLabel(progress) {
    if (progress === -1) return 'in the yard';
    if (progress === 58) return 'home';
    if (progress >= 52) return 'in the home lane';
    return 'on the track';
  }

  function renderBoard() {
    cells.forEach(function (cell) {
      cell.querySelectorAll('.token-button').forEach(function (button) {
        button.remove();
      });
    });

    const active = Engine.currentPlayer(state);
    const moves = Engine.legalMoves(state);
    const stacks = new Map();

    state.players.forEach(function (player) {
      player.tokens.forEach(function (progress, index) {
        const coordinate = tokenCoordinate(player.color, progress, index);
        const coordinateKey = key(coordinate[0], coordinate[1]);
        if (!stacks.has(coordinateKey)) stacks.set(coordinateKey, []);
        stacks.get(coordinateKey).push({ player: player, progress: progress, index: index });
      });
    });

    stacks.forEach(function (tokens, coordinateKey) {
      const cell = cells.get(coordinateKey);
      if (!cell) return;
      tokens.forEach(function (token) {
        const isLegal = token.player.color === active.color && moves.indexOf(token.index) !== -1;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'token-button ' + token.player.color + (isLegal ? ' legal' : '');
        button.textContent = LETTERS[token.player.color] + (token.index + 1);
        button.disabled = !isLegal || state.status !== 'playing';
        button.setAttribute('aria-label',
          Engine.title(token.player.color) + ' token ' + (token.index + 1) + ', ' + progressLabel(token.progress) +
          (isLegal ? ', legal move' : ''));
        button.title = button.getAttribute('aria-label');
        if (tokens.length > 1) button.style.width = '43%';
        button.addEventListener('click', function () {
          makeMove(token.index);
        });
        cell.appendChild(button);
      });
    });
  }

  function renderPlayers() {
    playersList.replaceChildren();
    state.players.forEach(function (player, index) {
      const row = document.createElement('div');
      row.className = 'player-row' + (index === state.turn ? ' active' : '');

      const name = document.createElement('span');
      name.className = 'player-name';
      const dot = document.createElement('i');
      dot.className = 'player-dot';
      dot.style.background = COLORS[player.color];
      const label = document.createElement('span');
      label.textContent = Engine.title(player.color);
      name.append(dot, label);

      const count = document.createElement('span');
      count.className = 'player-count';
      count.textContent = player.tokens.filter(function (progress) { return progress === 58; }).length + '/4 home';
      row.append(name, count);
      playersList.appendChild(row);
    });
  }

  function renderMoveChoices() {
    const choices = $('moveChoices');
    choices.replaceChildren();
    const active = Engine.currentPlayer(state);
    Engine.legalMoves(state).forEach(function (index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'game-btn secondary legal-move-button';
      button.textContent = 'Move token ' + (index + 1);
      button.setAttribute('aria-label', 'Move ' + Engine.title(active.color) + ' token ' + (index + 1));
      button.addEventListener('click', function () {
        makeMove(index);
      });
      choices.appendChild(button);
    });
  }

  function render() {
    const active = Engine.currentPlayer(state);
    const moves = Engine.legalMoves(state);
    const currentName = $('currentPlayerName');
    currentName.textContent = Engine.title(active.color);
    $('currentPlayerDot').style.background = COLORS[active.color];
    $('currentPlayerSub').textContent = state.status === 'won' ? 'Winner' :
      (state.dice === null ? 'Ready to roll' : 'Choose a highlighted token');

    $('diceFace').textContent = state.dice !== null ? DICE_FACES[state.dice - 1] :
      (state.lastRoll !== null ? DICE_FACES[state.lastRoll - 1] : '🎲');
    $('diceLabel').textContent = state.status === 'won' ? 'Game complete.' :
      (state.dice !== null ? 'You rolled ' + state.dice + '. Select a glowing token.' : 'Roll to start your turn.');
    rollButton.disabled = state.status !== 'playing' || state.dice !== null;
    rollButton.textContent = state.dice !== null ? 'Choose a token' : 'Roll dice';
    gameStatus.textContent = state.message;
    $('boardHint').textContent = state.status === 'won' ?
      Engine.title(state.winner) + ' has brought all four tokens home. Start a new game to play again.' :
      (state.dice !== null && moves.length ? 'Choose a highlighted ' + Engine.title(active.color) + ' token to move ' + state.dice + ' square' + (state.dice === 1 ? '' : 's') + '.' :
        'Roll the dice. When you have a legal move, the available tokens will glow—select one to move it.');
    playerCount.value = String(state.playerCount);
    renderPlayers();
    renderBoard();
    renderMoveChoices();
  }

  function makeMove(index) {
    try {
      state = Engine.moveToken(state, index);
      saveState();
      render();
      if (state.status === 'playing' && state.dice === null) rollButton.focus();
    } catch (error) {
      gameStatus.textContent = error.message;
    }
  }

  function startNewGame() {
    state = Engine.createGame(Number(playerCount.value));
    saveState();
    render();
    rollButton.focus();
  }

  rollButton.addEventListener('click', function () {
    const value = Math.floor(Math.random() * 6) + 1;
    state = Engine.roll(state, value);
    saveState();
    render();
    const firstMove = Engine.legalMoves(state)[0];
    if (firstMove !== undefined) {
      const activeColor = Engine.currentPlayer(state).color;
      const tokenButton = board.querySelector('.token-button.' + activeColor + '[aria-label*="legal move"]');
      if (tokenButton) tokenButton.focus();
    } else if (state.status === 'playing') {
      rollButton.focus();
    }
  });

  newGameButton.addEventListener('click', startNewGame);
  playerCount.addEventListener('change', startNewGame);

  buildBoard();
  saveState();
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js').catch(function () {});
  }
})();
