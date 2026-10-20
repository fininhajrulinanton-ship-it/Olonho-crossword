// Логика пяти уровней кроссвордов по теме «Олонхо».
const puzzles = [
  {
    title: "Основы Олонхо",
    words: [
      { word: "ОЛОНХО", dir: "across", clue: "Как называется якутский героический эпос?" },
      { word: "САХА", dir: "down", clue: "Самоназвание якутского народа." },
      { word: "ЭПОС", dir: "across", clue: "Жанр повествования о героях и важных событиях." },
      { word: "МИР", dir: "down", clue: "В олонхо рассказывается о разных ... " },
      { word: "ГЕРОЙ", dir: "across", clue: "Главный персонаж, совершающий подвиги." }
    ]
  },
  {
    title: "Мир эпоса",
    words: [
      { word: "ОЛОНХОСУТ", dir: "across", clue: "Как называют сказителя, исполняющего олонхо?" },
      { word: "ВЕРХНИЙ", dir: "down", clue: "Один из трёх миров эпоса — ... мир." },
      { word: "ГЕРОЙ", dir: "across", clue: "Персонаж, который защищает свой народ." },
      { word: "ТРАДИЦИЯ", dir: "down", clue: "Обычай, который передаётся от поколения к поколению." },
      { word: "ЭПОС", dir: "across", clue: "Большое повествовательное произведение о героях." }
    ]
  },
  {
    title: "Герои и сказители",
    words: [
      { word: "БОГАТЫРЬ", dir: "across", clue: "Могучий герой, совершающий подвиги." },
      { word: "СКАЗИТЕЛЬ", dir: "down", clue: "Человек, который рассказывает народные эпические произведения." },
      { word: "НАРОД", dir: "across", clue: "Общность людей, которая хранит культурные традиции." },
      { word: "ПОДВИГ", dir: "down", clue: "Смелый, героический поступок." },
      { word: "ПЕСНЯ", dir: "across", clue: "Одна из форм устного исполнения и передачи культуры." }
    ]
  },
  {
    title: "Три мира",
    words: [
      { word: "ВЕРХНИЙ", dir: "across", clue: "Мир, название которого связано с высотой." },
      { word: "СРЕДНИЙ", dir: "down", clue: "Мир, где живут люди." },
      { word: "НИЖНИЙ", dir: "across", clue: "Мир, противопоставленный Верхнему." },
      { word: "ПРИРОДА", dir: "down", clue: "Мир растений, животных и природных явлений." },
      { word: "ЗЕМЛЯ", dir: "across", clue: "Планета и почва, на которой живут люди." }
    ]
  },
  {
    title: "Культура и наследие",
    words: [
      { word: "НАСЛЕДИЕ", dir: "across", clue: "Культурные ценности, передаваемые поколениям." },
      { word: "ЮНЕСКО", dir: "down", clue: "Международная организация, связанная с образованием, наукой и культурой." },
      { word: "САХА", dir: "across", clue: "Самоназвание народа, создавшего олонхо." },
      { word: "ПАМЯТЬ", dir: "down", clue: "Способность сохранять знания о прошлом." },
      { word: "ЭПОС", dir: "across", clue: "Жанр, к которому относится Олонхо." }
    ]
  }
];

const $ = (id) => document.getElementById(id);
let currentLevel = 0;
let board = new Map();
let entries = [];
let selectedWord = null;

function keyOf(r, c) { return `${r},${c}`; }
function wordCells(entry) {
  return Array.from({ length: entry.word.length }, (_, i) =>
    keyOf(entry.r + (entry.dir === "down" ? i : 0), entry.c + (entry.dir === "across" ? i : 0))
  );
}

// Place words as a crossword by crossing matching letters when possible.
function makeLayout(words) {
  const placed = [];
  if (!words.length) return placed;
  placed.push({ ...words[0], r: 0, c: 0 });
  for (const word of words.slice(1)) {
    let best = null;
    for (const old of placed) {
      for (let i = 0; i < word.word.length; i++) {
        for (let j = 0; j < old.word.length; j++) {
          if (word.word[i] !== old.word[j]) continue;
          const dir = old.dir === "across" ? "down" : "across";
          const r = old.r + (old.dir === "down" ? j : 0) - (dir === "down" ? i : 0);
          const c = old.c + (old.dir === "across" ? j : 0) - (dir === "across" ? i : 0);
          const candidate = { ...word, r, c, dir };
          if (canPlace(candidate, placed)) { best = candidate; break; }
        }
        if (best) break;
      }
      if (best) break;
    }
    if (best) placed.push(best);
    else {
      // Fallback: put the word below the existing layout; the game remains playable.
      const bottom = Math.max(...placed.map(p => p.r + (p.dir === "down" ? p.word.length - 1 : 0))) + 2;
      placed.push({ ...word, r: bottom, c: 0, dir: "across" });
    }
  }
  const minR = Math.min(...placed.map(p => p.r));
  const minC = Math.min(...placed.map(p => p.c));
  return placed.map(p => ({ ...p, r: p.r - minR, c: p.c - minC }));
}

function canPlace(candidate, placed) {
  const letters = new Map();
  for (const p of placed) {
    for (let i = 0; i < p.word.length; i++) {
      const r = p.r + (p.dir === "down" ? i : 0);
      const c = p.c + (p.dir === "across" ? i : 0);
      letters.set(keyOf(r, c), p.word[i]);
    }
  }
  let crosses = 0;
  for (let i = 0; i < candidate.word.length; i++) {
    const r = candidate.r + (candidate.dir === "down" ? i : 0);
    const c = candidate.c + (candidate.dir === "across" ? i : 0);
    const key = keyOf(r, c);
    if (letters.has(key)) {
      if (letters.get(key) !== candidate.word[i]) return false;
      crosses++;
    }
  }
  return crosses > 0;
}

function renderLevelTabs() {
  const tabs = $("levelTabs");
  tabs.innerHTML = "";
  puzzles.forEach((puzzle, index) => {
    const button = document.createElement("button");
    button.className = `level-tab${index === currentLevel ? " active" : ""}`;
    button.textContent = `Уровень ${index + 1}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(index === currentLevel));
    button.addEventListener("click", () => {
      currentLevel = index;
      renderLevelTabs();
      buildBoard();
    });
    tabs.appendChild(button);
  });
}

function buildBoard() {
  const puzzle = puzzles[currentLevel];
  entries = makeLayout(puzzle.words);
  board = new Map();
  selectedWord = null;
  entries.forEach((entry, index) => {
    entry.id = index;
    wordCells(entry).forEach((key, letterIndex) => {
      if (!board.has(key)) board.set(key, { letters: [], starts: [] });
      const cell = board.get(key);
      cell.letters.push(entry.word[letterIndex]);
      if (letterIndex === 0) cell.starts.push(index + 1);
    });
  });

  const positions = [...board.keys()].map(key => key.split(",").map(Number));
  const maxR = Math.max(...positions.map(([r]) => r));
  const maxC = Math.max(...positions.map(([, c]) => c));
  const grid = $("crossword");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${maxC + 1}, 36px)`;
  grid.style.setProperty("--cols", maxC + 1);

  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      const key = keyOf(r, c);
      const data = board.get(key);
      const cell = document.createElement("div");
      cell.className = `cell${data ? "" : " block"}`;
      if (data) {
        const input = document.createElement("input");
        input.maxLength = 1;
        input.autocomplete = "off";
        input.dataset.key = key;
        input.setAttribute("aria-label", `Строка ${r + 1}, столбец ${c + 1}`);
        input.addEventListener("input", () => {
          input.value = input.value.toLocaleUpperCase("ru-RU").replace(/[^А-ЯЁ]/g, "").slice(-1);
          updateProgress();
          if (input.value && selectedWord !== null) moveNext(key);
        });
        input.addEventListener("keydown", event => {
          if (event.key === "Backspace" && !input.value) movePrevious(key);
          const delta = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[event.key];
          if (delta) { event.preventDefault(); moveBy(key, delta[0], delta[1]); }
        });
        cell.appendChild(input);
        if (data.starts.length) {
          const number = document.createElement("span");
          number.className = "number";
          number.textContent = data.starts.join(",");
          cell.appendChild(number);
        }
      }
      grid.appendChild(cell);
    }
  }
  $("levelTitle").textContent = puzzle.title;
  $("levelBadge").textContent = `${currentLevel + 1} / ${puzzles.length}`;
  renderClues("across", $("acrossClues"));
  renderClues("down", $("downClues"));
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  updateProgress();
}

function renderClues(direction, list) {
  list.innerHTML = "";
  entries.forEach((entry, index) => {
    if (entry.dir !== direction) return;
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.clue}`;
    li.tabIndex = 0;
    li.addEventListener("click", () => selectWord(index));
    li.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") selectWord(index); });
    li.dataset.wordId = index;
    list.appendChild(li);
  });
}

function selectWord(index) {
  selectedWord = index;
  document.querySelectorAll(".clues-panel li").forEach(li => li.classList.toggle("selected", Number(li.dataset.wordId) === index));
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("highlight"));
  const keys = wordCells(entries[index]);
  keys.forEach(key => {
    const input = document.querySelector(`input[data-key="${key}"]`);
    if (input) input.parentElement.classList.add("highlight");
  });
  const first = document.querySelector(`input[data-key="${keys[0]}"]`);
  if (first) first.focus();
}
function moveNext(key) {
  if (selectedWord === null) return;
  const keys = wordCells(entries[selectedWord]);
  const index = keys.indexOf(key);
  if (index >= 0 && index < keys.length - 1) document.querySelector(`input[data-key="${keys[index + 1]}"]`)?.focus();
}
function movePrevious(key) {
  if (selectedWord === null) return;
  const keys = wordCells(entries[selectedWord]);
  const index = keys.indexOf(key);
  if (index > 0) document.querySelector(`input[data-key="${keys[index - 1]}"]`)?.focus();
}
function moveBy(key, dr, dc) {
  const [r, c] = key.split(",").map(Number);
  document.querySelector(`input[data-key="${keyOf(r + dr, c + dc)}"]`)?.focus();
}
function updateProgress() {
  const inputs = [...document.querySelectorAll(".cell input")];
  const filled = inputs.filter(input => input.value.trim()).length;
  const percent = Math.round(filled / Math.max(inputs.length, 1) * 100);
  $("progressBar").style.width = `${percent}%`;
  $("progressText").textContent = `Заполнено клеток: ${filled} из ${inputs.length} (${percent}%)`;
}
function checkAnswers() {
  let correct = 0;
  entries.forEach(entry => {
    const value = wordCells(entry).map(key => document.querySelector(`input[data-key="${key}"]`)?.value || "").join("");
    if (value === entry.word) {
      correct++;
      wordCells(entry).forEach(key => document.querySelector(`input[data-key="${key}"]`)?.parentElement.classList.add("correct"));
    }
  });
  const feedback = $("feedback");
  feedback.className = `feedback ${correct === entries.length ? "good" : "bad"}`;
  feedback.textContent = correct === entries.length
    ? "Отлично! Все слова разгаданы. Можешь переходить к следующему уровню!"
    : `Правильно разгадано слов: ${correct} из ${entries.length}. Проверь ответы и попробуй ещё раз.`;
}
function giveHint() {
  if (selectedWord === null) {
    const first = entries.findIndex(entry => entry.dir === "across");
    selectWord(Math.max(first, 0));
    $("feedback").textContent = "Выбран первый вопрос. Нажми «Подсказка» ещё раз, чтобы открыть букву.";
    return;
  }
  const entry = entries[selectedWord];
  const keys = wordCells(entry);
  const index = keys.findIndex(key => !document.querySelector(`input[data-key="${key}"]`).value);
  if (index < 0) { $("feedback").textContent = "Это слово уже заполнено."; return; }
  const input = document.querySelector(`input[data-key="${keys[index]}"]`);
  input.value = entry.word[index];
  input.parentElement.classList.add("highlight");
  input.focus();
  updateProgress();
  $("feedback").textContent = `Открыта буква ${index + 1} в выбранном слове.`;
}
function showAnswers() {
  entries.forEach(entry => wordCells(entry).forEach((key, index) => {
    const input = document.querySelector(`input[data-key="${key}"]`);
    if (input) input.value = entry.word[index];
  }));
  updateProgress();
  $("feedback").className = "feedback good";
  $("feedback").textContent = "Ответы показаны. Можешь перейти к другому уровню.";
}
function resetBoard() {
  document.querySelectorAll(".cell input").forEach(input => input.value = "");
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("correct"));
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  updateProgress();
}

$("checkBtn").addEventListener("click", checkAnswers);
$("hintBtn").addEventListener("click", giveHint);
$("answersBtn").addEventListener("click", showAnswers);
$("resetBtn").addEventListener("click", resetBoard);
renderLevelTabs();
buildBoard();
