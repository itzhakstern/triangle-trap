const POINT_RADIUS = 8;
const MIN_POINTS = 6;
const MAX_POINTS = 14;

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

function createPointsByLayout(layout, count, width, height) {
  switch (layout) {
    case 'circle':
      return createCirclePoints(count, width, height);
    case 'wave':
      return createWavePoints(count, width, height);
    default:
      return createRandomPoints(count, width, height);
  }
}

export function createGame(config) {
  const width = config.boardWidth ?? 960;
  const height = config.boardHeight ?? 680;
  const playerCount = config.players.length;
  const pointCount = Math.min(MAX_POINTS, Math.max(MIN_POINTS, Number(config.pointCount) || 9));
  const layout = config.layout ?? 'random';

  const players = config.players.map((player) => ({
    ...player,
    triangleColor: colorWithAlpha(player.color, 0.22),
  }));

  const state = {
    width,
    height,
    pointRadius: POINT_RADIUS,
    minPoints: MIN_POINTS,
    maxPoints: MAX_POINTS,
    points: createPointsByLayout(layout, pointCount, width, height),
    edges: [],
    triangles: [],
    players,
    currentPlayer: 0,
    selectedPoint: null,
    scores: new Array(playerCount).fill(0),
    isGameOver: false,
    winnerNames: [],
    layout,
  };

  const edgeLookup = new Set();
  const triangleLookup = new Set();
  const neighbors = Array.from({length: state.points.length}, () => new Set());
  const legalMoves = new Map();

  function hasEdge(a, b) {
    return edgeLookup.has(edgeKey(a, b));
  }

  function triangleExists(a, b, c) {
    return triangleLookup.has(triangleKey(a, b, c));
  }

  function canAddEdgeByGeometry(a, b) {
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

  function getPossibleMoves() {
    return Array.from(legalMoves.values());
  }

  function countPotentialTriangles(a, b) {
    let count = 0;

    const smallerSet = neighbors[a].size <= neighbors[b].size ? neighbors[a] : neighbors[b];
    const largerSet = smallerSet === neighbors[a] ? neighbors[b] : neighbors[a];

    for (const c of smallerSet) {
      if (largerSet.has(c) && !triangleExists(a, b, c)) {
        count += 1;
      }
    }

    return count;
  }

  function addTrianglesForEdge(a, b, owner) {
    let added = 0;
    const newTriangles = [];

    const smallerSet = neighbors[a].size <= neighbors[b].size ? neighbors[a] : neighbors[b];
    const largerSet = smallerSet === neighbors[a] ? neighbors[b] : neighbors[a];

    for (const c of smallerSet) {
      if (largerSet.has(c) && !triangleExists(a, b, c)) {
        const triangle = {a, b, c, owner};
        state.triangles.push(triangle);
        triangleLookup.add(triangleKey(a, b, c));
        newTriangles.push(triangle);
        added += 1;
      }
    }

    return {
      triangleCount: added,
      newTriangles,
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
    const {triangleCount, newTriangles} = addTrianglesForEdge(a, b, owner);
    state.scores[owner] += triangleCount;

    if (triangleCount === 0) {
      state.currentPlayer = (state.currentPlayer + 1) % state.players.length;
    }

    if (getPossibleMoves().length === 0) {
      finishGame();
    }

    return {
      ok: true,
      triangleCount,
      scoreDelta: triangleCount,
      newTriangles,
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

  function getAIMove() {
    const moves = getPossibleMoves();

    if (!moves.length) {
      finishGame();
      return null;
    }

    let bestScore = -1;
    const bestMoves = [];

    for (const [a, b] of moves) {
      const score = countPotentialTriangles(a, b);
      if (score > bestScore) {
        bestScore = score;
        bestMoves.length = 0;
        bestMoves.push([a, b]);
      } else if (score === bestScore) {
        bestMoves.push([a, b]);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }

  initializeLegalMoves();

  return {
    state,
    canAddEdge,
    choosePointAt,
    applyMove,
    getPossibleMoves,
    getAIMove,
    countPotentialTriangles,
    offsetPoint,
  };
}
