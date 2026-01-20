import './style.css'

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  [0, 4, 8],
  [2, 4, 6],
]

/**
 * Returns the winning line (array of indices) if there is a winner; otherwise null.
 * @param {Array<('X'|'O'|null)>} board
 * @returns {number[] | null}
 */
function getWinningLine(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return [a, b, c]
  }
  return null
}

/**
 * Returns 'X' or 'O' if there is a winner, otherwise null.
 * @param {Array<('X'|'O'|null)>} board
 * @returns {'X'|'O'|null}
 */
function getWinner(board) {
  const line = getWinningLine(board)
  return line ? board[line[0]] : null
}

/**
 * Returns true if the board is full and there is no winner.
 * @param {Array<('X'|'O'|null)>} board
 * @returns {boolean}
 */
function isDraw(board) {
  return board.every((c) => c !== null) && !getWinner(board)
}

/**
 * Creates a DOM element with attributes and children.
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param  {...any} children
 * @returns {HTMLElement}
 */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v
    else if (k === 'dataset') Object.assign(el.dataset, v)
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v)
    else if (v === true) el.setAttribute(k, '')
    else if (v !== false && v != null) el.setAttribute(k, String(v))
  }
  for (const child of children.flat()) {
    if (child == null) continue
    if (typeof child === 'string') el.appendChild(document.createTextNode(child))
    else el.appendChild(child)
  }
  return el
}

const state = {
  board: /** @type {Array<('X'|'O'|null)>} */ (Array(9).fill(null)),
  current: /** @type {'X'|'O'} */ ('X'),
  winner: /** @type {'X'|'O'|null} */ (null),
  winningLine: /** @type {number[]|null} */ (null),
  moveCount: 0,
}

const app = document.querySelector('#app')

const statusEl = h('div', { class: 'status', role: 'status', 'aria-live': 'polite' })
const hintEl = h(
  'p',
  { class: 'hint' },
  'Tip: Use Tab/Shift+Tab to focus a square and press Enter/Space to place a mark.'
)

const gridEl = h('div', {
  class: 'board',
  role: 'grid',
  'aria-label': 'Tic Tac Toe board',
})

/** @type {HTMLButtonElement[]} */
const cellButtons = []

for (let i = 0; i < 9; i += 1) {
  const btn = /** @type {HTMLButtonElement} */ (
    h(
      'button',
      {
        class: 'cell',
        type: 'button',
        role: 'gridcell',
        'aria-label': `Cell ${i + 1}`,
        dataset: { idx: String(i) },
      },
      ''
    )
  )

  btn.addEventListener('click', () => handleMove(i))

  // Improve keyboard navigation: keep default button behavior but also allow Enter/Space
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleMove(i)
    }
  })

  cellButtons.push(btn)
  gridEl.appendChild(btn)
}

const resetBtn = /** @type {HTMLButtonElement} */ (
  h('button', { class: 'btn btn-primary', type: 'button' }, 'Restart')
)
resetBtn.addEventListener('click', () => resetGame())

const clearBtn = /** @type {HTMLButtonElement} */ (
  h('button', { class: 'btn btn-ghost', type: 'button', title: 'Clear board and stats' }, 'New Match')
)
clearBtn.addEventListener('click', () => resetGame(true))

const footerEl = h(
  'div',
  { class: 'footer' },
  h('div', { class: 'actions' }, resetBtn, clearBtn),
  h(
    'div',
    { class: 'meta' },
    h('span', { class: 'pill', id: 'moveCountPill' }, 'Moves: 0'),
    h('span', { class: 'pill', id: 'modePill' }, 'Two players')
  )
)

const cardEl = h(
  'main',
  { class: 'card', role: 'main' },
  h(
    'header',
    { class: 'header' },
    h('h1', { class: 'title' }, 'Tic Tac Toe'),
    h('p', { class: 'subtitle' }, 'Two players, one device. Play X vs O.')
  ),
  h('section', { class: 'panel' }, statusEl, hintEl),
  h('section', { class: 'game' }, gridEl),
  footerEl
)

app.innerHTML = ''
app.appendChild(cardEl)

const moveCountPill = /** @type {HTMLElement} */ (document.querySelector('#moveCountPill'))

function updateStatus() {
  if (state.winner) {
    statusEl.innerHTML = `Winner: <strong>${state.winner}</strong>`
    statusEl.classList.add('status--done')
    statusEl.classList.remove('status--draw')
    return
  }
  if (isDraw(state.board)) {
    statusEl.textContent = `It's a draw.`
    statusEl.classList.add('status--done', 'status--draw')
    return
  }
  statusEl.innerHTML = `Turn: <strong>${state.current}</strong>`
  statusEl.classList.remove('status--done', 'status--draw')
}

function render() {
  moveCountPill.textContent = `Moves: ${state.moveCount}`

  const winSet = new Set(state.winningLine ?? [])
  for (let i = 0; i < 9; i += 1) {
    const v = state.board[i]
    const btn = cellButtons[i]
    btn.textContent = v ?? ''
    btn.dataset.value = v ?? ''
    btn.disabled = Boolean(v) || Boolean(state.winner) || isDraw(state.board)

    btn.classList.toggle('cell--x', v === 'X')
    btn.classList.toggle('cell--o', v === 'O')
    btn.classList.toggle('cell--win', winSet.has(i))

    const labelValue = v ? `, ${v}` : ', empty'
    btn.setAttribute('aria-label', `Cell ${i + 1}${labelValue}`)
  }

  // Keep focus reasonable after game ends
  resetBtn.disabled = false
  clearBtn.disabled = false

  updateStatus()
}

function handleMove(idx) {
  if (state.winner) return
  if (state.board[idx]) return
  if (isDraw(state.board)) return

  state.board[idx] = state.current
  state.moveCount += 1

  const winningLine = getWinningLine(state.board)
  if (winningLine) {
    state.winner = state.current
    state.winningLine = winningLine
  } else if (!isDraw(state.board)) {
    state.current = state.current === 'X' ? 'O' : 'X'
  }

  render()
}

function resetGame(hard = false) {
  state.board = Array(9).fill(null)
  state.current = 'X'
  state.winner = null
  state.winningLine = null
  state.moveCount = hard ? 0 : 0 // reserved for future stats; keep explicit

  render()

  // Put focus back to first cell for fast replay
  cellButtons[0]?.focus()
}

// Initial render
render()
