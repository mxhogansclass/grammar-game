// ═══════════════════════════════════════════════
//  grammar-game/js/core.js
//  Shared logic: student identity, storage, scoring
//  Includes Google Sheets integration
// ═══════════════════════════════════════════════

const GG = (() => {

  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzm6xsCSVPYyD49_Z3oDTQsFrg6R3QiU0GRX_3SPEJvSqZoq7PgJl9pyg9MWX1PneDMrA/exec';
  const SECRET    = 'cricket26';

  // ── Storage helpers ──────────────────────────
  const PREFIX = 'gg_';

  function save(key, val) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch(e){}
  }
  function load(key, def=null) {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v === null ? def : JSON.parse(v);
    } catch(e) { return def; }
  }

  // ── Student identity ─────────────────────────
  function getStudent() {
    return load('student', null);
  }
  function setStudent(block, name) {
    const s = { block: block.toUpperCase(), name: name.trim() };
    save('student', s);
    return s;
  }

  // ── Worksheet scores ─────────────────────────
  function getScores() { return load('scores', {}); }
  function saveScore(worksheetId, points, total) {
    const scores = getScores();
    if (!scores[worksheetId] || points > scores[worksheetId].points) {
      scores[worksheetId] = { points, total, completedAt: Date.now() };
      save('scores', scores);
    }
    return scores;
  }
  function getTotalPoints() {
    return Object.values(getScores()).reduce((sum, s) => sum + s.points, 0);
  }

  // ── Local leaderboard ────────────────────────
  function submitToLeaderboard(student, points) {
    const board = load('leaderboard', {});
    const key = `${student.block}__${student.name}`;
    board[key] = { block: student.block, name: student.name, points, ts: Date.now() };
    save('leaderboard', board);
  }
  function getLeaderboard() {
    return load('leaderboard', {});
  }

  // ── Local block totals ───────────────────────
  function getBlockTotals() {
    const board = getLeaderboard();
    const totals = { A: 0, D: 0, F: 0 };
    Object.values(board).forEach(r => {
      if (totals[r.block] !== undefined) totals[r.block] += r.points;
    });
    return totals;
  }

  // ── Google Sheets: submit score ──────────────
  // Uses image GET trick to avoid CORS issues
  function submitToSheet(student, worksheetId, points) {
    if (!student) return;
    const params = new URLSearchParams({
      secret:    SECRET,
      name:      student.name,
      block:     student.block,
      worksheet: worksheetId,
      points:    points,
      total:     getTotalPoints()
    });
    const img = new Image();
    img.src = SHEET_URL + '?' + params.toString();
  }

  // ── Google Sheets: fetch live totals ─────────
  async function fetchLiveTotals() {
    try {
      const res  = await fetch(SHEET_URL + '?t=' + Date.now());
      const data = await res.json();
      if (data.success && data.totals) return data.totals;
    } catch(e) {
      console.log('Could not reach sheet, using local totals');
    }
    return getBlockTotals();
  }

  // ── Scoreboard bar renderer ───────────────────
  function renderScoreboardBar() {
    const el = document.querySelector('.scoreboard-bar');
    if (!el) return;
    const t = getBlockTotals();
    el.innerHTML = `<span style="letter-spacing:.06em;font-size:.8rem;opacity:.7">CLASS TOTALS:</span>
      ${['A','D','F'].map(b =>
        `<span class="block-score">
          <span class="block-label">Block ${b}</span>
          <span style="font-size:1.3rem">${t[b]}</span>
          <span class="pts">pts</span>
        </span>`
      ).join('<span style="opacity:.3">|</span>')}
    `;
  }

  // ── Init student ID widget ────────────────────
  function initStudentWidget(onReady) {
    const wrap = document.getElementById('student-id-section');
    if (!wrap) { onReady && onReady(getStudent()); return; }

    const existing = getStudent();

    wrap.innerHTML = `
      <div class="field">
        <label for="gg-block">Your Block</label>
        <select id="gg-block">
          <option value="">— select —</option>
          <option value="A">Block A</option>
          <option value="D">Block D</option>
          <option value="F">Block F</option>
        </select>
      </div>
      <div class="field">
        <label for="gg-name">Your First Name</label>
        <input id="gg-name" type="text" placeholder="e.g. Jordan" maxlength="40">
      </div>
      <div class="field" style="flex:0">
        <label>&nbsp;</label>
        <button id="gg-save-id" class="submit-btn" style="padding:6px 18px;font-size:.88rem">Save</button>
      </div>
      <div id="gg-id-status" style="font-size:.83rem;color:var(--correct);align-self:flex-end;padding-bottom:6px"></div>
    `;

    if (existing) {
      document.getElementById('gg-block').value = existing.block;
      document.getElementById('gg-name').value  = existing.name;
      document.getElementById('gg-id-status').textContent = '✓ Saved';
    }

    document.getElementById('gg-save-id').addEventListener('click', () => {
      const block = document.getElementById('gg-block').value;
      const name  = document.getElementById('gg-name').value.trim();
      if (!block || !name) {
        alert('Please enter your Block and your first name.'); return;
      }
      const s = setStudent(block, name);
      document.getElementById('gg-id-status').textContent = '✓ Saved';
      onReady && onReady(s);
    });

    if (existing) onReady && onReady(existing);
  }

  // ── Worksheet runner ─────────────────────────
  function runWorksheet({ worksheetId, questions, pointsEach, onComplete }) {
    let student = getStudent();
    let answers = new Array(questions.length).fill(null);
    let locked  = new Array(questions.length).fill(false);

    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const submitBtn    = document.getElementById('submit-btn');
    const resultsPanel = document.getElementById('results-panel');

    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    questions.forEach((q, qi) => {
      const block = document.createElement('div');
      block.className = 'question-block';
      block.id = `q-${qi}`;
      block.innerHTML = `
        <div class="question-num">Question ${qi+1} of ${questions.length}</div>
        <div class="question-text">${q.text}</div>
        <div class="choices" id="choices-${qi}">
          ${q.choices.map((c,ci) => `
            <button class="choice-btn" data-qi="${qi}" data-ci="${ci}">
              <span class="choice-letter">${c.label}</span>
              ${c.text}
            </button>
          `).join('')}
        </div>
        <div class="feedback" id="fb-${qi}"></div>
      `;
      container.appendChild(block);
    });

    container.addEventListener('click', e => {
      const btn = e.target.closest('.choice-btn');
      if (!btn) return;
      const qi = +btn.dataset.qi;
      const ci = +btn.dataset.ci;
      if (locked[qi]) return;

      locked[qi] = true;
      answers[qi] = ci;

      const choicesDiv = document.getElementById(`choices-${qi}`);
      const qBlock     = document.getElementById(`q-${qi}`);
      const fbDiv      = document.getElementById(`fb-${qi}`);
      const isCorrect  = ci === questions[qi].correct;

      choicesDiv.querySelectorAll('.choice-btn').forEach((b,i) => {
        b.disabled = true;
        if (i === questions[qi].correct) b.classList.add('correct');
        if (i === ci && !isCorrect)       b.classList.add('wrong');
        if (i === ci) b.classList.add('selected');
      });

      qBlock.classList.add(isCorrect ? 'answered-correct' : 'answered-wrong');

      fbDiv.className = `feedback show ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;
      fbDiv.innerHTML = (isCorrect ? '✓ Correct! ' : '✗ Not quite. ') + (questions[qi].explanation || '');

      updateProgress();
    });

    function updateProgress() {
      const done = locked.filter(Boolean).length;
      const pct  = Math.round((done / questions.length) * 100);
      if (progressFill) progressFill.style.width = pct + '%';
      if (progressText) progressText.textContent  = `${done} of ${questions.length} answered`;
      if (submitBtn) submitBtn.disabled = done < questions.length;
    }

    updateProgress();

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (locked.some(l => !l)) {
          alert('Please answer all questions before submitting.'); return;
        }

        const correct = answers.filter((a,i) => a === questions[i].correct).length;
        const points  = Math.round(correct * pointsEach * 10) / 10;
        const total   = Math.round(questions.length * pointsEach * 10) / 10;

        student = getStudent() || { block: '?', name: 'Anonymous' };

        // ── UI and local saves first ──
        saveScore(worksheetId, points, total);
        submitToLeaderboard(student, getTotalPoints());
        renderScoreboardBar();

        if (resultsPanel) {
          resultsPanel.className = 'results-panel show';
          resultsPanel.innerHTML = `
            <h3>Worksheet Complete!</h3>
            <div class="score-big">${points} / ${total}</div>
            <div class="score-sub">${correct} correct out of ${questions.length} questions</div>
            <div class="saved-msg">
              ✓ Score saved for <strong>${student.name}</strong> (Block ${student.block})<br>
              Your total points this semester: <strong>${getTotalPoints()}</strong>
            </div>
          `;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitted!';

        // ── Send to Google Sheets last ──
        submitToSheet(student, worksheetId, points);

        onComplete && onComplete({ points, total, correct, student });
      });
    }

    renderScoreboardBar();
  }

  // ── Export for teacher ────────────────────────
  function exportData() {
    const board  = getLeaderboard();
    const scores = getScores();
    return { leaderboard: board, scores, exportedAt: new Date().toISOString() };
  }

  return {
    save, load,
    getStudent, setStudent,
    getScores, saveScore, getTotalPoints,
    submitToLeaderboard, getLeaderboard,
    getBlockTotals, fetchLiveTotals,
    renderScoreboardBar,
    initStudentWidget, runWorksheet,
    exportData
  };

})();
