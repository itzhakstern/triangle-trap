const POINT_RADIUS = 8;
const TRIANGLE_MIN_POINTS = 6;
const TRIANGLE_MAX_POINTS = 14;

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pointSegmentDistance(point, a, b) {
  const px = b.x - a.x;
  const py = b.y - a.y;
  const norm = px * px + py * py;
  const u = norm === 0 ? 0 : ((point.x - a.x) * px + (point.y - a.y) * py) / norm;
  const t = Math.max(0, Math.min(1, u));
  const x = a.x + t * px;
  const y = a.y + t * py;
  return distance(point, {x, y});
}

function orientation(p, q, r) {
  const value = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(value) < 0.000001) {
    return 0;
  }
  return value > 0 ? 1 : 2;
}

function onSegment(p, q, r) {
  return (
    q.x <= Math.max(p.x, r.x) + 1e-9 &&
    q.x >= Math.min(p.x, r.x) - 1e-9 &&
    q.y <= Math.max(p.y, r.y) + 1e-9 &&
    q.y >= Math.min(p.y, r.y) - 1e-9
  );
}

function isIntersecting(a, b, c, d) {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(a, c, b)) {
    return true;
  }
  if (o2 === 0 && onSegment(a, d, b)) {
    return true;
  }
  if (o3 === 0 && onSegment(c, a, d)) {
    return true;
  }
  if (o4 === 0 && onSegment(c, b, d)) {
    return true;
  }
  return false;
}

function offsetPoint(from, to, offset) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {x: from.x, y: from.y};
  }

  return {
    x: from.x + (dx / length) * offset,
    y: from.y + (dy / length) * offset,
  };
}

function colorWithAlpha(hex, alpha) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function edgeKey(a, b) {
  return a < b ? `${a}_${b}` : `${b}_${a}`;
}

function triangleKey(a, b, c) {
  return [a, b, c].sort((left, right) => left - right).join('_');
}

function cellKey(row, col) {
  return `${row}_${col}`;
}

function createRandomPoints(count, width, height) {
  const out = [];
  const margin = 54;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;
  let attempts = 0;

  while (out.length < count && attempts < 5000) {
    attempts += 1;

    const point = {
      x: margin + Math.random() * innerWidth,
      y: margin + Math.random() * innerHeight,
      id: out.length,
    };

    if (!out.some((candidate) => distance(candidate, point) < 72)) {
      out.push(point);
    }
  }

  if (out.length < count) {
    throw new Error('לא ניתן היה למקם את כל הנקודות. נסה מספר נקודות קטן יותר.');
  }

  return out;
}

function createCirclePoints(count, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.36;

  return Array.from({length: count}, (_, index) => {
    const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2;
    return {
      id: index,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });
}

function createWavePoints(count, width, height) {
  const horizontalMargin = 72;
  const span = width - horizontalMargin * 2;
  const step = count === 1 ? 0 : span / (count - 1);
  const top = height * 0.28;
  const waveHeight = height * 0.24;

  return Array.from({length: count}, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    return {
      id: index,
      x: horizontalMargin + step * index,
      y: top + Math.sin(progress * Math.PI * 2) * waveHeight + progress * 90,
    };
  });
}

function createTrianglePoints(layout, count, width, height) {
  switch (layout) {
    case 'circle':
      return createCirclePoints(count, width, height);
    case 'wave':
      return createWavePoints(count, width, height);
    default:
      return createRandomPoints(count, width, height);
  }
}

function createGridPoints(rows, cols, width, height) {
  const horizontalMargin = 110;
  const verticalMargin = 96;
  const stepX = cols === 1 ? 0 : (width - horizontalMargin * 2) / (cols - 1);
  const stepY = rows === 1 ? 0 : (height - verticalMargin * 2) / (rows - 1);
  const points = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      points.push({
        id: points.length,
        row,
        col,
        x: horizontalMargin + col * stepX,
        y: verticalMargin + row * stepY,
      });
    }
  }

  return points;
}

function getGridPointId(row, col, cols) {
  return row * cols + col;
}

function buildModeDefinition(config, width, height) {
  const mode = config.mode ?? 'triangles';

  if (mode === 'rectangles') {
    const rows = Math.max(4, Number(config.gridRows) || 5);
    const cols = Math.max(4, Number(config.gridCols) || 5);
    const points = createGridPoints(rows, cols, width, height);
    const cells = [];

    for (let row = 0; row < rows - 1; row += 1) {
      for (let col = 0; col < cols - 1; col += 1) {
        cells.push({
          id: cellKey(row, col),
          row,
          col,
          points: [
            getGridPointId(row, col, cols),
            getGridPointId(row, col + 1, cols),
            getGridPointId(row + 1, col + 1, cols),
            getGridPointId(row + 1, col, cols),
          ],
          edges: [
            edgeKey(getGridPointId(row, col, cols), getGridPointId(row, col + 1, cols)),
            edgeKey(getGridPointId(row, col + 1, cols), getGridPointId(row + 1, col + 1, cols)),
            edgeKey(getGridPointId(row + 1, col, cols), getGridPointId(row + 1, col + 1, cols)),
            edgeKey(getGridPointId(row, col, cols), getGridPointId(row + 1, col, cols)),
          ],
        });
      }
    }

    return {
      id: mode,
      points,
      rows,
      cols,
      layout: 'grid',
      minPoints: points.length,
      maxPoints: points.length,
      pointCount: points.length,
      cells,
      scoreUnitLabel: 'מרובעים',
      scoreUnitSingular: 'מרובע',
      shapeType: 'rectangle',
      canAddEdgeByGeometry(a, b, state, hasEdge) {
        if (a === b || hasEdge(a, b)) {
          return false;
        }

        const start = state.points[a];
        const end = state.points[b];
        const rowDistance = Math.abs(start.row - end.row);
        const colDistance = Math.abs(start.col - end.col);
        return (rowDistance === 1 && colDistance === 0) || (rowDistance === 0 && colDistance === 1);
      },
      getScorePreview(a, b, context) {
        let count = 0;
        for (const cell of context.cellsByEdge.get(edgeKey(a, b)) ?? []) {
          if (!context.shapeLookup.has(cell.id) && cell.edges.every((key) => key === edgeKey(a, b) || context.edgeLookup.has(key))) {
            count += 1;
          }
        }
        return count;
      },
      addShapesForEdge(a, b, owner, context) {
        const addedShapes = [];
        for (const cell of context.cellsByEdge.get(edgeKey(a, b)) ?? []) {
          if (context.shapeLookup.has(cell.id)) {
            continue;
          }

          if (!cell.edges.every((key) => context.edgeLookup.has(key))) {
            continue;
          }

          const shape = {
            id: cell.id,
            owner,
            type: 'rectangle',
            points: cell.points,
          };
          context.shapeLookup.add(cell.id);
          context.state.shapes.push(shape);
          addedShapes.push(shape);
        }

        return addedShapes;
      },
    };
  }

  const pointCount = Math.min(
    TRIANGLE_MAX_POINTS,
    Math.max(TRIANGLE_MIN_POINTS, Number(config.pointCount) || 9),
  );
  const layout = config.layout ?? 'random';

  return {
    id: mode,
    points: createTrianglePoints(layout, pointCount, width, height),
    layout,
    minPoints: TRIANGLE_MIN_POINTS,
    maxPoints: TRIANGLE_MAX_POINTS,
    pointCount,
    scoreUnitLabel: 'משולשים',
    scoreUnitSingular: 'משולש',
    shapeType: 'triangle',
    canAddEdgeByGeometry(a, b, state, hasEdge) {
      if (a === b || hasEdge(a, b)) {
        return false;
      }

      const start = state.points[a];
      const end = state.points[b];
      const minimumClearance = POINT_RADIUS + 5;

      for (const edge of state.edges) {
        if (edge.a === a || edge.a === b || edge.b === a || edge.b === b) {
          continue;
        }

        if (isIntersecting(start, end, state.points[edge.a], state.points[edge.b])) {
          return false;
        }
      }

      for (let index = 0; index < state.points.length; index += 1) {
        if (index === a || index === b) {
          continue;
        }

        if (pointSegmentDistance(state.points[index], start, end) <= minimumClearance) {
          return false;
        }
      }

      return true;
    },
    getScorePreview(a, b, context) {
      let count = 0;
      const smallerSet = context.neighbors[a].size <= context.neighbors[b].size ? context.neighbors[a] : context.neighbors[b];
      const largerSet = smallerSet === context.neighbors[a] ? context.neighbors[b] : context.neighbors[a];

      for (const c of smallerSet) {
        if (largerSet.has(c) && !context.shapeLookup.has(triangleKey(a, b, c))) {
          count += 1;
        }
      }

      return count;
    },
    addShapesForEdge(a, b, owner, context) {
      const addedShapes = [];
      const smallerSet = context.neighbors[a].size <= context.neighbors[b].size ? context.neighbors[a] : context.neighbors[b];
      const largerSet = smallerSet === context.neighbors[a] ? context.neighbors[b] : context.neighbors[a];

      for (const c of smallerSet) {
        const key = triangleKey(a, b, c);
        if (largerSet.has(c) && !context.shapeLookup.has(key)) {
          const shape = {id: key, owner, type: 'triangle', points: [a, b, c]};
          context.shapeLookup.add(key);
          context.state.shapes.push(shape);
          addedShapes.push(shape);
        }
      }

      return addedShapes;
    },
  };
}

export function createGame(config) {
  const width = config.boardWidth ?? 960;
  const height = config.boardHeight ?? 680;
  const modeDefinition = buildModeDefinition(config, width, height);
  const playerCount = config.players.length;

  const players = config.players.map((player) => ({
    ...player,
    shapeColor: colorWithAlpha(player.color, 0.22),
  }));

  const state = {
    width,
    height,
    pointRadius: POINT_RADIUS,
    minPoints: modeDefinition.minPoints,
    maxPoints: modeDefinition.maxPoints,
    pointCount: modeDefinition.pointCount,
    points: modeDefinition.points,
    edges: [],
    shapes: [],
    players,
    currentPlayer: 0,
    selectedPoint: null,
    scores: new Array(playerCount).fill(0),
    isGameOver: false,
    winnerNames: [],
    layout: modeDefinition.layout,
    mode: modeDefinition.id,
    shapeType: modeDefinition.shapeType,
    scoreUnitLabel: modeDefinition.scoreUnitLabel,
    scoreUnitSingular: modeDefinition.scoreUnitSingular,
    grid: modeDefinition.rows && modeDefinition.cols ? {rows: modeDefinition.rows, cols: modeDefinition.cols} : null,
    moveTimeLimit: Math.max(0, Number(config.moveTimeLimit) || 0),
  };

  const edgeLookup = new Set();
  const shapeLookup = new Set();
  const neighbors = Array.from({length: state.points.length}, () => new Set());
  const legalMoves = new Map();
  const cellsByEdge = new Map();

  if (modeDefinition.cells) {
    for (const cell of modeDefinition.cells) {
      for (const key of cell.edges) {
        if (!cellsByEdge.has(key)) {
          cellsByEdge.set(key, []);
        }
        cellsByEdge.get(key).push(cell);
      }
    }
  }

  const modeContext = {
    state,
    edgeLookup,
    shapeLookup,
    neighbors,
    cellsByEdge,
  };

  function hasEdge(a, b) {
    return edgeLookup.has(edgeKey(a, b));
  }

  function canAddEdgeByGeometry(a, b) {
    return modeDefinition.canAddEdgeByGeometry(a, b, state, hasEdge);
  }

  function canAddEdge(a, b) {
    return legalMoves.has(edgeKey(a, b));
  }

  function initializeLegalMoves() {
    legalMoves.clear();

    for (let a = 0; a < state.points.length; a += 1) {
      for (let b = a + 1; b < state.points.length; b += 1) {
        if (canAddEdgeByGeometry(a, b)) {
          legalMoves.set(edgeKey(a, b), [a, b]);
        }
      }
    }
  }

  function updateLegalMovesAfterEdge(a, b) {
    legalMoves.delete(edgeKey(a, b));

    if (state.mode !== 'triangles') {
      return;
    }

    for (const [key, move] of legalMoves) {
      const [left, right] = move;

      if (left === a || left === b || right === a || right === b) {
        continue;
      }

      if (isIntersecting(state.points[a], state.points[b], state.points[left], state.points[right])) {
        legalMoves.delete(key);
      }
    }
  }

  function createSimulation() {
    const simulationState = {
      edges: state.edges.map((edge) => ({...edge})),
      shapes: state.shapes.map((shape) => ({...shape})),
    };
    const simulationEdgeLookup = new Set(edgeLookup);
    const simulationShapeLookup = new Set(shapeLookup);
    const simulationNeighbors = neighbors.map((neighborSet) => new Set(neighborSet));
    const simulationLegalMoves = new Map(legalMoves);

    return {
      state: simulationState,
      edgeLookup: simulationEdgeLookup,
      shapeLookup: simulationShapeLookup,
      neighbors: simulationNeighbors,
      legalMoves: simulationLegalMoves,
      cellsByEdge,
    };
  }

  function updateSimulationLegalMovesAfterEdge(simulation, a, b) {
    simulation.legalMoves.delete(edgeKey(a, b));

    if (state.mode !== 'triangles') {
      return;
    }

    for (const [key, move] of simulation.legalMoves) {
      const [left, right] = move;

      if (left === a || left === b || right === a || right === b) {
        continue;
      }

      if (isIntersecting(state.points[a], state.points[b], state.points[left], state.points[right])) {
        simulation.legalMoves.delete(key);
      }
    }
  }

  function countSimulationPotentialShapes(simulation, a, b) {
    return modeDefinition.getScorePreview(a, b, simulation);
  }

  function applyMoveToSimulation(simulation, a, b, owner) {
    const key = edgeKey(a, b);

    if (!simulation.legalMoves.has(key)) {
      return null;
    }

    simulation.edgeLookup.add(key);
    simulation.neighbors[a].add(b);
    simulation.neighbors[b].add(a);
    simulation.state.edges.push({a, b, owner});
    updateSimulationLegalMovesAfterEdge(simulation, a, b);
    const newShapes = modeDefinition.addShapesForEdge(a, b, owner, simulation);

    return {
      shapeCount: newShapes.length,
      nextPlayer: newShapes.length > 0 ? owner : (owner + 1) % state.players.length,
      remainingMoves: simulation.legalMoves.size,
    };
  }

  function evaluateMove(a, b, owner, difficulty) {
    const immediateScore = countPotentialShapes(a, b);

    if (difficulty === 'easy') {
      return Math.random();
    }

    if (difficulty === 'medium') {
      return immediateScore * 100 + Math.random() * 8;
    }

    const simulation = createSimulation();
    const simulationResult = applyMoveToSimulation(simulation, a, b, owner);

    if (!simulationResult) {
      return -Infinity;
    }

    const remainingMoves = Array.from(simulation.legalMoves.values());
    let nextBestScore = 0;

    if (simulationResult.nextPlayer !== owner) {
      for (const [nextA, nextB] of remainingMoves) {
        nextBestScore = Math.max(nextBestScore, countSimulationPotentialShapes(simulation, nextA, nextB));
      }
    }

    let pressureScore = 0;
    for (const [nextA, nextB] of remainingMoves) {
      pressureScore += countSimulationPotentialShapes(simulation, nextA, nextB);
    }

    return (
      immediateScore * 1000 +
      (simulationResult.nextPlayer === owner ? 180 : 0) -
      nextBestScore * 120 -
      pressureScore * 4 -
      remainingMoves.length * 0.1 +
      Math.random() * 0.01
    );
  }

  function getPossibleMoves() {
    return Array.from(legalMoves.values());
  }

  function countPotentialShapes(a, b) {
    return modeDefinition.getScorePreview(a, b, modeContext);
  }

  function addShapesForEdge(a, b, owner) {
    const newShapes = modeDefinition.addShapesForEdge(a, b, owner, modeContext);
    return {
      shapeCount: newShapes.length,
      newShapes,
    };
  }

  function getLeaders() {
    const topScore = Math.max(...state.scores);
    return state.players
      .map((player, index) => ({name: player.name, score: state.scores[index]}))
      .filter((player) => player.score === topScore);
  }

  function finishGame() {
    state.isGameOver = true;
    state.winnerNames = getLeaders().map((player) => player.name);
  }

  function applyMove(a, b) {
    if (!canAddEdge(a, b) || state.isGameOver) {
      return {
        ok: false,
        reason: 'illegal',
      };
    }

    const owner = state.currentPlayer;
    edgeLookup.add(edgeKey(a, b));
    neighbors[a].add(b);
    neighbors[b].add(a);
    state.edges.push({a, b, owner});
    updateLegalMovesAfterEdge(a, b);
    state.selectedPoint = null;

    const {shapeCount, newShapes} = addShapesForEdge(a, b, owner);
    state.scores[owner] += shapeCount;

    if (shapeCount === 0) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    }

    if (getPossibleMoves().length === 0) {
      finishGame();
    }

    return {
      ok: true,
      shapeCount,
      scoreDelta: shapeCount,
      newShapes,
      owner,
      nextPlayer: state.currentPlayer,
      gameOver: state.isGameOver,
    };
  }

  function skipTurn(reason = 'timeout') {
    if (state.isGameOver) {
      return {
        ok: false,
        reason: 'game-over',
      };
    }

    state.selectedPoint = null;
    const owner = state.currentPlayer;
    let scoreDelta = 0;

    if (reason === 'timeout') {
      state.scores[owner] -= 1;
      scoreDelta = -1;
    }

    state.currentPlayer = (state.currentPlayer + 1) % state.players.length;

    if (getPossibleMoves().length === 0) {
      finishGame();
    }

    return {
      ok: true,
      skipped: true,
      skipReason: reason,
      scoreDelta,
      owner,
      nextPlayer: state.currentPlayer,
      gameOver: state.isGameOver,
    };
  }

  function choosePointAt(x, y) {
    for (let index = 0; index < state.points.length; index += 1) {
      if (distance({x, y}, state.points[index]) <= POINT_RADIUS + 7) {
        return index;
      }
    }

    return null;
  }

  function getAIMove(difficulty = 'medium') {
    const moves = getPossibleMoves();

    if (!moves.length) {
      finishGame();
      return null;
    }

    if (difficulty === 'easy') {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const owner = state.currentPlayer;
    const scoredMoves = moves
      .map(([a, b]) => ({
        move: [a, b],
        score: evaluateMove(a, b, owner, difficulty),
        immediateScore: countPotentialShapes(a, b),
      }))
      .sort((left, right) => right.score - left.score);

    if (difficulty === 'medium') {
      const highestImmediate = Math.max(...scoredMoves.map((item) => item.immediateScore));
      const strongMoves = scoredMoves.filter((item) => item.immediateScore === highestImmediate).slice(0, 3);
      const pool = strongMoves.length > 0 ? strongMoves : scoredMoves.slice(0, 3);
      return pool[Math.floor(Math.random() * pool.length)].move;
    }

    return scoredMoves[0].move;
  }

  initializeLegalMoves();

  return {
    state,
    canAddEdge,
    choosePointAt,
    applyMove,
    skipTurn,
    getPossibleMoves,
    getAIMove,
    countPotentialShapes,
    offsetPoint,
  };
}
