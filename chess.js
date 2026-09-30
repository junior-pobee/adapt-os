/* ================================================================
   Chess Game — full rules engine + simple AI minimax bot
   Modes: 1 player (vs bot, 3 difficulties) or 2 players (hotseat)
   ================================================================ */

// ---------- Constants ----------
const UI_PIECES = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗',
    n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝',
    n: '♞', p: '♟' }
};
const VALUES = { p: 100, n: 320, b: 330,
  r: 500, q: 900, k: 20000 };
const backRank = ['r', 'n', 'b', 'q',
  'k', 'b', 'n', 'r'
];

// ---------- Game State ----------
let
board; // 8x8, board[row][col] = {t,type, c,color} or null. row0 = black side.
let turn; // 'w' | 'b'
let selected; // [r,c] selected square
let
legalTargets; // list of {r,c} legal destinations for selected
let lastMove; // {from:[r,c], to:[r,c]}
let gameOver;
let mode; // '1p' | '2p'
let playerColor; // for 1p: 'w' or 'b'
let botDepth; // 1..3
let castleRights; // {wK,wQ,bK,bQ}
let
enPassant; // [r,c] target square or null
let captured = { w: [],
b: [] }; // captured[color] = list of piece types captured BY that color
let botThinking = false;

const boardEl = document.getElementById(
  'board');
const statusEl = document
  .getElementById('status');
const capturedEl = document
  .getElementById('captured');

// ---------- Setup ----------
function newGame() {
  board = Array.from({ length: 8 },
  () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = { t: backRank[c],
      c: 'b' };
    board[1][c] = { t: 'p', c: 'b' };
    board[6][c] = { t: 'p', c: 'w' };
    board[7][c] = { t: backRank[c],
      c: 'w' };
  }
  turn = 'w';
  selected = null;
  legalTargets = [];
  lastMove = null;
  gameOver = false;
  castleRights = { wK: true, wQ: true,
    bK: true, bQ: true };
  enPassant = null;
  captured = { w: [], b: [] };
  botThinking = false;
  setStatus();
  render();
  updateCaptured();
  maybeBotMove();
}

// ---------- Move Generation ----------
function inBounds(r, c) { return r >=
    0 && r < 8 && c >= 0 && c < 8; }

function pieceAt(r,
c) { return inBounds(r, c) ? board[r][
    c] : null; }

function isMyPiece(p,
color) { return p && p.c === color; }

function pseudoMoves(r, c) {
  const p = board[r][c];
  if (!p) return [];
  const moves = [];
  const add = (rr, cc, special) => {
    const target = pieceAt(rr, cc);
    if (!inBounds(rr, cc))
    return false;
    if (target && target.c === p.c)
      return false;
    moves.push({ r: rr, c: cc,
        ep: special === 'ep',
        castle: special ===
        'castle' });
    return !
    target; // continue sliding only if empty
  };
  
  if (p.t === 'p') {
    const dir = p.c === 'w' ? -1 : 1;
    const startRow = p.c === 'w' ? 6 :
    1;
    // forward
    if (!pieceAt(r + dir, c)) {
      moves.push({ r: r + dir, c });
      if (r === startRow && !pieceAt(r +
          2 * dir, c))
        moves.push({ r: r + 2 * dir, c,
          double: true });
    }
    // captures
    for (const dc of [-1, 1]) {
      const rr = r + dir,
        cc = c + dc;
      const t = pieceAt(rr, cc);
      if (t && t.c !== p.c) moves
    .push({ r: rr, c: cc });
      else if (enPassant && enPassant[
        0] === rr && enPassant[1] === cc
        )
        moves.push({ r: rr, c: cc,
          ep: true });
    }
    return moves;
  }
  
  if (p.t === 'n') {
    for (const [dr, dc] of [
        [1, 2],
        [2, 1],
        [-1, 2],
        [-2, 1],
        [1, -2],
        [2, -1],
        [-1, -2],
        [-2, -1]
      ])
      add(r + dr, c + dc);
    return moves;
  }
  
  if (p.t === 'k') {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr || dc) add(r + dr, c +
          dc);
    // castling (checked for legality later via king-safety filter)
    if (p.c === 'w' && r === 7 && c ===
      4) {
      if (castleRights.wK && !board[7][
          5] && !board[7][6]) moves
        .push({ r: 7, c: 6,
          castle: 'K' });
      if (castleRights.wQ && !board[7][
          3] && !board[7][2] && !board[
          7][1]) moves.push({ r: 7,
        c: 2, castle: 'Q' });
    }
    if (p.c === 'b' && r === 0 && c ===
      4) {
      if (castleRights.bK && !board[0][
          5] && !board[0][6]) moves
        .push({ r: 0, c: 6,
          castle: 'K' });
      if (castleRights.bQ && !board[0][
          3] && !board[0][2] && !board[
          0][1]) moves.push({ r: 0,
        c: 2, castle: 'Q' });
    }
    return moves;
  }
  
  const sliders = {
    r: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ],
    b: [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ],
    q: [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1]
    ]
  };
  for (const [dr, dc] of sliders[p.t]) {
    let rr = r + dr,
      cc = c + dc;
    while (add(rr, cc)) { rr += dr;
      cc += dc; }
  }
  return moves;
}

function kingPos(color) {
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.t === 'k' && p.c ===
        color) return [r, c];
    }
  return null;
}

function attackedBy(r, c, byColor) {
  // pawn attacks
  const dir = byColor === 'w' ? -1 : 1;
  for (const dc of [-1, 1]) {
    const p = pieceAt(r + dir, c + dc);
    if (p && p.c === byColor && p.t ===
      'p') return true;
  }
  // knights
  for (const [dr, dc] of [
      [1, 2],
      [2, 1],
      [-1, 2],
      [-2, 1],
      [1, -2],
      [2, -1],
      [-1, -2],
      [-2, -1]
    ]) {
    const p = pieceAt(r + dr, c + dc);
    if (p && p.c === byColor && p.t ===
      'n') return true;
  }
  // king
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      if (dr || dc) {
        const p = pieceAt(r + dr, c +
          dc);
        if (p && p.c === byColor && p
          .t === 'k') return true;
      }
  // sliders
  const rays = [
    ...[
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ],
    ['r', null], null
  ].filter(Boolean);
  const lineRays = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];
  const diagRays = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];
  const scan = (raysArr, types) => {
    for (const [dr, dc] of raysArr) {
      let rr = r + dr,
        cc = c + dc;
      while (inBounds(rr, cc)) {
        const p = board[rr][cc];
        if (p) {
          if (p.c === byColor && types
            .includes(p.t))
          return true;
          break;
        }
        rr += dr;
        cc += dc;
      }
    }
    return false;
  };
  if (scan(lineRays, ['r', 'q']))
  return true;
  if (scan(diagRays, ['b', 'q']))
  return true;
  return false;
}

function inCheck(color) {
  const k = kingPos(color);
  return k ? attackedBy(k[0], k[1],
    color === 'w' ? 'b' : 'w') : false;
}

function legalMovesFrom(r, c) {
  const p = board[r][c];
  if (!p || p.c !== turn) return [];
  return pseudoMoves(r, c).filter(m => {
    const undo = applyMove(r, c, m,
      true);
    const ok = !inCheck(p.c);
    undo.undo();
    return ok;
  });
}

function allLegalMoves(color) {
  const out = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.c === color)
        for (const m of legalMovesFrom(
            r, c))
          out.push({ from: [r, c], to: [
              m.r, m.c
            ], m });
    }
  return out;
}

// ---------- Apply / Undo ----------
// makeMove: real move (updates state). Returns info for move history if needed.
function applyMove(r, c, m, silent) {
  const p = board[r][c];
  const target = board[m.r][m.c];
  const prev = {
    p,
    target,
    rights: { ...castleRights },
    enPassant,
    moveCell: { r: m.r, c: m.c },
    from: [r, c]
  };
  
  // en passant capture
  if (p.t === 'p' && m.ep) {
    const capRow = p.c === 'w' ? m.r +
      1 : m.r - 1;
    prev.epCaptured = board[capRow][m
    .c];
    board[capRow][m.c] = null;
  }
  
  board[m.r][m.c] = p;
  board[r][c] = null;
  
  // en passant target for next turn
  enPassant = m.double ? [r + (p.c ===
    'w' ? -1 : 1), c] : null;
  
  // castling: move rook
  if (m.castle) {
    if (m.castle === 'K') {
      board[m.r][5] = board[m.r][7];
      board[m.r][7] = null;
    } else {
      board[m.r][3] = board[m.r][0];
      board[m.r][0] = null;
    }
  }
  
  // update castling rights
  if (p.t === 'k') {
    if (p.c === 'w') { castleRights.wK =
        false;
      castleRights.wQ = false; }
    else { castleRights.bK = false;
      castleRights.bQ = false; }
  }
  if (p.t === 'r') {
    if (p.c === 'w') {
      if (r === 7 && c === 0)
        castleRights.wQ = false;
      if (r === 7 && c === 7)
        castleRights.wK = false;
    } else {
      if (r === 0 && c === 0)
        castleRights.bQ = false;
      if (r === 0 && c === 7)
        castleRights.bK = false;
    }
  }
  if (target && target.t === 'r') {
    if (m.r === 7 && m.c === 0)
      castleRights.wQ = false;
    if (m.r === 7 && m.c === 7)
      castleRights.wK = false;
    if (m.r === 0 && m.c === 0)
      castleRights.bQ = false;
    if (m.r === 0 && m.c === 7)
      castleRights.bK = false;
  }
  
  return {
    undo: () => {
      board[r][c] = p;
      board[m.r][m.c] = target;
      if (prev.epCaptured)
        board[p.c === 'w' ? m.r + 1 :
          m.r - 1][m.c] = prev
        .epCaptured;
      castleRights = prev.rights;
      enPassant = prev.enPassant;
      if (m.castle === 'K') {
        board[m.r][7] = board[m.r][5];
        board[m.r][5] = null;
      } else if (m.castle === 'Q') {
        board[m.r][0] = board[m.r][3];
        board[m.r][3] = null;
      }
    }
  };
}

function move(mr, mc, fromR, fromC,
  meta) {
  const p = board[fromR][fromC];
  const victim = board[mr][mc];
  
  // simulate & commit via applyMove style, but handle promotion
  if (victim) captured[turn].push(victim
    .t);
  if (p.t === 'p' && meta.ep) {
    const capRow = p.c === 'w' ? mr +
      1 : mr - 1;
    if (board[capRow][mc]) captured[
      turn].push(board[capRow][mc].t);
    board[capRow][mc] = null;
  }
  board[mr][mc] = p;
  board[fromR][fromC] = null;
  
  enPassant = meta.double ? [fromR + (p
      .c === 'w' ? -1 : 1), fromC] :
    null;
  
  if (meta.castle === 'K') { board[mr][
      5] = board[mr][7];
    board[mr][7] = null; }
  if (meta.castle === 'Q') { board[mr][
      3] = board[mr][0];
    board[mr][0] = null; }
  
  if (p.t === 'k') {
    if (p.c === 'w') { castleRights.wK =
        castleRights.wQ = false; }
    else { castleRights.bK =
        castleRights.bQ = false; }
  }
  if (p.t === 'r') {
    if (p.c === 'w' && fromR === 7 &&
      fromC === 0) castleRights.wQ =
      false;
    if (p.c === 'w' && fromR === 7 &&
      fromC === 7) castleRights.wK =
      false;
    if (p.c === 'b' && fromR === 0 &&
      fromC === 0) castleRights.bQ =
      false;
    if (p.c === 'b' && fromR === 0 &&
      fromC === 7) castleRights.bK =
      false;
  }
  
  // promotion: auto-queen for players & bot
  if (p.t === 'p' && (mr === 0 || mr ===
      7)) p.t = 'q';
  
  lastMove = { from: [fromR, fromC],
    to: [mr, mc] };
  turn = turn === 'w' ? 'b' : 'w';
  
  render();
  updateCaptured();
  
  // game over?
  const moves = allLegalMoves(turn);
  if (moves.length === 0) {
    if (inCheck(turn)) {
      gameOver = true;
      const winner = turn === 'w' ?
        'Black' : 'White';
      setStatus(
        `Checkmate! ${winner} wins 🎉`
        );
    } else {
      gameOver = true;
      setStatus('Draw — stalemate 🤝');
    }
  } else if (inCheck(turn)) {
    setStatus(
      `${turn === 'w' ? 'White' : 'Black'}'s turn — CHECK!`
      );
  } else {
    setStatus();
  }
  
  if (!gameOver) maybeBotMove();
}

// ---------- Rendering ----------
function render() {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement(
        'div');
      sq.className = 'sq ' + ((r + c) %
        2 === 0 ? 'light' : 'dark');
      const p = board[r][c];
      if (p) sq.textContent = UI_PIECES[
        p.c][p.t];
      if (selected && selected[0] ===
        r && selected[1] === c) sq
        .classList.add('sel');
      if (legalTargets.some(m => m.r ===
          r && m.c === c)) sq.classList
        .add('legal');
      if (lastMove &&
        ((lastMove.from[0] === r &&
            lastMove.from[1] === c) ||
          (lastMove.to[0] === r &&
            lastMove.to[1] === c)))
        sq.classList.add('lastmove');
      sq.dataset.r = r;
      sq.dataset.c = c;
      boardEl.appendChild(sq);
    }
  }
}

function updateCaptured() {
  const glyph = t => ({ p: '♟', n: '♞',
    b: '♝', r: '♜', q: '♛' })[t];
  const w = captured.w.map(glyph).join(
    ''
    ); // pieces white captured (black pieces)
  const b = captured.b.map(glyph).join(
    ''
    ); // pieces black captured (white pieces)
  capturedEl.textContent = (b ?
      'White took: ' + b + '   ' : '') +
    (w ? 'Black took: ' + w : '');
}

function setStatus(msg) {
  if (msg) { statusEl.textContent =
    msg; return; }
  statusEl.textContent =
    `${turn === 'w' ? "White" : "Black"}'s turn`;
}

// ---------- Click handling ----------
boardEl.addEventListener('click', e => {
  if (gameOver || botThinking)
    return;
  if (mode === '1p' && turn !==
    playerColor) return;
  const sq = e.target.closest(
  '.sq');
  if (!sq) return;
  const r = +sq.dataset.r,
    c = +sq.dataset.c;
  
  if (selected) {
    const mv = legalTargets.find(
      m => m.r === r && m.c === c);
    if (mv) {
      const [fr, fc] = selected;
      selected = null;
      legalTargets = [];
      move(r, c, fr, fc, mv);
      return;
    }
  }
  const p = pieceAt(r, c);
  if (p && p.c === turn) {
    selected = [r, c];
    legalTargets = legalMovesFrom(r,
      c).map(m => ({ ...m }));
    render();
  } else {
    selected = null;
    legalTargets = [];
    render();
  }
});

// ---------- Bot (minimax + alpha-beta) ----------
function evalBoard() {
  let score = 0;
  // material + tiny piece-square flavor (center preference)
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      let v = VALUES[p.t];
      if (p.t !== 'k') {
        const center = 6 - (Math.abs(
          3.5 - r) + Math.abs(3.5 -
          c));
        v += center;
      }
      score += p.c === 'w' ? v : -v;
    }
  return score; // from white's perspective
}

function negamax(color, depth, alpha,
  beta) {
  if (depth === 0) return (color ===
    'w' ? 1 : -1) * evalBoard();
  const moves = allLegalMoves(color);
  if (moves.length === 0)
    return inCheck(color) ? -99999 : 0;
  let best = -Infinity;
  for (const mv of moves) {
    const undo = applyMove(mv.from[0],
      mv.from[1], mv.m, true);
    // bot promotions (auto-queen in applyMove? promo not applied there; fine for eval)
    const sc = -negamax(color === 'w' ?
      'b' : 'w', depth - 1, -beta, -
      alpha);
    undo.undo();
    if (sc > best) best = sc;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function botMove() {
  const color = turn;
  const moves = allLegalMoves(color);
  if (!moves.length) return;
  let best = [],
    bestScore = -Infinity;
  // shuffle for variety
  moves.sort(() => Math.random() - 0.5);
  for (const mv of moves) {
    const undo = applyMove(mv.from[0],
      mv.from[1], mv.m, true);
    // bot promotion handled: if pawn reaches last rank, promote to queen
    const pawn = board[mv.to[0]][mv.to[
      1]];
    let promoChange = null;
    if (pawn && pawn.t === 'p' && (mv
        .to[0] === 0 || mv.to[0] === 7
        )) {
      pawn.t = 'q';
      promoChange = 'p';
    }
    const sc = -negamax(color === 'w' ?
        'b' : 'w', botDepth - 1, -
        Infinity, Infinity) + Math
      .random() * 5;
    if (promoChange) pawn.t =
      promoChange;
    undo.undo();
    if (sc > bestScore) { bestScore =
      sc;
      best = [mv]; }
  }
  const mv = best[0] || moves[0];
  const [fr, fc] = mv.from;
  move(mv.to[0], mv.to[1], fr, fc, mv
  .m);
}

function maybeBotMove() {
  if (gameOver || mode !== '1p' ||
    turn === playerColor) return;
  botThinking = true;
  setStatus('Bot is thinking… 🤔');
  setTimeout(() => {
    botMove();
    botThinking = false;
  }, 400);
}

// ---------- UI wiring ----------
document.getElementById('btn-1p')
  .addEventListener('click', () => {
    document.getElementById(
      'bot-level').classList.toggle(
      'hidden');
  });
document.getElementById('btn-2p')
  .addEventListener('click', () => {
    mode = '2p';
    document.getElementById('menu')
      .classList.add('hidden');
    document.getElementById('game')
      .classList.remove('hidden');
    newGame();
  });
document.getElementById('bot-start')
  .addEventListener('click', () => {
    mode = '1p';
    botDepth = +document
      .getElementById('depth').value;
    playerColor = document
      .getElementById(
        'player-is-black').checked ?
      'b' : 'w';
    document.getElementById('menu')
      .classList.add('hidden');
    document.getElementById('game')
      .classList.remove('hidden');
    newGame();
  });
document.getElementById('btn-restart')
  .addEventListener('click', newGame);
document.getElementById('btn-menu')
  .addEventListener('click', () => {
    document.getElementById('game')
      .classList.add('hidden');
    document.getElementById('menu')
      .classList.remove('hidden');
  });