// State Management
let state = {
    pilotName: "CosmicCadet",
    avatar: "🐱",
    xp: 15,
    coins: 20,
    difficulty: "EASY",
    worlds: {
        space: true,      // Unlocked by default
        jungle: false,    // Locked
        candy: false,     // Locked
        sea: false,       // Locked
        dino: false       // Locked
    },
    currentWorldKey: 'space',
    arena: {
        score: 0,
        combo: 1,
        hints: 3,
        currentProblem: null,
        choices: []
    },
    parentGateAnswer: 0,
    isParentUnlocked: false,
    // Diagnostic performance values
    parentStats: {
        space: 90,
        jungle: 78,
        candy: 65,
        sea: 40,
        dino: 50
    }
};

// Static Game Content Config
const companionEmojis = ["🐱", "🤖", "🦖", "👽", "🦊", "🦄", "🐼", "🦁", "🐯", "🐨"];

const worldDetails = {
    space: {
        title: "Space Cosmos",
        desc: "Addition Arena focused on basic sum alignments.",
        emoji: "🪐",
        reqXp: 0,
        costCoins: 0,
        operand: "Addition",
        mathSymbol: "+",
        color: "from-blue-600 to-indigo-600"
    },
    jungle: {
        title: "Jungle Safari",
        desc: "Subtraction Arena tackling dynamic values.",
        emoji: "🌴",
        reqXp: 40,
        costCoins: 60,
        operand: "Subtraction",
        mathSymbol: "-",
        color: "from-emerald-600 to-teal-600"
    },
    candy: {
        title: "Candy Metropolis",
        desc: "Multiplication Arena targeting grid values.",
        emoji: "🍬",
        reqXp: 120,
        costCoins: 60,
        operand: "Multiplication",
        mathSymbol: "*",
        color: "from-amber-500 to-rose-500"
    },
    sea: {
        title: "Deep Sea Trench",
        desc: "Division Arena covering fraction elements.",
        emoji: "🐙",
        reqXp: 250,
        costCoins: 60,
        operand: "Division",
        mathSymbol: "/",
        color: "from-cyan-600 to-blue-700"
    },
    dino: {
        title: "Dinosaur Island",
        desc: "Geometry & Perimeter calculation Arena.",
        emoji: "🦖",
        reqXp: 450,
        costCoins: 60,
        operand: "Perimeter",
        mathSymbol: "P",
        color: "from-red-600 to-orange-600"
    }
};

// Window OnLoad Initializations
window.onload = function () {
    loadAvatarChoices();
    updateUI();
    generatePreviewEquation();
    loadCurriculumWorlds();
    launchArenaForWorld('space');
};

// Show/Hide custom alert box replacement for browser alert()
function showMessageDialog(title, body, emoji = "🪐") {
    document.getElementById('dialog-title').innerText = title;
    document.getElementById('dialog-body').innerText = body;
    document.getElementById('dialog-emoji').innerText = emoji;

    const diag = document.getElementById('message-dialog');
    diag.classList.remove('hidden');
    setTimeout(() => {
        diag.classList.add('opacity-100');
    }, 50);

    // Hide automatically after 4 seconds
    setTimeout(hideMessageDialog, 4000);
}

function hideMessageDialog() {
    const diag = document.getElementById('message-dialog');
    diag.classList.add('hidden');
}

// Render Avatar options
function loadAvatarChoices() {
    const container = document.getElementById('avatar-grid');
    container.innerHTML = '';
    companionEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => { selectAvatar(emoji); };
        btn.className = `w-10 h-10 flex items-center justify-center text-lg rounded-lg border hover:bg-slate-800 transition ${state.avatar === emoji ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 bg-slate-900/40'}`;
        btn.innerText = emoji;
        btn.id = `avatar-choice-${emoji}`;
        container.appendChild(btn);
    });
}

// Handle Avatar selection
function selectAvatar(emoji) {
    playSound('click');
    // Remove previous active classes
    companionEmojis.forEach(em => {
        const el = document.getElementById(`avatar-choice-${em}`);
        if (el) el.className = `w-10 h-10 flex items-center justify-center text-lg rounded-lg border hover:bg-slate-800 transition border-slate-700 bg-slate-900/40`;
    });

    state.avatar = emoji;
    const activeEl = document.getElementById(`avatar-choice-${emoji}`);
    if (activeEl) activeEl.className = `w-10 h-10 flex items-center justify-center text-lg rounded-lg border hover:bg-slate-800 transition border-cyan-400 bg-cyan-950/30`;

    // Temporary change profile text live
    document.getElementById('card-avatar').innerText = emoji;
    document.getElementById('nav-avatar').innerText = emoji;
}

// Update Pilot Profile details on submit
function updateProfile() {
    playSound('success');
    const nameInput = document.getElementById('custom-name').value.trim();
    if (nameInput.length > 0) {
        state.pilotName = nameInput;
    }
    updateUI();
    showMessageDialog("Companion Locked", `Pilot ${state.pilotName} successfully registered! Your stats are active.`, state.avatar);
}

// Synchronize Global Stat widgets
function updateUI() {
    document.getElementById('nav-name').innerText = state.pilotName;
    document.getElementById('nav-avatar').innerText = state.avatar;
    document.getElementById('card-name').innerText = state.pilotName;
    document.getElementById('card-avatar').innerText = state.avatar;
    document.getElementById('global-xp').innerText = state.xp;
    document.getElementById('global-coins').innerText = state.coins;
}

// Handle TOC style updates
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function () {
        playSound('click');
        document.querySelectorAll('.nav-link').forEach(l => {
            l.className = "nav-link flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition text-slate-400 hover:text-white hover:bg-white/5";
        });
        this.className = "nav-link flex items-center gap-2.5 py-2 px-3 rounded-lg text-sm transition text-cyan-400 bg-cyan-500/10 font-medium";
    });
});

// Difficulty Selector state changer
function selectDifficulty(diff) {
    playSound('click');
    // Remove borders
    ['EASY', 'MEDIUM', 'HARD'].forEach(d => {
        const el = document.getElementById(`diff-card-${d}`);
        el.classList.remove('border-purple-500', 'bg-slate-900/80', 'border-cyan-500', 'border-pink-500');
        el.classList.add('border-purple-500/10', 'bg-slate-900/40');
        el.querySelector('.checked-icon').className = "fa-solid fa-circle-check text-slate-600 group-hover:text-purple-400 text-sm checked-icon";
    });

    state.difficulty = diff;
    const card = document.getElementById(`diff-card-${diff}`);
    card.classList.remove('border-purple-500/10', 'bg-slate-900/40');

    // Add custom color glow border matching level theme
    if (diff === 'EASY') {
        card.classList.add('border-purple-500', 'bg-slate-900/80');
        card.querySelector('.checked-icon').className = "fa-solid fa-circle-check text-purple-400 text-sm checked-icon";
    } else if (diff === 'MEDIUM') {
        card.classList.add('border-cyan-500', 'bg-slate-900/80');
        card.querySelector('.checked-icon').className = "fa-solid fa-circle-check text-cyan-400 text-sm checked-icon";
    } else {
        card.classList.add('border-pink-500', 'bg-slate-900/80');
        card.querySelector('.checked-icon').className = "fa-solid fa-circle-check text-pink-400 text-sm checked-icon";
    }

    document.getElementById('engine-selected-diff').innerText = diff;
    generatePreviewEquation();

    // Reload math problem in current playable arena to respect selected difficulty immediately
    if (state.currentWorldKey) {
        generateProblemInArena();
    }
}

// Live math equation code (Step 1 display box)
function generatePreviewEquation() {
    let bounds = getMinMaxForDifficulty();
    let num1 = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;
    let num2 = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;
    document.getElementById('live-equation').innerText = `${num1} + ${num2}`;
}

// Return min/max calculation constraints
function getMinMaxForDifficulty() {
    if (state.difficulty === 'EASY') {
        return { min: 10, max: 99 };
    } else if (state.difficulty === 'MEDIUM') {
        return { min: 100, max: 999 };
    } else {
        return { min: 1000, max: 9999 };
    }
}


// SECTION: CURRICULUM WORLDS UTILS & SETUP
function loadCurriculumWorlds() {
    const grid = document.getElementById('worlds-grid');
    grid.innerHTML = '';

    Object.keys(worldDetails).forEach(key => {
        const world = worldDetails[key];
        const isUnlocked = state.worlds[key] || world.reqXp <= state.xp;

        // Track state correction
        if (isUnlocked && !state.worlds[key]) {
            state.worlds[key] = true;
        }

        const card = document.createElement('div');
        card.className = `glass-panel rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${state.currentWorldKey === key ? 'ring-2 ring-cyan-400 border-transparent shadow-cyan-glow scale-[1.02]' : 'border-white/5'}`;

        let actionBtnHTML = '';
        if (isUnlocked) {
            actionBtnHTML = `
                        <button onclick="launchArenaForWorld('${key}')" class="w-full mt-4 bg-slate-800 hover:bg-cyan-600 hover:text-white transition text-slate-300 font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1">
                            <i class="fa-solid fa-rocket"></i> Launch Arena
                        </button>
                    `;
        } else {
            actionBtnHTML = `
                        <div class="space-y-2 mt-4">
                            <div class="flex items-center justify-between text-[11px] text-slate-400">
                                <span>Locked: Needs ${world.reqXp} XP</span>
                                <span class="text-rose-400">Lock ID: 🔒</span>
                            </div>
                            <button onclick="shortcutUnlockWorld('${key}')" class="w-full bg-yellow-600 hover:bg-yellow-500 active:scale-95 transition text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5">
                                <span>Unlock with 60 <i class="fa-solid fa-coins text-yellow-500"></i></span>
                            </button>
                        </div>
                    `;
        }

        card.innerHTML = `
                    <div class="p-5 space-y-3">
                        <div class="flex justify-between items-start">
                            <span class="text-3xl">${world.emoji}</span>
                            ${isUnlocked ?
                '<span class="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Unlocked</span>'
                : '<span class="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">Locked</span>'
            }
                        </div>
                        <div class="space-y-1">
                            <h4 class="heading-font font-bold text-base text-white">${world.title}</h4>
                            <span class="text-[10px] bg-white/5 py-0.5 px-2 rounded-full border border-white/5 text-slate-300">${world.operand} Arena</span>
                        </div>
                        <p class="text-xs text-slate-400 leading-normal">${world.desc}</p>
                    </div>
                    <div class="p-4 bg-slate-950/40 border-t border-white/5 mt-auto">
                        ${actionBtnHTML}
                    </div>
                `;
        grid.appendChild(card);
    });
}

// Direct buy action for locked worlds
function shortcutUnlockWorld(worldKey) {
    const world = worldDetails[worldKey];
    if (state.coins >= 60) {
        playSound('unlock');
        state.coins -= 60;
        state.worlds[worldKey] = true;
        updateUI();
        loadCurriculumWorlds();
        showMessageDialog("World Unlocked!", `Success! You unlocked ${world.title} via coin shortcut. Enjoy practicing!`, "🌍");

        // Track diagnostic progress
        if (state.isParentUnlocked) {
            refreshParentStats();
        }

        // Open newly unlocked arena
        launchArenaForWorld(worldKey);
    } else {
        playSound('fail');
        showMessageDialog("Insufficient Coins", `You have ${state.coins} 🪙. You need 60 🪙 to execute the instant unlock booster sequence!`, "❌");
    }
}


// SECTION: MATH ARENA SIMULATOR ENGINE (Playable)
function launchArenaForWorld(worldKey) {
    playSound('click');
    state.currentWorldKey = worldKey;

    // Reload curriculum cards to render active ring border
    loadCurriculumWorlds();

    const world = worldDetails[worldKey];
    document.getElementById('arena-world-emoji').innerText = world.emoji;
    document.getElementById('arena-world-title').innerText = world.title;
    document.getElementById('arena-operand-type').innerText = `${world.operand} Arena`;

    const isWorldUnlocked = state.worlds[worldKey];
    const blockedScreen = document.getElementById('arena-blocked-screen');
    const gameplayContent = document.getElementById('arena-gameplay-content');

    if (!isWorldUnlocked) {
        blockedScreen.classList.remove('hidden');
        gameplayContent.classList.add('hidden');
    } else {
        blockedScreen.classList.add('hidden');
        gameplayContent.classList.remove('hidden');

        // Initialize clean score for the mini demo run
        state.arena.score = 0;
        state.arena.combo = 1;
        state.arena.hints = 3;

        refreshArenaStatsDisplay();
        generateProblemInArena();
    }
}

function refreshArenaStatsDisplay() {
    document.getElementById('arena-score').innerText = state.arena.score;
    document.getElementById('arena-combo').innerText = `x${state.arena.combo}`;
    document.getElementById('arena-hints').innerText = state.arena.hints;

    // Manage hint buttons
    const hintBtn = document.getElementById('arena-hint-btn');
    const buyHintBtn = document.getElementById('arena-buy-hint-btn');

    if (state.arena.hints > 0) {
        hintBtn.classList.remove('hidden');
        buyHintBtn.classList.add('hidden');
    } else {
        hintBtn.classList.add('hidden');
        buyHintBtn.classList.remove('hidden');
    }
}

// Procedural generator logic
function generateProblemInArena() {
    const world = worldDetails[state.currentWorldKey];
    let bounds = getMinMaxForDifficulty();
    let num1 = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;
    let num2 = Math.floor(Math.random() * (bounds.max - bounds.min + 1)) + bounds.min;

    // Edge cases based on world target
    let problemText = "";
    let correctAnswer = 0;

    switch (world.mathSymbol) {
        case "-":
            // Avoid negative results for simpler cadet flow
            if (num1 < num2) {
                let temp = num1;
                num1 = num2;
                num2 = temp;
            }
            problemText = `${num1} - ${num2}`;
            correctAnswer = num1 - num2;
            break;
        case "*":
            // Limit multiplication sizes slightly to keep it playable in mental guide
            let mulNum1 = Math.floor(Math.random() * (state.difficulty === 'HARD' ? 100 : 25)) + 2;
            let mulNum2 = Math.floor(Math.random() * (state.difficulty === 'EASY' ? 10 : 12)) + 2;
            problemText = `${mulNum1} × ${mulNum2}`;
            correctAnswer = mulNum1 * mulNum2;
            break;
        case "/":
            // Ensure perfectly cleanly divisible numbers for cadet divisibility
            let divNum2 = Math.floor(Math.random() * (state.difficulty === 'EASY' ? 9 : 25)) + 2;
            let quotient = Math.floor(Math.random() * (state.difficulty === 'EASY' ? 10 : 30)) + 2;
            let divNum1 = divNum2 * quotient;
            problemText = `${divNum1} ÷ ${divNum2}`;
            correctAnswer = quotient;
            break;
        case "P":
            // Geometry/Perimeter. e.g. Rectangle with width L and height W
            let length = Math.floor(Math.random() * (bounds.max - bounds.min + 1) / 10) + 5;
            let width = Math.floor(Math.random() * (bounds.max - bounds.min + 1) / 10) + 3;
            problemText = `Rectangle Perimeter: L = ${length}, W = ${width}`;
            correctAnswer = 2 * (length + width);
            break;
        case "+":
        default:
            problemText = `${num1} + ${num2}`;
            correctAnswer = num1 + num2;
            break;
    }

    state.arena.currentProblem = {
        equation: problemText,
        ans: correctAnswer
    };

    // Generate 3 random wrong alternatives
    let choices = [correctAnswer];
    while (choices.length < 4) {
        let offFactor = Math.floor(Math.random() * 20) - 10;
        if (offFactor === 0) offFactor = 5;
        let wrong = correctAnswer + offFactor;
        if (wrong > 0 && !choices.includes(wrong)) {
            choices.push(wrong);
        }
    }

    // Shuffle array
    choices.sort(() => Math.random() - 0.5);
    state.arena.choices = choices;

    // Render elements
    document.getElementById('arena-question').innerText = problemText;
    document.getElementById('arena-feedback').innerText = "";

    renderChoicesGrid();
}

function renderChoicesGrid() {
    const container = document.getElementById('arena-choices');
    container.innerHTML = '';

    state.arena.choices.forEach(val => {
        const btn = document.createElement('button');
        btn.onclick = () => { handleArenaChoiceSubmit(val); };
        btn.className = "w-full bg-slate-900 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 transition text-sm text-slate-100 py-3 px-4 rounded-xl font-semibold active:scale-95 shadow-md flex items-center justify-center gap-2 choice-btn";
        btn.innerText = val;
        btn.id = `choice-${val}`;
        container.appendChild(btn);
    });
}

// Choice check logic
function handleArenaChoiceSubmit(selectedVal) {
    const correct = state.arena.currentProblem.ans;
    const feedbackEl = document.getElementById('arena-feedback');

    if (selectedVal === correct) {
        playSound('success');
        // Calculate point addition utilizing Multiplier combo metrics
        let pts = 10 * state.arena.combo;
        state.arena.score += pts;

        // Combo increment logic (+2 surge!)
        state.arena.combo += 2;

        feedbackEl.className = "h-6 text-xs font-bold transition text-center text-emerald-400";
        feedbackEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Correct! +${pts} Score (Combo Surge: x${state.arena.combo})`;

        // Highlight correct selection
        const el = document.getElementById(`choice-${selectedVal}`);
        if (el) el.className = "w-full bg-emerald-950 border border-emerald-500 text-emerald-300 text-sm py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2";

        // Generate new problem after minor delay
        setTimeout(generateProblemInArena, 1200);
    } else {
        playSound('fail');
        // Drop combo back to x1
        state.arena.combo = 1;
        feedbackEl.className = "h-6 text-xs font-bold transition text-center text-rose-400";
        feedbackEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Incorrect! Combo Surge Reset to x1! Correct: ${correct}`;

        // Highlight incorrect choice
        const el = document.getElementById(`choice-${selectedVal}`);
        if (el) el.className = "w-full bg-rose-950 border border-rose-500 text-rose-300 text-sm py-3 px-4 rounded-xl font-bold transition flex items-center justify-center gap-2";

        // Regenerate equation
        setTimeout(generateProblemInArena, 1200);
    }

    refreshArenaStatsDisplay();
}

// Arena Hints logic
function useArenaHint() {
    if (state.arena.hints > 0) {
        playSound('click');
        state.arena.hints -= 1;
        refreshArenaStatsDisplay();

        // Cross out 2 wrong solutions
        const correct = state.arena.currentProblem.ans;
        let crossedCount = 0;

        // Target choice buttons
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            const val = parseInt(btn.innerText);
            if (val !== correct && crossedCount < 2) {
                btn.disabled = true;
                btn.className = "w-full bg-slate-950 border border-slate-900 text-slate-700 py-3 px-4 rounded-xl font-semibold line-through cursor-not-allowed flex items-center justify-center gap-2";
                crossedCount++;
            }
        });

        showMessageDialog("Clue Deployed", "The cosmic sensor crossed out two erroneous calculations!", "💡");
    }
}

// Mid-game buy helper
function buyArenaHint() {
    if (state.coins >= 10) {
        playSound('unlock');
        state.coins -= 10;
        state.arena.hints += 1;

        updateUI();
        refreshArenaStatsDisplay();
        showMessageDialog("Hint Acquired", "Purchased 1 hint clue successfully!", "🪙");
    } else {
        playSound('fail');
        showMessageDialog("Failed Transaction", "You do not have 10 🪙 in savings to buy hints!", "❌");
    }
}

// Cash out rewards
function finishArenaRun() {
    playSound('unlock');
    // Formulate gains
    let xpGained = Math.floor(state.arena.score / 5) + 5;
    let coinsGained = Math.floor(state.arena.score / 8) + 3;

    state.xp += xpGained;
    state.coins += coinsGained;

    updateUI();
    loadCurriculumWorlds();

    // Clear play
    const modalMsg = `Incredible navigation run! You safely landed the spaceship Cadet. You successfully earned: +${xpGained} XP and +${coinsGained} 🪙. Keep practicing!`;
    showMessageDialog("Run Concluded!", modalMsg, "🏁");

    // Rerender Parent Suite if unlocked to show dynamic mock progress updates
    if (state.isParentUnlocked) {
        // Dynamically update diagnostic analytics data based on active playing score
        state.parentStats[state.currentWorldKey] = Math.min(100, state.parentStats[state.currentWorldKey] + 4);
        refreshParentStats();
    }

    // Launch active world state to reflect XP unlock logic
    launchArenaForWorld(state.currentWorldKey);
}


// SECTION: THE SECURE PARENTS GATEWAY
function openParentGateModal() {
    playSound('click');
    // Generate secure quick math equation
    const num1 = Math.floor(Math.random() * 8) + 2; // 2 - 9
    const num2 = Math.floor(Math.random() * 8) + 2; // 2 - 9
    state.parentGateAnswer = num1 * num2;

    document.getElementById('parent-gate-equation').innerText = `${num1} × ${num2} = ?`;
    document.getElementById('parent-gate-input').value = '';
    document.getElementById('parent-gate-error').classList.add('hidden');

    document.getElementById('parent-gate-modal').classList.remove('hidden');
}

function closeParentGateModal() {
    document.getElementById('parent-gate-modal').classList.add('hidden');
}

function verifyParentGate() {
    const inputVal = parseInt(document.getElementById('parent-gate-input').value);
    if (inputVal === state.parentGateAnswer) {
        playSound('success');
        state.isParentUnlocked = true;
        closeParentGateModal();

        // Unhide the Parent Suite Panel
        const suite = document.getElementById('parent-suite-section');
        suite.classList.remove('hidden');

        // Scroll into view nicely
        document.getElementById('step-4-parents').scrollIntoView({ behavior: 'smooth' });

        // Render parent charts
        refreshParentStats();
        showMessageDialog("Security Verification Successful", "Parent Diagnostics Panel is now unlocked & fully responsive below!", "🔓");
    } else {
        playSound('fail');
        document.getElementById('parent-gate-error').classList.remove('hidden');
    }
}

// Render dynamic SVG/HTML charts inside decrypted area
function refreshParentStats() {
    const barKeys = ['add', 'sub', 'mul', 'div', 'geo'];
    const mapKeys = ['space', 'jungle', 'candy', 'sea', 'dino'];

    const alertContainer = document.getElementById('parent-remediations-list');
    alertContainer.innerHTML = '';

    barKeys.forEach((key, index) => {
        const worldKey = mapKeys[index];
        const scoreVal = state.parentStats[worldKey];

        // Check lock status - if locked, accuracy is reduced
        let realScoreVal = state.worlds[worldKey] ? scoreVal : 0;

        // Update elements text
        document.getElementById(`stat-${key}-val`).innerText = state.worlds[worldKey] ? `${realScoreVal}%` : '🔒 (Not Played Yet)';

        // Set widths matching value animation trigger
        setTimeout(() => {
            document.getElementById(`stat-${key}-bar`).style.width = `${realScoreVal}%`;
        }, 100);

        // Build AI remediation recommendations
        if (!state.worlds[worldKey]) {
            alertContainer.innerHTML += `
                        <div class="p-2.5 bg-slate-950/80 rounded border border-white/5 flex justify-between items-center">
                            <span class="text-slate-400 font-medium">World ${worldDetails[worldKey].title} Locked</span>
                            <a href="#curriculum-anchor" class="text-yellow-400 font-semibold hover:underline">Launch Training ➔</a>
                        </div>
                    `;
        } else if (realScoreVal < 75) {
            alertContainer.innerHTML += `
                        <div class="p-2.5 bg-rose-950/20 border border-rose-500/10 rounded flex justify-between items-center">
                            <span class="text-rose-400 font-semibold">⚠️ ${worldDetails[worldKey].title} Average is ${realScoreVal}% (Below 75%)</span>
                            <a href="#arena-anchor" onclick="launchArenaForWorld('${worldKey}')" class="text-cyan-400 font-semibold hover:underline">Practice Now ➔</a>
                        </div>
                    `;
        }
    });

    if (alertContainer.innerHTML === '') {
        alertContainer.innerHTML = `
                    <div class="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded text-emerald-400 flex items-center gap-2">
                        <i class="fa-solid fa-circle-check"></i> All unlocked modules are performing spectacularly (above 75%)! Excellent operational focus.
                    </div>
                `;
    }
}