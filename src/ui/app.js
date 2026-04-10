import {avatarOptions} from '../config/avatars.js';
import {
  aiDifficultyOptions,
  boardLayouts,
  gameModes,
  moveTimerOptions,
  rectangleGridSizes,
} from '../config/game-options.js';
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

function getModeById(id) {
  return gameModes.find((option) => option.id === id) ?? gameModes[0];
}

function getGridSizeById(id) {
  return rectangleGridSizes.find((option) => option.id === id) ?? rectangleGridSizes[1];
}

function getMoveTimerById(id) {
  return moveTimerOptions.find((option) => option.id === id) ?? moveTimerOptions[0];
}

function getAIDifficultyById(id) {
  return aiDifficultyOptions.find((option) => option.id === id) ?? aiDifficultyOptions[1];
}

function getPlayerCardMarkup(index) {
  const aiDifficultyMarkup = aiDifficultyOptions
    .map(
      (option) =>
        `<option value="${option.id}" ${option.id === 'medium' ? 'selected' : ''}>${option.label} - ${option.description}</option>`,
    )
    .join('');
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
      <label class="field ai-difficulty-field hidden">
        <span>רמת קושי</span>
        <select class="ai-difficulty-select">${aiDifficultyMarkup}</select>
      </label>
      <div class="field">
        <span>אוואטר</span>
        <div class="avatar-grid">${avatarButtons}</div>
      </div>
    </div>
  `;
}

function getModePickerMarkup() {
  return gameModes
    .map(
      (mode, index) => `
        <label class="mode-card ${index === 0 ? 'is-selected' : ''}" data-mode-card="${mode.id}">
          <input type="radio" name="game-mode" value="${mode.id}" ${index === 0 ? 'checked' : ''}>
          <span class="mode-card-eyebrow">${mode.label}</span>
          <strong>${mode.description}</strong>
        </label>
      `,
    )
    .join('');
}

function createLandingScreen() {
  const layoutOptions = boardLayouts
    .map((layout) => `<option value="${layout.id}">${layout.label} - ${layout.description}</option>`)
    .join('');
  const gridOptions = rectangleGridSizes
    .map((size) => `<option value="${size.id}">${size.label} - ${size.description}</option>`)
    .join('');
  const moveTimerMarkup = moveTimerOptions
    .map((option) => `<option value="${option.id}">${option.label}</option>`)
    .join('');

  const section = createElement('section', 'screen screen-landing');
  section.innerHTML = `
    <div class="hero">
      <div class="hero-copy">
        <span class="eyebrow">Triangle Trap</span>
        <h1>משחק סגירת צורות</h1>
        <p>
          פותחים סיבוב חדש בשני שלבים פשוטים: קודם בוחרים סוג משחק ולוח, ואחר כך מגדירים את השחקנים.
        </p>
        <div class="hero-badges">
          <span>מסך פתיחה קליל</span>
          <span>מצב משולשים</span>
          <span>מצב מרובעים</span>
          <span>שחקני מחשב</span>
        </div>
      </div>
      <div class="hero-preview">
        <div class="preview-orb orb-a"></div>
        <div class="preview-orb orb-b"></div>
        <div class="preview-card">
          <span>זרימה חדשה</span>
          <strong>שלב ראשון ללוח, שלב שני לשחקנים, ואז מתחילים לשחק.</strong>
        </div>
      </div>
    </div>
    <div class="setup-shell">
      <section class="setup-panel setup-step" id="setupStageConfig">
        <div class="setup-head">
          <div>
            <p class="section-kicker">שלב 1 מתוך 2</p>
            <h2>בחרו סוג משחק</h2>
          </div>
          <div class="step-badge">הגדרות לוח</div>
        </div>
        <div class="mode-picker" id="modePicker">
          ${getModePickerMarkup()}
        </div>
        <div class="setup-grid compact" id="gameOptionsGrid">
          <label class="field" id="pointCountField">
            <span>מספר נקודות</span>
            <input id="pointCountInput" type="number" min="6" max="14" value="9">
          </label>
          <label class="field" id="boardLayoutField">
            <span>פריסת לוח</span>
            <select id="boardLayoutSelect">${layoutOptions}</select>
          </label>
          <label class="field hidden" id="gridSizeField">
            <span>גודל רשת</span>
            <select id="gridSizeSelect">${gridOptions}</select>
          </label>
        </div>
        <div class="setup-actions">
          <div class="setup-hint" id="configHint"></div>
          <button type="button" class="primary-btn" id="continueToPlayersBtn">המשך לבחירת שחקנים</button>
        </div>
      </section>
      <section class="setup-panel setup-step hidden" id="setupStagePlayers">
        <div class="setup-head">
          <div>
            <p class="section-kicker">שלב 2 מתוך 2</p>
            <h2>בחרו שחקנים ואוואטרים</h2>
          </div>
          <div class="step-badge">הרכב משתתפים</div>
        </div>
        <div class="setup-summary" id="setupSummary"></div>
        <form id="setupForm">
          <div class="setup-grid compact">
            <label class="field">
              <span>מספר שחקנים</span>
              <select id="playerCountSelect">
                <option value="2">2 שחקנים</option>
                <option value="3">3 שחקנים</option>
                <option value="4">4 שחקנים</option>
              </select>
            </label>
            <label class="field">
              <span>זמן לכל מהלך</span>
              <select id="moveTimerSelect">${moveTimerMarkup}</select>
            </label>
          </div>
          <div class="players-config" id="playersConfig"></div>
          <div class="setup-actions">
            <button type="button" class="ghost-btn" id="backToConfigBtn">חזרה לבחירת משחק</button>
            <button type="submit" class="primary-btn">להתחיל משחק</button>
          </div>
        </form>
      </section>
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
          <div class="turn-timer hidden" id="turnTimer">
            <span>זמן שנותר</span>
            <strong id="turnTimerValue">0</strong>
          </div>
        </div>
        <div class="meta-card" id="gameMetaCard"></div>
        <div class="players-scoreboard" id="playersScoreboard"></div>
        <div class="rules-card">
          <p class="section-kicker">איך משחקים</p>
          <p id="baseRulesText">מחברים שתי נקודות בכל תור.</p>
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
  let turnTimerInterval = null;
  let turnDeadline = 0;
  let setupState = {
    mode: gameModes[0].id,
    pointCount: 9,
    layout: boardLayouts[0].id,
    gridSizeId: rectangleGridSizes[1].id,
    playerCount: 2,
    moveTimerId: moveTimerOptions[0].id,
  };

  root.innerHTML = '';
  const shell = createElement('div', 'app-shell');
  const landingScreen = createLandingScreen();
  const gameScreen = createGameScreen();
  shell.append(landingScreen, gameScreen);
  root.appendChild(shell);

  const setupStageConfig = landingScreen.querySelector('#setupStageConfig');
  const setupStagePlayers = landingScreen.querySelector('#setupStagePlayers');
  const modePicker = landingScreen.querySelector('#modePicker');
  const continueToPlayersBtn = landingScreen.querySelector('#continueToPlayersBtn');
  const backToConfigBtn = landingScreen.querySelector('#backToConfigBtn');
  const configHint = landingScreen.querySelector('#configHint');
  const setupSummary = landingScreen.querySelector('#setupSummary');
  const setupForm = landingScreen.querySelector('#setupForm');
  const playerCountSelect = landingScreen.querySelector('#playerCountSelect');
  const moveTimerSelect = landingScreen.querySelector('#moveTimerSelect');
  const pointCountInput = landingScreen.querySelector('#pointCountInput');
  const boardLayoutSelect = landingScreen.querySelector('#boardLayoutSelect');
  const gridSizeSelect = landingScreen.querySelector('#gridSizeSelect');
  const pointCountField = landingScreen.querySelector('#pointCountField');
  const boardLayoutField = landingScreen.querySelector('#boardLayoutField');
  const gridSizeField = landingScreen.querySelector('#gridSizeField');
  const playersConfig = landingScreen.querySelector('#playersConfig');

  const boardCanvas = gameScreen.querySelector('#boardCanvas');
  const playersScoreboard = gameScreen.querySelector('#playersScoreboard');
  const turnTitle = gameScreen.querySelector('#turnTitle');
  const statusText = gameScreen.querySelector('#statusText');
  const turnTimer = gameScreen.querySelector('#turnTimer');
  const turnTimerValue = gameScreen.querySelector('#turnTimerValue');
  const boardTitle = gameScreen.querySelector('#boardTitle');
  const pointCountBadge = gameScreen.querySelector('#pointCountBadge');
  const moveCountBadge = gameScreen.querySelector('#moveCountBadge');
  const gameMetaCard = gameScreen.querySelector('#gameMetaCard');
  const baseRulesText = gameScreen.querySelector('#baseRulesText');
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

  function clearTurnTimer() {
    if (turnTimerInterval) {
      window.clearInterval(turnTimerInterval);
      turnTimerInterval = null;
    }
    turnDeadline = 0;
  }

  function updateTurnTimerDisplay() {
    if (!game || game.state.isGameOver || game.state.moveTimeLimit <= 0 || turnDeadline === 0) {
      turnTimer.classList.add('hidden');
      return;
    }

    const remainingMs = Math.max(0, turnDeadline - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    turnTimerValue.textContent = `${remainingSeconds}s`;
    turnTimer.classList.remove('hidden');

    if (remainingMs <= 0) {
      clearTurnTimer();
      handleTurnTimeout();
    }
  }

  function restartTurnTimer() {
    clearTurnTimer();

    if (!game || game.state.isGameOver || game.state.moveTimeLimit <= 0) {
      turnTimer.classList.add('hidden');
      return;
    }

    turnDeadline = Date.now() + game.state.moveTimeLimit * 1000;
    updateTurnTimerDisplay();
    turnTimerInterval = window.setInterval(updateTurnTimerDisplay, 250);
  }

  function togglePlayerDifficultyField(card, isAI) {
    const difficultyField = card.querySelector('.ai-difficulty-field');
    if (!difficultyField) {
      return;
    }

    difficultyField.classList.toggle('hidden', !isAI);
  }

  function attachPlayerCardEvents(card, index) {
    const avatarGrid = card.querySelector('.avatar-grid');
    const playerTypeInputs = card.querySelectorAll(`input[name="player-type-${index}"]`);

    avatarGrid.addEventListener('click', (event) => {
      const button = event.target.closest('.avatar-option');
      if (!button) {
        return;
      }

      avatarGrid.querySelectorAll('.avatar-option').forEach((option) => {
        option.classList.toggle('is-selected', option === button);
      });
    });

    playerTypeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        togglePlayerDifficultyField(card, input.value === 'ai' && input.checked);
      });
    });
  }

  function getSelectedMode() {
    return getModeById(setupState.mode);
  }

  function syncModeCards() {
    modePicker.querySelectorAll('[data-mode-card]').forEach((card) => {
      card.classList.toggle('is-selected', card.dataset.modeCard === setupState.mode);
    });
  }

  function syncConfigFields() {
    const isRectangles = setupState.mode === 'rectangles';
    pointCountField.classList.toggle('hidden', isRectangles);
    boardLayoutField.classList.toggle('hidden', isRectangles);
    gridSizeField.classList.toggle('hidden', !isRectangles);
  }

  function renderConfigHint() {
    const mode = getSelectedMode();
    if (mode.id === 'rectangles') {
      const grid = getGridSizeById(setupState.gridSizeId);
      configHint.textContent = `${mode.label}: רשת ${grid.label} עם ${grid.rows - 1} על ${grid.cols - 1} תאים לסגירה.`;
      return;
    }

    const layout = getLayoutById(setupState.layout);
    configHint.textContent = `${mode.label}: ${setupState.pointCount} נקודות בפריסת ${layout.label}.`;
  }

  function renderSetupSummary() {
    const mode = getSelectedMode();
    const moveTimer = getMoveTimerById(setupState.moveTimerId);

    if (mode.id === 'rectangles') {
      const grid = getGridSizeById(setupState.gridSizeId);
      setupSummary.innerHTML = `
        <div>
          <span>מצב</span>
          <strong>${mode.label}</strong>
        </div>
        <div>
          <span>לוח</span>
          <strong>רשת ${grid.label}</strong>
        </div>
        <div>
          <span>זמן לתור</span>
          <strong>${moveTimer.label}</strong>
        </div>
      `;
      return;
    }

    const layout = getLayoutById(setupState.layout);
    setupSummary.innerHTML = `
      <div>
        <span>מצב</span>
        <strong>${mode.label}</strong>
      </div>
      <div>
        <span>נקודות</span>
        <strong>${setupState.pointCount}</strong>
      </div>
      <div>
        <span>פריסה</span>
        <strong>${layout.label}</strong>
      </div>
      <div>
        <span>זמן לתור</span>
        <strong>${moveTimer.label}</strong>
      </div>
    `;
  }

  function buildPlayerConfigCards() {
    const count = Number(playerCountSelect.value);
    setupState.playerCount = count;
    playersConfig.innerHTML = '';

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const wrapper = createElement('div');
      wrapper.innerHTML = getPlayerCardMarkup(index);
      const card = wrapper.firstElementChild;
      attachPlayerCardEvents(card, index);
      fragment.appendChild(card);
    }

    playersConfig.appendChild(fragment);
  }

  function readPlayersConfig() {
    return Array.from(playersConfig.querySelectorAll('[data-player-card]')).map((card, index) => {
      const playerName = card.querySelector('.player-name-input').value.trim() || defaultPlayerNames[index];
      const color = card.querySelector('.player-color-input').value;
      const isAI = card.querySelector(`input[name="player-type-${index}"]:checked`).value === 'ai';
      const aiDifficulty = card.querySelector('.ai-difficulty-select')?.value ?? aiDifficultyOptions[1].id;
      const selectedAvatar = card.querySelector('.avatar-option.is-selected')?.dataset.avatarId ?? avatarOptions[index].id;
      return {
        name: playerName,
        color,
        isAI,
        aiDifficulty,
        avatarId: selectedAvatar,
      };
    });
  }

  function showSetupStage(stage) {
    const showPlayers = stage === 'players';
    setupStageConfig.classList.toggle('hidden', showPlayers);
    setupStagePlayers.classList.toggle('hidden', !showPlayers);

    if (showPlayers) {
      renderSetupSummary();
      playerCountSelect.value = String(setupState.playerCount);
      if (playersConfig.childElementCount !== setupState.playerCount) {
        buildPlayerConfigCards();
      }
    }
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
          <span>${state.scoreUnitLabel}</span>
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

    const mode = getModeById(game.state.mode);
    const metaItems = [
      `
        <div>
          <span>מצב משחק</span>
          <strong>${mode.label}</strong>
        </div>
      `,
    ];

    if (game.state.mode === 'rectangles' && game.state.grid) {
      metaItems.push(`
        <div>
          <span>גודל רשת</span>
          <strong>${game.state.grid.cols - 1}x${game.state.grid.rows - 1}</strong>
        </div>
      `);
    } else {
      const layout = getLayoutById(game.state.layout);
      metaItems.push(`
        <div>
          <span>פריסת לוח</span>
          <strong>${layout.label}</strong>
        </div>
      `);
    }

    metaItems.push(`
      <div>
        <span>טיימר תור</span>
        <strong>${game.state.moveTimeLimit > 0 ? `${game.state.moveTimeLimit} שניות` : 'ללא הגבלה'}</strong>
      </div>
    `);

    gameMetaCard.innerHTML = `
      <p class="section-kicker">מטא משחק</p>
      <div class="meta-grid">
        ${metaItems.join('')}
      </div>
    `;

    baseRulesText.textContent =
      game.state.mode === 'rectangles'
        ? 'מחברים רק נקודות שכנות על הרשת, אופקית או אנכית.'
        : 'מחברים שתי נקודות בכל תור. אסור לחצות קווים קיימים או לעבור קרוב מדי לנקודות אחרות.';
    rulesText.textContent = mode.rulesText;
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
    clearTurnTimer();
    turnTimer.classList.add('hidden');
    gameOverOverlay.classList.remove('hidden');
  }

  function handleMoveResult(result) {
    if (!result?.ok) {
      const illegalText =
        game.state.mode === 'rectangles'
          ? 'נסו לבחור שתי נקודות שכנות שעדיין לא חוברו.'
          : 'נסו לבחור זוג נקודות אחר שלא חוצה קווים קיימים.';
      setStatus('מהלך לא חוקי', illegalText);
      refreshGameUI();
      return;
    }

    const player = game.state.players[result.owner];

    if (result.skipped) {
      const nextPlayer = game.state.players[result.nextPlayer];
      const skipText =
        result.skipReason === 'timeout'
          ? `${player.name} חרג/ה ממגבלת הזמן, קיבל/ה ‎-1 נקודה והתור עבר. עכשיו ${nextPlayer.name} משחק/ת.`
          : `${player.name} דילג/ה על התור. עכשיו ${nextPlayer.name} משחק/ת.`;
      setStatus('התור נגמר', skipText);
      refreshGameUI();

      if (result.gameOver) {
        clearTurnTimer();
        showGameOver();
        return;
      }

      restartTurnTimer();
      runAITurnIfNeeded();
      return;
    }

    if (result.gameOver) {
      clearTurnTimer();
      refreshGameUI();
      showGameOver();
      return;
    }

    if (result.shapeCount > 0) {
      const scoreText =
        result.scoreDelta > 0
          ? `הרווחתם ${result.scoreDelta} ${game.state.scoreUnitLabel}`
          : result.scoreDelta < 0
            ? `איבדתם ${Math.abs(result.scoreDelta)} נקודות`
            : 'לא השתנה ניקוד';
      const nextPlayer = game.state.players[result.nextPlayer];
      const extraTurnText =
        result.nextPlayer === result.owner
          ? 'ומקבלים תור נוסף.'
          : `והתור עובר אל ${nextPlayer.name}.`;

      setStatus(`${player.name} סגר/ה ${game.state.scoreUnitSingular}`, `${scoreText} ${extraTurnText}`);
    } else {
      const nextPlayer = game.state.players[result.nextPlayer];
      setStatus('עוברים תור', `עכשיו ${nextPlayer.name} משחק/ת.`);
    }

    refreshGameUI();
    restartTurnTimer();
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
      const move = game.getAIMove(currentPlayer.aiDifficulty);
      if (!move) {
        clearTurnTimer();
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
      mode: config.mode,
      pointCount: config.pointCount,
      players: config.players,
      boardWidth: 960,
      boardHeight: 680,
      layout: config.layout,
      gridRows: config.gridRows,
      gridCols: config.gridCols,
      moveTimeLimit: config.moveTimeLimit,
    });

    renderer = createRenderer(boardCanvas, game);
    renderer.resize(game.state.width, game.state.height);
    refreshGameUI();

    gameOverOverlay.classList.add('hidden');
    landingScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    const firstPlayer = game.state.players[game.state.currentPlayer];
    setStatus('המשחק התחיל', `תור ראשון של ${firstPlayer.name}.`);
    restartTurnTimer();
    runAITurnIfNeeded();
  }

  function goToMenu() {
    clearAITimer();
    clearTurnTimer();
    gameOverOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden');
    landingScreen.classList.remove('hidden');
    showSetupStage('config');
  }

  function handleTurnTimeout() {
    if (!game || game.state.isGameOver) {
      return;
    }

    clearAITimer();
    const result = game.skipTurn('timeout');
    handleMoveResult(result);
  }

  function syncConfigUI() {
    syncModeCards();
    syncConfigFields();
    renderConfigHint();
  }

  modePicker.addEventListener('change', (event) => {
    const input = event.target.closest('input[name="game-mode"]');
    if (!input) {
      return;
    }

    setupState.mode = input.value;
    syncConfigUI();
  });

  pointCountInput.addEventListener('input', () => {
    const pointCount = Math.min(14, Math.max(6, Number(pointCountInput.value) || 9));
    pointCountInput.value = String(pointCount);
    setupState.pointCount = pointCount;
    renderConfigHint();
  });

  boardLayoutSelect.addEventListener('change', () => {
    setupState.layout = boardLayoutSelect.value;
    renderConfigHint();
  });

  gridSizeSelect.addEventListener('change', () => {
    setupState.gridSizeId = gridSizeSelect.value;
    renderConfigHint();
  });

  moveTimerSelect.addEventListener('change', () => {
    setupState.moveTimerId = moveTimerSelect.value;
    renderSetupSummary();
  });

  continueToPlayersBtn.addEventListener('click', () => {
    showSetupStage('players');
  });

  backToConfigBtn.addEventListener('click', () => {
    showSetupStage('config');
  });

  playerCountSelect.addEventListener('change', buildPlayerConfigCards);

  setupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const players = readPlayersConfig();
    const selectedGrid = getGridSizeById(setupState.gridSizeId);

    startGame({
      mode: setupState.mode,
      pointCount: setupState.pointCount,
      players,
      layout: setupState.layout,
      gridRows: selectedGrid.rows,
      gridCols: selectedGrid.cols,
      moveTimeLimit: getMoveTimerById(setupState.moveTimerId).seconds,
    });
  });

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
      setStatus('בחירה ראשונה', `${currentPlayer.name}, בחרת נקודה. עכשיו בחרו נקודה שנייה.`);
      refreshGameUI();
      return;
    }

    if (game.state.selectedPoint === pointIndex) {
      game.state.selectedPoint = null;
      setStatus('הבחירה בוטלה', 'אפשר לבחור שוב נקודה ראשונה.');
      refreshGameUI();
      return;
    }

    const sourcePoint = game.state.selectedPoint;
    if (!game.canAddEdge(sourcePoint, pointIndex)) {
      game.state.selectedPoint = null;
      const illegalText =
        game.state.mode === 'rectangles'
          ? 'במצב מרובעים אפשר לחבר רק נקודות שכנות על הרשת.'
          : 'הקו שבחרתם חוצה קו קיים או עובר קרוב מדי לנקודה אחרת.';
      setStatus('מהלך לא חוקי', illegalText);
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

  pointCountInput.value = String(setupState.pointCount);
  boardLayoutSelect.value = setupState.layout;
  gridSizeSelect.value = setupState.gridSizeId;
  playerCountSelect.value = String(setupState.playerCount);
  moveTimerSelect.value = setupState.moveTimerId;
  syncConfigUI();
  showSetupStage('config');
}
