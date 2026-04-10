const BOARD_BACKGROUND = '#0d1a2b';
const POINT_OUTER = '#f3f1ea';
const POINT_INNER = '#122033';
const HIGHLIGHT = '#ffed9c';

export function createRenderer(canvas, game) {
  const context = canvas.getContext('2d');

  function resize(width, height) {
    canvas.width = width;
    canvas.height = height;
    draw();
  }

  function drawGrid(state) {
    context.save();
    context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    context.lineWidth = 1;

    for (let x = 36; x < state.width; x += 36) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, state.height);
      context.stroke();
    }

    for (let y = 36; y < state.height; y += 36) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(state.width, y);
      context.stroke();
    }

    context.restore();
  }

  function drawBackground(state) {
    const gradient = context.createLinearGradient(0, 0, state.width, state.height);
    gradient.addColorStop(0, '#11243d');
    gradient.addColorStop(0.45, '#10213a');
    gradient.addColorStop(1, '#1d1532');

    context.fillStyle = gradient;
    context.fillRect(0, 0, state.width, state.height);

    drawGrid(state);

    context.save();
    context.fillStyle = 'rgba(255, 255, 255, 0.08)';
    context.beginPath();
    context.arc(state.width * 0.12, state.height * 0.16, 90, 0, Math.PI * 2);
    context.arc(state.width * 0.88, state.height * 0.18, 60, 0, Math.PI * 2);
    context.arc(state.width * 0.78, state.height * 0.82, 120, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawTriangles(state) {
    for (const triangle of state.triangles) {
      const a = state.points[triangle.a];
      const b = state.points[triangle.b];
      const c = state.points[triangle.c];
      context.fillStyle = state.players[triangle.owner].triangleColor;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(c.x, c.y);
      context.closePath();
      context.fill();
    }
  }

  function drawEdges(state) {
    for (const edge of state.edges) {
      const startPoint = state.points[edge.a];
      const endPoint = state.points[edge.b];
      const from = game.offsetPoint(startPoint, endPoint, state.pointRadius + 8);
      const to = game.offsetPoint(endPoint, startPoint, state.pointRadius + 8);
      const edgeGradient = context.createLinearGradient(from.x, from.y, to.x, to.y);
      edgeGradient.addColorStop(0, state.players[edge.owner].color);
      edgeGradient.addColorStop(1, '#ffffff');

      context.strokeStyle = edgeGradient;
      context.shadowColor = `${state.players[edge.owner].color}88`;
      context.shadowBlur = 12;
      context.lineWidth = 4;
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    context.shadowBlur = 0;
  }

  function drawPoints(state) {
    for (const point of state.points) {
      context.fillStyle = BOARD_BACKGROUND;
      context.beginPath();
      context.arc(point.x, point.y, state.pointRadius + 6, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = POINT_OUTER;
      context.beginPath();
      context.arc(point.x, point.y, state.pointRadius + 2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = POINT_INNER;
      context.beginPath();
      context.arc(point.x, point.y, state.pointRadius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawSelection(state) {
    if (state.selectedPoint === null) {
      return;
    }

    const point = state.points[state.selectedPoint];
    context.strokeStyle = HIGHLIGHT;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(point.x, point.y, state.pointRadius + 9, 0, Math.PI * 2);
    context.stroke();
  }

  function draw() {
    const {state} = game;
    context.clearRect(0, 0, state.width, state.height);
    drawBackground(state);
    drawTriangles(state);
    drawEdges(state);
    drawPoints(state);
    drawSelection(state);
  }

  return {
    draw,
    resize,
  };
}
