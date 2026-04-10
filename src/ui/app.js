import {avatarOptions} from '../config/avatars.js';
import {boardLayouts} from '../config/game-options.js';
import {createGame} from '../game/engine.js';
import {createRenderer} from '../game/renderer.js';

const defaultPlayerColors = ['#ff7a59', '#4f8cff', '#f6bf4f', '#5ed3a8'];
const defaultPlayerNames = ['שחקן 1', 'שחקן 2', 'שחקן 3', 'שחקן 4'];

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function getAvatarById(id) {
  return avatarOptions.find((option) => option.id === id) ?? avatarOptions[0];
}

function getLayoutById(id) {
  return boardLayouts.find((option) => option.id === id) ?? boardLayouts[0];
}

function getPlayerCardMarkup(index) {
  const avatarButtons = avatarOptions
    .map(
      (avatar, avatarIndex) => `
        <button
          type="button"
          class="avatar-option ${avatarIndex === index ? 'is-selected' : ''}"
          data-avatar-id="${avatar.id}"
          aria-label="בחר אוואטר ${avatar.label}"
        >
          <span>${avatar.emoji}</span>
        </button>
      `,
    )
    .join('');

  return `
    <div class="player-config-card" data-player-card="${index}">
      <div class="player-config-head">
        <span class="player-chip">שחקן ${index + 1}</span>
        <div class="player-type-toggle">
          <label class="toggle-option">
            <input type="radio" name="player-type-${index}" value="human" checked>
            <span>אנושי</span>
          </label>
          <label class="toggle-option">
            <input type="radio" name="player-type-${index}" value="ai">
            <span>מחשב</span>
          </label>
        </div>
      </div>
      <label class="field">
        <span>שם שחקן</span>
        <input type="text" class="player-name-input" value="${defaultPlayerNames[index]}" maxlength="16">
      </label>
      <label class="field">
        <span>צבע שחקן</span>
        <input type="color" class="player-color-input" value="${defaultPlayerColors[index]}">
      </label>
      <div class="field">
        <span>אוואטר</span>
        <div class="avatar-grid">${avatarButtons}</div>
      </div>
    </div>
  `;
}

function createLandingScreen() {
  const layoutOptions = boardLayouts
    .map((layout) => `<option value="${layout.id}">${layout.label} - ${layout.description}</option>`)
    .join('');

  const section = createElement('section', 'screen screen-landing');
  section.innerHTML = `
    <div class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Close Triangle</span>
        <h1>משחק סגירת משולשים</h1>
        <p>
          גרסה מחודשת עם מסך פתיחה ברור, התאמה לכל שחקן, לוח משחק נקי וממשק שמרגיש כמו משחק אמיתי ולא כמו דמו טכני.
        </p>
        <div class="hero-badges">
          <span>בחירת אוואטרים</span>
          <span>שחקני מחשב</span>
          <span>לוח ניקוד חי</span>
        </div>
      </div>
      <div class="hero-preview">
        <div class="preview-orb orb-a"></div>
        <div class="preview-orb orb-b"></div>
        <div class="preview-card">
          <span>משחק אסטרטגיה מהיר</span>
          <strong>בנו קווים, סגרו משולשים, קחו את ההובלה.</strong>
        </div>
      </div>
    </div>
    <div class="setup-shell">
      <form class="setup-panel" id="setupForm">
        <div class="setup-head">
          <div>
            <p class="section-kicker">הגדרת משחק</p>
            <h2>נבנה את הסיבוב הבא</h2>
          </div>
          <button type="submit" class="primary-btn">להתחיל משחק</button>
        </div>
        <div class="setup-grid">
          <label class="field">
            <span>מספר נקודות</span>
            <input id="pointCountInput" type="number" min="6" max="14" value="9">
          </label>
          <label class="field">
            <span>מספר שחקנים</span>
            <select id="playerCountSelect">
              <option value="2">2 שחקנים</option>
              <option value="3">3 שחקנים</option>
              <option value="4">4 שחקנים</option>
            </select>
          </label>
          <label class="field">
            <span>פריסת לוח</span>
            <select id="boardLayoutSelect">${layoutOptions}</select>
          </label>
        </div>
        <div class="players-config" id="playersConfig"></div>
      </form>
    </div>
  `;

  return section;
}

function createGameScreen() {
  const section = createElement('section', 'screen screen-game hidden');
  section.innerHTML = `
    <div class="game-layout">
      <aside class="game-sidebar">
        <div class="sidebar-head">
          <button type="button" class="ghost-btn" id="backToMenuBtn">חזרה לתפריט</button>
          <button type="button" class="secondary-btn" id="restartBtn">משחק חדש</button>
        </div>
        <div class="status-card">
          <p class="section-kicker">סטטוס משחק</p>
          <h2 id="turnTitle">המשחק מתחיל</h2>
          <p id="statusText">בחרו שתי נקודות כדי לצייר קו חוקי.</p>
        </div>
        <div class="meta-card" id="gameMetaCard"></div>
        <div class="players-scoreboard" id="playersScoreboard"></div>
        <div class="rules-card">
          <p class="section-kicker">איך משחקים</p>
          <p>מחברים שתי נקודות בכל תור. אסור לחצות קווים קיימים או לעבור קרוב מדי לנקודות אחרות.</p>
          <p id="rulesText">כל משולש חדש מעניק נקודה ומאפשר תור נוסף.</p>
        </div>
      </aside>
      <div class="board-shell">
        <div class="board-topbar">
          <div class="board-copy">
            <span class="section-kicker">לוח משחק</span>
            <strong id="boardTitle">הזירה מוכנה</strong>
          </div>
          <div class="board-stats">
            <div class="mini-stat">
              <span>נקודות</span>
              <strong id="pointCountBadge">0</strong>
            </div>
            <div class="mini-stat">
              <span>קווים</span>
              <strong id="moveCountBadge">0</strong>
            </div>
          </div>
        </div>
        <div class="canvas-wrap">
          <canvas id="boardCanvas" width="960" height="680"></canvas>
        </div>
      </div>
    </div>
    <div id="gameOverOverlay" class="game-over-overlay hidden">
      <div class="game-over-card">
        <p class="section-kicker">סיום משחק</p>
        <h3 id="overlayTitle">יש מנצח</h3>
        <p id="overlayText"></p>
        <div class="overlay-actions">
          <button type="button" class="primary-btn" id="overlayRestartBtn">לסיבוב נוסף</button>
          <button type="button" class="ghost-btn" id="overlayMenuBtn">חזרה לתפריט</button>
        </div>
      </div>
    </div>
  `;

  return section;
}

export function createApp(root) {
  let game = null;
  let renderer = null;
  let currentConfig = null;
  let aiTimer = null;

  root.innerHTML = '';
  const shell = createElement('div', 'app-shell');
  const landingScreen = createLandingScreen();
  const gameScreen = createGameScreen();
  shell.append(landingScreen, gameScreen);
  root.appendChild(shell);

  const setupForm = landingScreen.querySelector('#setupForm');
  const playerCountSelect = landingScreen.querySelector('#playerCountSelect');
  const pointCountInput = landingScreen.querySelector('#pointCountInput');
  const boardLayoutSelect = landingScreen.querySelector('#boardLayoutSelect');
  const playersConfig = landingScreen.querySelector('#playersConfig');

  const boardCanvas = gameScreen.querySelector('#boardCanvas');
  const playersScoreboard = gameScreen.querySelector('#playersScoreboard');
  const turnTitle = gameScreen.querySelector('#turnTitle');
  const statusText = gameScreen.querySelector('#statusText');
  const boardTitle = gameScreen.querySelector('#boardTitle');
  const pointCountBadge = gameScreen.querySelector('#pointCountBadge');
  const moveCountBadge = gameScreen.querySelector('#moveCountBadge');
  const gameMetaCard = gameScreen.querySelector('#gameMetaCard');
  const rulesText = gameScreen.querySelector('#rulesText');
  const restartBtn = gameScreen.querySelector('#restartBtn');
  const backToMenuBtn = gameScreen.querySelector('#backToMenuBtn');
  const gameOverOverlay = gameScreen.querySelector('#gameOverOverlay');
  const overlayTitle = gameScreen.querySelector('#overlayTitle');
  const overlayText = gameScreen.querySelector('#overlayText');
  const overlayRestartBtn = gameScreen.querySelector('#overlayRestartBtn');
  const overlayMenuBtn = gameScreen.querySelector('#overlayMenuBtn');

  function clearAITimer() {
    if (aiTimer) {
      window.clearTimeout(aiTimer);
      aiTimer = null;
    }
  }

  function buildPlayerConfigCards() {
    const count = Number(playerCountSelect.value);
    playersConfig.innerHTML = '';

    for (let index = 0; index < count; index += 1) {
      const wrapper = createElement('div');
      wrapper.innerHTML = getPlayerCardMarkup(index);
      playersConfig.appendChild(wrapper.firstElementChild);
    }

    playersConfig.querySelectorAll('.avatar-grid').forEach((grid) => {
      grid.addEventListener('click', (event) => {
        const button = event.target.closest('.avatar-option');
        if (!button) {
          return;
        }

        grid.querySelectorAll('.avatar-option').forEach((option) => {
          option.classList.toggle('is-selected', option === button);
        });
      });
    });
  }

  function readPlayersConfig() {
    return Array.from(playersConfig.querySelectorAll('[data-player-card]')).map((card, index) => {
      const playerName = card.querySelector('.player-name-input').value.trim() || defaultPlayerNames[index];
      const color = card.querySelector('.player-color-input').value;
      const isAI = card.querySelector(`input[name="player-type-${index}"]:checked`).value === 'ai';
      const selectedAvatar = card.querySelector('.avatar-option.is-selected')?.dataset.avatarId ?? avatarOptions[index].id;
      return {
        name: playerName,
        color,
        isAI,
        avatarId: selectedAvatar,
      };
    });
  }

  function renderScoreboard() {
    if (!game) {
      return;
    }

    const {state} = game;
    playersScoreboard.innerHTML = '';

    state.players.forEach((player, index) => {
      const avatar = getAvatarById(player.avatarId);
      const scoreCard = createElement(
        'article',
        `score-card ${state.currentPlayer === index && !state.isGameOver ? 'is-active' : ''}`,
      );

      scoreCard.innerHTML = `
        <div class="score-main">
          <div class="avatar-badge" style="--player-color:${player.color}">
            <span>${avatar.emoji}</span>
          </div>
          <div>
            <strong>${player.name}</strong>
            <p>${player.isAI ? 'שחקן מחשב' : 'שחקן אנושי'}</p>
          </div>
        </div>
        <div class="score-value" style="--player-color:${player.color}">
          <span>נקודות</span>
          <strong>${state.scores[index]}</strong>
        </div>
      `;

      playersScoreboard.appendChild(scoreCard);
    });

    pointCountBadge.textContent = String(state.points.length);
    moveCountBadge.textContent = String(state.edges.length);
  }

  function renderMeta() {
    if (!game) {
      return;
    }

    const layout = getLayoutById(game.state.layout);

    gameMetaCard.innerHTML = `
      <p class="section-kicker">מטא משחק</p>
      <div class="meta-grid meta-grid-single">
        <div>
          <span>פריסת לוח</span>
          <strong>${layout.label}</strong>
        </div>
      </div>
    `;

    rulesText.textContent = 'כל משולש חדש מעניק נקודה ומאפשר תור נוסף.';
  }

  function setStatus(title, text) {
    turnTitle.textContent = title;
    statusText.textContent = text;
  }

  function refreshGameUI() {
    if (!game || !renderer) {
      return;
    }

    const currentPlayer = game.state.players[game.state.currentPlayer];
    boardTitle.textContent = game.state.isGameOver
      ? 'הסיבוב הסתיים'
      : `תור ${currentPlayer.name}`;

    renderMeta();
    renderScoreboard();
    renderer.draw();
  }

  function showGameOver() {
    const {state} = game;
    const winners = state.winnerNames;
    const title = winners.length > 1 ? 'תיקו חזק' : 'ניצחון מרשים';
    const text =
      winners.length > 1
        ? `המשחק הסתיים בתיקו בין ${winners.join(', ')}.`
        : `${winners[0]} ניצח/ה את הסיבוב.`;

    overlayTitle.textContent = title;
    overlayText.textContent = text;
    setStatus(title, text);
    gameOverOverlay.classList.remove('hidden');
  }

  function handleMoveResult(result) {
    if (!result?.ok) {
      setStatus('מהלך לא חוקי', 'נסו לבחור זוג נקודות אחר שלא חוצה קווים קיימים.');
      refreshGameUI();
      return;
    }

    const player = game.state.players[result.owner];

    if (result.gameOver) {
      refreshGameUI();
      showGameOver();
      return;
    }

    if (result.triangleCount > 0) {
      const scoreText =
        result.scoreDelta > 0
          ? `הרווחתם ${result.scoreDelta} נקודות`
          : result.scoreDelta < 0
            ? `איבדתם ${Math.abs(result.scoreDelta)} נקודות`
            : 'לא השתנה ניקוד';
      const nextPlayer = game.state.players[result.nextPlayer];
      const extraTurnText =
        result.nextPlayer === result.owner
          ? 'ומקבלים תור נוסף.'
          : `והתור עובר אל ${nextPlayer.name}.`;

      setStatus(`${player.name} סגר/ה משולש`, `${scoreText} ${extraTurnText}`);
    } else {
      const nextPlayer = game.state.players[result.nextPlayer];
      setStatus(`עוברים תור`, `עכשיו ${nextPlayer.name} משחק/ת.`);
    }

    refreshGameUI();
    runAITurnIfNeeded();
  }

  function runAITurnIfNeeded() {
    clearAITimer();

    if (!game || game.state.isGameOver) {
      return;
    }

    const currentPlayer = game.state.players[game.state.currentPlayer];
    if (!currentPlayer.isAI) {
      return;
    }

    setStatus(`תור ${currentPlayer.name}`, 'שחקן המחשב מחשב את המהלך הבא...');
    aiTimer = window.setTimeout(() => {
      const move = game.getAIMove();
      if (!move) {
        showGameOver();
        return;
      }
      const result = game.applyMove(move[0], move[1]);
      handleMoveResult(result);
    }, 700);
  }

  function startGame(config) {
    clearAITimer();
    currentConfig = config;
    game = createGame({
      pointCount: config.pointCount,
      players: config.players,
      boardWidth: 960,
      boardHeight: 680,
      layout: config.layout,
    });

    renderer = createRenderer(boardCanvas, game);
    renderer.resize(game.state.width, game.state.height);
    refreshGameUI();

    gameOverOverlay.classList.add('hidden');
    landingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    const firstPlayer = game.state.players[game.state.currentPlayer];
    setStatus(`המשחק התחיל`, `תור ראשון של ${firstPlayer.name}.`);
    runAITurnIfNeeded();
  }

  function goToMenu() {
    clearAITimer();
    gameOverOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden');
    landingScreen.classList.remove('hidden');
  }

  setupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const players = readPlayersConfig();
    const pointCount = Math.min(14, Math.max(6, Number(pointCountInput.value) || 9));
    pointCountInput.value = String(pointCount);

    startGame({
      pointCount,
      players,
      layout: boardLayoutSelect.value,
    });
  });

  playerCountSelect.addEventListener('change', buildPlayerConfigCards);

  boardCanvas.addEventListener('click', (event) => {
    if (!game || game.state.isGameOver) {
      return;
    }

    const currentPlayer = game.state.players[game.state.currentPlayer];
    if (currentPlayer.isAI) {
      return;
    }

    const rect = boardCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * game.state.width;
    const y = ((event.clientY - rect.top) / rect.height) * game.state.height;
    const pointIndex = game.choosePointAt(x, y);

    if (pointIndex === null) {
      return;
    }

    if (game.state.selectedPoint === null) {
      game.state.selectedPoint = pointIndex;
      setStatus(`בחירה ראשונה`, `${currentPlayer.name}, בחרת נקודה. עכשיו בחרו נקודה שנייה.`);
      refreshGameUI();
      return;
    }

    if (game.state.selectedPoint === pointIndex) {
      game.state.selectedPoint = null;
      setStatus(`הבחירה בוטלה`, `אפשר לבחור שוב נקודה ראשונה.`);
      refreshGameUI();
      return;
    }

    const sourcePoint = game.state.selectedPoint;
    if (!game.canAddEdge(sourcePoint, pointIndex)) {
      game.state.selectedPoint = null;
      setStatus('מהלך לא חוקי', 'הקו שבחרתם חוצה קו קיים או עובר קרוב מדי לנקודה אחרת.');
      refreshGameUI();
      return;
    }

    const result = game.applyMove(sourcePoint, pointIndex);
    handleMoveResult(result);
  });

  restartBtn.addEventListener('click', () => {
    if (currentConfig) {
      startGame(currentConfig);
    }
  });

  overlayRestartBtn.addEventListener('click', () => {
    if (currentConfig) {
      startGame(currentConfig);
    }
  });

  backToMenuBtn.addEventListener('click', goToMenu);
  overlayMenuBtn.addEventListener('click', goToMenu);

  buildPlayerConfigCards();
}
