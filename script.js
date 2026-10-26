const STORAGE_KEY = 'bunny-bash-save-v2';

const defaultAddictions = [
  'Social Media',
  'Gaming',
  'Smoking',
  'Sugar',
  'Alcohol',
  'Scrolling',
  'Caffeine',
  'Procrastination',
  'Porn',
  'Masturbation'
];

const shopCatalog = [
  { id: 'carrot-bed', name: 'Carrot Bed', price: 40, icon: '🛏️' },
  { id: 'garden-hut', name: 'Garden Hut', price: 70, icon: '🏡' },
  { id: 'sunflower', name: 'Sunflower', price: 50, icon: '🌻' },
  { id: 'tea-table', name: 'Tea Table', price: 90, icon: '🫖' },
  { id: 'lantern', name: 'Lantern', price: 60, icon: '🏮' },
  { id: 'toy-ball', name: 'Toy Ball', price: 45, icon: '⚽' }
];

const defaultState = {
  user: null,
  onboardingComplete: false,
  bunny: {
    name: 'Pip',
    mood: 78,
    houseLevel: 1,
    items: ['carrot-bed']
  },
  addictions: defaultAddictions.map((item) => ({ name: item, selected: item === 'Social Media' || item === 'Porn' })),
  stats: {
    coins: 0,
    wins: 0,
    urges: 0,
    relapses: 0,
    streak: 0,
    dailyReward: 15,
    lastDailyRewardDay: '',
    lastSuccessAt: 0,
    lastUrgeAt: 0,
    lastRelapseAt: 0
  },
  leaderboard: [
    { name: 'Mallow', score: 230 },
    { name: 'Juniper', score: 205 },
    { name: 'Clover', score: 178 },
    { name: 'Daisy', score: 165 }
  ],
  messages: {
    success: 'You did it. Pip is proud and hopping with joy.',
    urge: 'That urge is tough, but you are still in control.',
    relapse: 'A slip is not a failure. Pip believes you can reset and keep going.'
  }
};

const state = loadState();

const authScreen = document.querySelector('#auth-screen');
const onboardingScreen = document.querySelector('#onboarding-screen');
const dashboardScreen = document.querySelector('#dashboard-screen');
const coinsDisplay = document.querySelector('#coins-display');
const villageDisplay = document.querySelector('#village-display');
const bunnySpeech = document.querySelector('#bunny-speech');
const moodChip = document.querySelector('#mood-chip');
const streakValue = document.querySelector('#streak-value');
const winsValue = document.querySelector('#wins-value');
const urgesValue = document.querySelector('#urges-value');
const relapsesValue = document.querySelector('#relapses-value');
const moodValue = document.querySelector('#mood-value');
const dailyRewardValue = document.querySelector('#daily-reward-value');
const authForm = document.querySelector('#auth-form');
const addictionOptions = document.querySelector('#addiction-options');
const bunnyNameInput = document.querySelector('#bunny-name-input');
const startJourneyButton = document.querySelector('#start-journey');
const onboardingBackButton = document.querySelector('#onboarding-back');
const onboardingStepLabel = document.querySelector('#onboarding-step-label');
const onboardingStepTitle = document.querySelector('#onboarding-step-title');
const onboardingStepCopy = document.querySelector('#onboarding-step-copy');
const onboardingStepContent = document.querySelector('#onboarding-step-content');
const shopItems = document.querySelector('#shop-items');
const leaderboardList = document.querySelector('#leaderboard-list');
const roomItems = document.querySelector('#room-items');
const toast = document.querySelector('#toast');
const gameModal = document.querySelector('#game-modal');
const gameBoard = document.querySelector('#game-board');
const closeGame = document.querySelector('#close-game');
const gameTimer = document.querySelector('#game-timer');
const coinPopups = document.querySelector('#coin-popups');

let gameLoop = null;
let onboardingStep = 0;
let currentMiniGame = 'carrot';

const onboardingSteps = [
  {
    label: 'Step 1 of 4',
    title: 'Welcome home',
    copy: 'You do not have to be perfect today. We are building a softer routine together, one tiny win at a time.',
    render: () => `
      <div class="welcome-box">
        <div><strong>🐇</strong></div>
        <p>Your bunny is waiting with a calm little cheer. This is a place for gentle resets, not guilt.</p>
        <p>Pick a few habits to work on, name your bunny, and make a goal that feels doable for this week.</p>
      </div>
    `
  },
  {
    label: 'Step 2 of 4',
    title: 'Name your bunny',
    copy: 'Give your tiny companion a name that feels safe, playful, and a little bit magical.',
    render: () => `
      <div class="onboarding-step-card">
        <label>
          Bunny name
          <input id="onboarding-bunny-name" class="onboarding-input" type="text" maxlength="18" value="${escapeHtml(state.bunny.name || 'Pip')}" placeholder="Pip" />
        </label>
      </div>
    `
  },
  {
    label: 'Step 3 of 4',
    title: 'What are you working on?',
    copy: 'Choose the habits you want to gently steer away from. You can edit these later whenever you want.',
    render: () => `
      <div class="onboarding-step-card">
        <div class="focus-grid">
          ${state.addictions.map((item) => `
            <label class="focus-pill">
              <input type="checkbox" ${item.selected ? 'checked' : ''} data-name="${escapeHtml(item.name)}" />
              <span>${escapeHtml(item.name)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `
  },
  {
    label: 'Step 4 of 4',
    title: 'Set your goal',
    copy: 'Keep it small and specific. Your goal should help your bunny village grow without feeling overwhelming.',
    render: () => `
      <div class="onboarding-step-card">
        <label>
          This week I want to...
          <textarea id="onboarding-goal" class="onboarding-textarea" placeholder="Keep my phone out of bed, take a 10-minute reset, and log my wins each evening.">${escapeHtml(state.user && state.user.goal ? state.user.goal : '')}</textarea>
        </label>
      </div>
    `
  }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved ? { ...defaultState, ...saved, stats: { ...defaultState.stats, ...(saved.stats || {}) }, bunny: { ...defaultState.bunny, ...(saved.bunny || {}) } } : structuredClone(defaultState);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function now() {
  return Date.now();
}

function formatMilliseconds(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function markButtonPress(element) {
  if (!element) return;
  element.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.98)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }],
    { duration: 220, easing: 'ease-out' }
  );
}

function delayButtonTrigger(element, callback) {
  if (!element) return callback();
  markButtonPress(element);
  window.setTimeout(callback, 160);
}

function playCoinTone(amount) {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;

  const audioCtx = new AudioCtor();
  const hits = amount >= 10 ? Math.max(1, Math.floor(amount / 10)) : 1;

  for (let i = 0; i < hits; i += 1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 780 + i * 40;
    gain.gain.value = 0.0001;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime + i * 0.06;
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }
}

function floatCoins(amount) {
  const popup = document.createElement('div');
  popup.className = 'floating-coin';
  popup.textContent = `+${amount}`;
  coinPopups.appendChild(popup);
  window.setTimeout(() => popup.remove(), 1100);
}

function awardCoins(amount, isReward = false) {
  const sanitized = Math.max(0, Math.floor(amount));
  if (!sanitized) return;

  state.stats.coins += sanitized;
  playCoinTone(sanitized);
  floatCoins(sanitized);

  if (isReward) {
    state.bunny.mood = Math.min(100, state.bunny.mood + 4);
  }

  saveState();
  render();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, 1800);
}

function getSelectedAddictions() {
  return state.addictions.filter((item) => item.selected).map((item) => item.name);
}

function renderAddictionOptions() {
  if (!addictionOptions) return;
  addictionOptions.innerHTML = '';

  state.addictions.forEach((item) => {
    const label = document.createElement('label');
    label.className = 'option-pill';
    label.innerHTML = `
      <input type="checkbox" ${item.selected ? 'checked' : ''} data-name="${item.name}" />
      <span>${item.name}</span>
    `;
    label.addEventListener('change', (event) => {
      const checkbox = event.target;
      const selected = checkbox.checked;
      const target = state.addictions.find((entry) => entry.name === checkbox.dataset.name);
      if (target) {
        target.selected = selected;
      }
    });
    addictionOptions.appendChild(label);
  });
}

function getMoodLabel() {
  if (state.bunny.mood >= 70) return 'Happy';
  if (state.bunny.mood >= 40) return 'Steady';
  return 'Sad';
}

function setBunnyMood(mood) {
  state.bunny.mood = Math.min(100, Math.max(0, mood));
  const bunny = document.querySelector('.pixel-bunny');
  if (bunny) {
    bunny.dataset.mood = state.bunny.mood >= 55 ? 'happy' : 'sad';
    bunny.classList.remove('is-jumping');
    void bunny.offsetWidth;
    bunny.classList.add('is-jumping');
  }
}

function renderBunnyHome() {
  const bunny = document.querySelector('.pixel-bunny');
  if (bunny) {
    bunny.dataset.mood = state.bunny.mood >= 55 ? 'happy' : 'sad';
    bunny.classList.add('is-bobbing');
    window.setTimeout(() => bunny.classList.remove('is-bobbing'), 1100);
  }

  moodChip.textContent = getMoodLabel();
  bunnySpeech.textContent = state.messages.success || 'Pip is ready to help you build a calmer day.';

  roomItems.innerHTML = '';
  state.bunny.items.forEach((itemId) => {
    const match = shopCatalog.find((item) => item.id === itemId);
    if (!match) return;
    const item = document.createElement('div');
    item.className = 'room-item';
    item.title = match.name;
    item.textContent = match.icon;
    roomItems.appendChild(item);
  });
}

function renderShop() {
  shopItems.innerHTML = '';

  shopCatalog.forEach((item) => {
    const owned = state.bunny.items.includes(item.id);
    const card = document.createElement('article');
    card.className = 'shop-card';
    card.innerHTML = `
      <div class="icon">${item.icon}</div>
      <h4>${item.name}</h4>
      <div class="price">🪙 ${item.price}</div>
      <button type="button" ${owned ? 'disabled' : ''}>${owned ? 'Owned' : 'Buy'}</button>
    `;

    const button = card.querySelector('button');
    if (button) {
      button.addEventListener('click', () => buyItem(item));
    }
    shopItems.appendChild(card);
  });
}

function renderLeaderboard() {
  const localUser = {
    name: state.user ? state.user.username : 'You',
    score: state.stats.coins + state.stats.wins * 8 + state.stats.streak * 12
  };

  const leaderboard = [...state.leaderboard, localUser]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  leaderboardList.innerHTML = '';

  leaderboard.forEach((entry, index) => {
    const item = document.createElement('li');
    item.innerHTML = `
      <div class="player-meta">
        <span class="rank-badge">${index + 1}</span>
        <span class="player-name">${entry.name}</span>
      </div>
      <span class="score-pill">${entry.score}</span>
    `;
    leaderboardList.appendChild(item);
  });
}

function renderStats() {
  const { coins, wins, urges, relapses, streak, dailyReward } = state.stats;
  coinsDisplay.textContent = coins;
  villageDisplay.textContent = Math.max(1, 1 + Math.floor(coins / 100));
  streakValue.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
  winsValue.textContent = wins;
  urgesValue.textContent = urges;
  relapsesValue.textContent = relapses;
  moodValue.textContent = `${state.bunny.mood}%`;
  dailyRewardValue.textContent = dailyReward;
}

function render() {
  const hasUser = Boolean(state.user);
  const onboardingDone = Boolean(state.onboardingComplete);

  authScreen.classList.toggle('active', !hasUser);
  authScreen.classList.toggle('hidden', hasUser);
  onboardingScreen.classList.toggle('active', hasUser && !onboardingDone);
  onboardingScreen.classList.toggle('hidden', !hasUser || onboardingDone);
  dashboardScreen.classList.toggle('active', hasUser && onboardingDone);
  dashboardScreen.classList.toggle('hidden', !hasUser || !onboardingDone);

  if (!hasUser) {
    return;
  }

  renderOnboardingStep();
  renderAddictionOptions();
  renderBunnyHome();
  renderShop();
  renderLeaderboard();
  renderStats();
}

function renderOnboardingStep() {
  if (!onboardingScreen || !onboardingStepLabel || !onboardingStepTitle || !onboardingStepCopy || !onboardingStepContent) {
    return;
  }

  const step = onboardingSteps[Math.min(onboardingStep, onboardingSteps.length - 1)];

  onboardingStepLabel.textContent = step.label;
  onboardingStepTitle.textContent = step.title;
  onboardingStepCopy.textContent = step.copy;
  onboardingStepContent.innerHTML = step.render();

  if (onboardingBackButton) {
    onboardingBackButton.classList.toggle('hidden', onboardingStep === 0);
  }

  if (startJourneyButton) {
    startJourneyButton.textContent = onboardingStep === onboardingSteps.length - 1 ? 'Finish setup' : 'Next';
  }

  const stepDots = document.querySelectorAll('.step-dot');
  stepDots.forEach((dot, index) => {
    dot.classList.toggle('active', index === onboardingStep);
  });

  if (onboardingStep === 2) {
    onboardingStepContent.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', (event) => {
        const element = event.target;
        const match = state.addictions.find((entry) => entry.name === element.dataset.name);
        if (match) {
          match.selected = element.checked;
        }
      });
    });
  }
}

function applyOnboardingSelection() {
  if (onboardingStep === 1) {
    const bunnyName = document.querySelector('#onboarding-bunny-name');
    if (bunnyName) {
      state.bunny.name = bunnyName.value.trim() || 'Pip';
    }
  }

  if (onboardingStep === 2) {
    const selected = state.addictions.filter((item) => item.selected).map((item) => item.name);
    if (!selected.length) {
      showToast('Pick at least one struggle to work on.');
      return false;
    }
  }

  if (onboardingStep === 3) {
    const goal = document.querySelector('#onboarding-goal');
    if (goal && goal.value.trim()) {
      state.user = { ...(state.user || {}), goal: goal.value.trim() };
    }
  }

  return true;
}

function claimDailyReward() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.stats.lastDailyRewardDay !== today && state.stats.streak > 0) {
    const bonus = Math.min(120, 15 + state.stats.streak * 10);
    awardCoins(bonus, true);
    state.stats.dailyReward = bonus;
    state.stats.lastDailyRewardDay = today;
    showToast(`Daily reward unlocked: +${bonus} coins`);
  } else if (state.stats.lastDailyRewardDay !== today) {
    state.stats.dailyReward = 15;
    state.stats.lastDailyRewardDay = today;
  }
}

function buyItem(item) {
  if (state.bunny.items.includes(item.id)) {
    showToast(`${item.name} is already in your bunny home.`);
    return;
  }

  if (state.stats.coins < item.price) {
    showToast('Not enough coins yet. Keep winning your next challenge.');
    return;
  }

  state.stats.coins -= item.price;
  state.bunny.items.push(item.id);
  state.messages.success = `${item.name} makes Pip feel right at home.`;
  saveState();
  render();
  showToast(`${item.name} added to the bunny home!`);
}

function canLogSuccess() {
  const cooldownMs = 3 * 60 * 60 * 1000;
  return now() - (state.stats.lastSuccessAt || 0) >= cooldownMs;
}

function canLogUrge() {
  const cooldownMs = 60 * 1000;
  return now() - (state.stats.lastUrgeAt || 0) >= cooldownMs;
}

function addSuccess() {
  const successButton = document.querySelector('.success-button');
  if (!canLogSuccess()) {
    const remaining = Math.max(0, (state.stats.lastSuccessAt || 0) + 3 * 60 * 60 * 1000 - now());
    showToast(`Success is on cooldown. Try again in ${formatMilliseconds(remaining)}.`);
    return;
  }

  delayButtonTrigger(successButton, () => {
    state.stats.lastSuccessAt = now();
    awardCoins(12 + state.stats.streak * 4, true);
    state.stats.wins += 1;
    state.stats.streak += 1;
    setBunnyMood(state.bunny.mood + 10);
    state.messages.success = 'Tiny win, big courage. Pip is delighted.';
    bunnySpeech.textContent = state.messages.success;
    claimDailyReward();
    saveState();
    render();
    showToast('Success logged! + coins and bunny joy');
  });
}

function renderMiniGameBoard() {
  gameBoard.innerHTML = '';
  gameBoard.dataset.game = currentMiniGame;

  if (currentMiniGame === 'bunny-bop') {
    const targetIndex = Math.floor(Math.random() * 9);

    Array.from({ length: 9 }, (_, index) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'mini-tile';
      tile.textContent = index === targetIndex ? '🐇' : '🥕';
      tile.dataset.target = String(index === targetIndex);

      tile.addEventListener('click', () => {
        const isTarget = tile.dataset.target === 'true';
        if (isTarget) {
          state.stats.coins += 9;
          floatCoins(9);
          playCoinTone(9);
          state.bunny.mood = Math.min(100, state.bunny.mood + 7);
          showToast('Bunny boost! You found the happy bunny.');
        } else {
          state.bunny.mood = Math.max(0, state.bunny.mood - 4);
          showToast('Not this one. Try the bunny hop.');
        }

        saveState();
        render();
        renderMiniGameBoard();
      });

      return tile;
    }).forEach((tile) => gameBoard.appendChild(tile));
    return;
  }

  if (currentMiniGame === 'memory-match') {
    const symbols = ['🌼', '🍓', '⭐', '🍊'];
    const cards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    const flipped = [];

    cards.forEach((symbol, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'memory-card';
      card.dataset.symbol = symbol;
      card.dataset.open = 'false';
      card.textContent = '❔';

      card.addEventListener('click', () => {
        if (card.dataset.open === 'true' || flipped.length >= 2) return;

        card.textContent = symbol;
        card.dataset.open = 'true';
        flipped.push(card);

        if (flipped.length === 2) {
          const [first, second] = flipped;

          if (first.dataset.symbol === second.dataset.symbol) {
            state.stats.coins += 12;
            floatCoins(12);
            playCoinTone(12);
            state.bunny.mood = Math.min(100, state.bunny.mood + 8);
            showToast('Match! Tiny win energy unlocked.');
            first.disabled = true;
            second.disabled = true;
            first.dataset.matched = 'true';
            second.dataset.matched = 'true';
            flipped.length = 0;
            saveState();
            render();
          } else {
            window.setTimeout(() => {
              first.textContent = '❔';
              second.textContent = '❔';
              first.dataset.open = 'false';
              second.dataset.open = 'false';
              flipped.length = 0;
              state.bunny.mood = Math.max(0, state.bunny.mood - 3);
            }, 420);
          }
        }
      });

      gameBoard.appendChild(card);
    });
    return;
  }

  const targetIndex = Math.floor(Math.random() * 12);
  const buttons = Array.from({ length: 12 }, (_, index) => ({ index, isTarget: index === targetIndex }));

  buttons.forEach((button) => {
    const carrot = document.createElement('button');
    carrot.type = 'button';
    carrot.className = 'carrot-button' + (button.isTarget ? ' is-target' : '');
    carrot.textContent = '🥕';
    carrot.dataset.target = String(button.isTarget);

    carrot.addEventListener('click', () => {
      const isTarget = carrot.dataset.target === 'true';
      if (isTarget) {
        state.stats.coins += 8;
        floatCoins(8);
        playCoinTone(8);
        state.bunny.mood = Math.min(100, state.bunny.mood + 6);
        showToast('Nice! You found the lucky carrot.');
      } else {
        state.bunny.mood = Math.max(0, state.bunny.mood - 3);
        showToast('Close one. Try another carrot.');
      }

      saveState();
      render();
      renderMiniGameBoard();
    });

    gameBoard.appendChild(carrot);
  });
}

function openMiniGame() {
  if (gameLoop) {
    window.clearInterval(gameLoop);
  }

  const games = ['carrot', 'bunny-bop', 'memory-match'];
  currentMiniGame = games[Math.floor(Math.random() * games.length)];

  let timeLeft = 45;
  renderMiniGameBoard();
  gameModal.classList.remove('hidden');
  gameTimer.textContent = formatMilliseconds(timeLeft * 1000);

  gameLoop = window.setInterval(() => {
    timeLeft -= 1;
    gameTimer.textContent = formatMilliseconds(timeLeft * 1000);

    if (timeLeft <= 0) {
      window.clearInterval(gameLoop);
      gameLoop = null;
      gameModal.classList.add('hidden');
      showToast('Mini-game complete. Pip is proud of your reset break.');
      state.stats.coins += 20;
      floatCoins(20);
      playCoinTone(20);
      saveState();
      render();
    }
  }, 1000);
}

function handleUrge() {
  const urgeButton = document.querySelector('.urge-button');
  if (!canLogUrge()) {
    const remaining = Math.max(0, (state.stats.lastUrgeAt || 0) + 60 * 1000 - now());
    showToast(`Urges are cooling down. Try again in ${formatMilliseconds(remaining)}.`);
    return;
  }

  delayButtonTrigger(urgeButton, () => {
    state.stats.lastUrgeAt = now();
    state.stats.urges += 1;
    state.bunny.mood = Math.max(0, state.bunny.mood - 7);
    state.stats.streak = 0;
    state.messages.urge = 'The urge is loud. Pip knows you can take the next tiny step.';
    bunnySpeech.textContent = state.messages.urge;
    saveState();
    render();
    openMiniGame();
    showToast('Urge logged. Your bunny has a mini-game ready.');
  });
}

function handleRelapse() {
  const relapseButton = document.querySelector('.relapse-button');
  delayButtonTrigger(relapseButton, () => {
    state.stats.relapses += 1;
    state.bunny.mood = Math.max(0, state.bunny.mood - 12);
    state.stats.coins = Math.max(0, state.stats.coins - 5);
    state.stats.streak = 0;
    state.messages.relapse = 'It hurts, and that is okay. Learn, reset, and try again soon.';
    bunnySpeech.textContent = state.messages.relapse;
    saveState();
    render();
    openMiniGame();
    showToast('A hard moment happened. Pip still believes in your recovery.');
  });
}

function setupListeners() {
  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.querySelector('#username-input').value.trim();
    const password = document.querySelector('#password-input').value.trim();

    if (!username || !password) {
      showToast('A username and password help keep your progress safe.');
      return;
    }

    state.user = { username, password };
    saveState();
    onboardingStep = 0;
    render();
  });

  if (startJourneyButton) {
    startJourneyButton.addEventListener('click', () => {
      if (!applyOnboardingSelection()) {
        return;
      }

      if (onboardingStep < onboardingSteps.length - 1) {
        onboardingStep += 1;
        renderOnboardingStep();
        return;
      }

      const selected = getSelectedAddictions();
      if (!selected.length) {
        showToast('Pick at least one area you want to improve.');
        return;
      }

      const bunnyName = (state.bunny.name || 'Pip').trim() || 'Pip';
      state.bunny.name = bunnyName;
      state.onboardingComplete = true;
      state.messages.success = `${state.bunny.name} is ready to cheer you on.`;

      const bunny = document.querySelector('.pixel-bunny');
      if (bunny) {
        bunny.classList.remove('is-bobbing');
        void bunny.offsetWidth;
        bunny.classList.add('is-jumping');
        window.setTimeout(() => bunny.classList.remove('is-jumping'), 900);
      }

      saveState();
      render();
      showToast(`Welcome home, ${state.bunny.name}!`);
    });
  }

  if (onboardingBackButton) {
    onboardingBackButton.addEventListener('click', () => {
      if (onboardingStep > 0) {
        onboardingStep -= 1;
        renderOnboardingStep();
      }
    });
  }

  const successButton = document.querySelector('.success-button');
  const urgeButton = document.querySelector('.urge-button');
  const relapseButton = document.querySelector('.relapse-button');

  if (successButton) successButton.addEventListener('click', addSuccess);
  if (urgeButton) urgeButton.addEventListener('click', handleUrge);
  if (relapseButton) relapseButton.addEventListener('click', handleRelapse);

  closeGame.addEventListener('click', () => {
    if (gameLoop) {
      window.clearInterval(gameLoop);
      gameLoop = null;
    }
    gameModal.classList.add('hidden');
  });
}

function initIdleBunnyLoop() {
  const bunny = document.querySelector('.pixel-bunny');
  if (!bunny) return;

  window.setInterval(() => {
    bunny.classList.remove('is-bobbing');
    void bunny.offsetWidth;
    bunny.classList.add('is-bobbing');
    const eyes = bunny.querySelectorAll('.eye');
    eyes.forEach((eye) => {
      eye.style.height = '2px';
      window.setTimeout(() => {
        eye.style.height = '8px';
      }, 220);
    });
  }, 40000);
}

function init() {
  renderAddictionOptions();
  render();
  setupListeners();
  initIdleBunnyLoop();
}

init();
