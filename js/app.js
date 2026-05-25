/**
 * MathVerse Express - Modular Production Engine Environment
 * Built clean using native vanilla state paradigms, fully self-contained.
 */

// STATIC REWARD BADGES DICTIONARY
const BADGES_DATABASE = [
    { id: 'first_step', title: 'Novice Cadet', desc: 'Solved 1 question', icon: '🚀', color: 'bg-blue-100' },
    { id: 'addition_pro', title: 'Summoner Pro', desc: 'Mastered Addition', icon: '➕', color: 'bg-green-100' },
    { id: 'speed_demon', title: 'Speed Demon', desc: 'Combo level reached x5', icon: '⚡', color: 'bg-yellow-100' },
    { id: 'math_god', title: 'Grandmaster', desc: 'Earned 1000+ Total XP', icon: '👑', color: 'bg-purple-100' }
];

// WORLDS CONFIGURATION METRIC
const CAMPAIGN_WORLDS = [
    { id: 'space_world', name: 'Space Cosmos', category: 'Addition', icon: '🪐', color: 'from-cyan-400 to-blue-500', minXp: 0 },
    { id: 'jungle_world', name: 'Jungle Safari', category: 'Subtraction', icon: '🌴', color: 'from-green-400 to-emerald-600', minXp: 40 },
    { id: 'candy_world', name: 'Candy Metropolis', category: 'Multiplication', icon: '🍬', color: 'from-pink-400 to-rose-500', minXp: 120 },
    { id: 'ocean_world', name: 'Deep Sea Trench', category: 'Division', icon: '🐙', color: 'from-blue-400 to-indigo-600', minXp: 250 },
    { id: 'dino_island', name: 'Dinosaur Island', category: 'Geometry', icon: '🦖', color: 'from-amber-500 to-orange-600', minXp: 450 }
];

// COMPANION AVATARS OPTIONS
const COMPANION_AVATARS = ['🐱', '🦊', '🐸', '🤖', '🦁', '🦄', '🐼', '🐨', '🦖', '🐝'];

const App = {
    // DATABASE LOGIC LAYER (LOCALSTORAGE INTERFACE WRAPPER)
    storage: {
        key: 'mathverse_production_profile_v2',

        getInitialSchema() {
            return {
                username: 'Explorer',
                avatar: '🐱',
                xp: 0,
                level: 1,
                coins: 0,
                stars: 0,
                streak: 1,
                lastActiveTimestamp: Date.now(),
                unlockedBadges: ['first_step'],
                gameMode: 'normal',
                currentWorld: 'space_world',
                history: [
                    { date: '2026-05-20', category: 'Addition', points: 10, accuracy: 80, timeSpent: 120 },
                    { date: '2026-05-22', category: 'Addition', points: 25, accuracy: 90, timeSpent: 180 }
                ]
            };
        },

        load() {
            let data = localStorage.getItem(this.key);
            if (!data) {
                data = this.getInitialSchema();
                this.save(data);
                return data;
            }
            return JSON.parse(data);
        },

        save(data) {
            localStorage.setItem(this.key, JSON.stringify(data));
        },

        mutate(callback) {
            const current = this.load();
            callback(current);
            this.save(current);
            App.ui.syncHUD(current);
        }
    },

    // SCREEN NAVIGATION ROUTER
    router: {
        currentScreen: null,

        navigate(screenId) {
            // Safety check if user metadata exists, if not send back to authentication panel
            const state = App.storage.load();
            if (!state.username && screenId !== 'auth') {
                screenId = 'auth';
            }

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
            const targetPanel = document.getElementById(`screen-${screenId}`);

            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                this.currentScreen = screenId;

                // Handle layout specific initialization wrappers smoothly
                if (screenId === 'global-hud' || screenId !== 'auth') {
                    document.getElementById('global-hud').classList.remove('hidden');
                } else {
                    document.getElementById('global-hud').classList.add('hidden');
                }

                if (screenId === 'dashboard') App.ui.renderDashboardView();
                if (screenId === 'parent') App.analytics.renderParentDashboard();
                if (screenId === 'profile') App.ui.renderProfileView();

                // Fire screen entry animation via GSAP
                gsap.fromTo(targetPanel, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            }
        }
    },

    // USER INTERFACE LAYOUT RENDERER ENGINE
    ui: {
        activeParentCodeAnswer: null,

        init() {
            const state = App.storage.load();
            this.syncHUD(state);

            // Route initial entrance sequence mapping
            if (!localStorage.getItem(App.storage.key)) {
                this.buildAvatarSelector('avatar-selector-grid');
                App.router.navigate('auth');
            } else {
                App.router.navigate('dashboard');
            }

            // Global dynamic interactive sound button bindings setups
            document.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('.dynamic-bounce')) {
                    App.audio.playFeedback('click');
                }
            });
        },

        syncHUD(state) {
            document.getElementById('hud-streak').innerText = `${state.streak} Day${state.streak > 1 ? 's' : ''}`;
            document.getElementById('hud-stars').innerText = state.stars;
            document.getElementById('hud-coins').innerText = state.coins;
            document.getElementById('hud-xp').innerText = `${state.xp} XP`;
            document.getElementById('hud-level-tag').innerText = `Lv. ${state.level}`;
            document.getElementById('hud-avatar-frame').innerText = state.avatar;
        },

        buildAvatarSelector(containerId, activeAvatar = '🐱') {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            COMPANION_AVATARS.forEach(av => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = `w-12 h-12 text-2xl border-4 rounded-xl flex items-center justify-center transition-all ${av === activeAvatar ? 'border-gamePurple bg-purple-100 scale-110' : 'border-gameDark hover:bg-gray-100'}`;
                btn.innerText = av;
                btn.onclick = () => {
                    // Clear selections
                    Array.from(container.children).forEach(c => c.classList.remove('border-gamePurple', 'bg-purple-100', 'scale-110'));
                    Array.from(container.children).forEach(c => c.classList.add('border-gameDark'));
                    btn.classList.add('border-gamePurple', 'bg-purple-100', 'scale-110');
                    btn.dataset.selected = av;
                };
                container.appendChild(btn);
            });
            // Set default selected dataset value attribute safely
            container.children[0].dataset.selected = activeAvatar;
        },

        renderDashboardView() {
            const state = App.storage.load();
            document.getElementById('dash-welcome-name').innerText = state.username;
            document.getElementById('dash-avatar-icon').innerText = state.avatar;

            // Compute dynamic Level Matrix Progression parameters
            const levelFloorXp = (state.level - 1) * 100;
            const nextLevelCeilXp = state.level * 100;
            const computedProgressPct = Math.min(100, Math.max(5, ((state.xp - levelFloorXp) / 100) * 100));

            document.getElementById('dash-xp-progress').style.width = `${computedProgressPct}%`;
            document.getElementById('dash-xp-text').innerText = `${state.xp} / ${nextLevelCeilXp} XP`;

            // Render Campaign maps grids loops infrastructure mapping safely
            const worldContainer = document.getElementById('world-maps-container');
            worldContainer.innerHTML = '';
            CAMPAIGN_WORLDS.forEach(world => {
                const isUnlocked = state.xp >= world.minXp;
                const card = document.createElement('div');
                card.className = `border-4 border-gameDark rounded-2xl p-4 text-white bg-gradient-to-br ${world.color} relative overflow-hidden shadow-cartoon transition-all ${isUnlocked ? 'cursor-pointer hover:-translate-y-1' : 'opacity-60 cursor-not-allowed'}`;

                card.innerHTML = `
                            <div class="absolute -right-4 -bottom-4 text-6xl opacity-20">${world.icon}</div>
                            <div class="flex justify-between items-start">
                                <span class="text-3xl">${world.icon}</span>
                                ${isUnlocked ? `<span class="bg-white/30 text-xs px-2 py-0.5 rounded-full uppercase">Active</span>` : `<span class="bg-gameDark text-white text-xs px-2 py-0.5 rounded-full"><i class="fa-solid fa-lock"></i> Locked</span>`}
                            </div>
                            <h4 class="heading-font text-lg mt-2">${world.name}</h4>
                            <p class="text-xs text-white/90">Curriculum Focus: ${world.category}</p>
                            ${!isUnlocked ? `<p class="text-[11px] mt-1 text-yellow-300 font-bold">Unlocks at ${world.minXp} XP</p>` : ''}
                        `;

                if (isUnlocked) {
                    card.onclick = () => {
                        App.storage.mutate(s => s.currentWorld = world.id);
                        App.game.launchGameArenaSession();
                    };
                }
                worldContainer.appendChild(card);
            });

            // Render Achievement Showcase lists blocks maps
            const badgesContainer = document.getElementById('dashboard-achievements-rack');
            badgesContainer.innerHTML = '';
            BADGES_DATABASE.forEach(badge => {
                const earned = state.unlockedBadges.includes(badge.id);
                const box = document.createElement('div');
                box.className = `border-2 border-gameDark rounded-xl p-3 text-center transition-all ${earned ? `${badge.color} opacity-100` : 'bg-gray-100 opacity-40 grayscale'}`;
                box.innerHTML = `
                            <div class="text-2xl">${badge.icon}</div>
                            <div class="text-xs font-bold truncate mt-1">${badge.title}</div>
                            <div class="text-[10px] text-gray-500 leading-tight">${badge.desc}</div>
                        `;
                badgesContainer.appendChild(box);
            });

            // Render game option mode triggers configurations interfaces controls
            const modes = [
                { id: 'normal', name: 'Adventure Quest', icon: 'fa-map' },
                { id: 'timed', name: 'Time Blitz Attack', icon: 'fa-stopwatch' },
                { id: 'endless', name: 'Endless Cosmos Run', icon: 'fa-infinity' }
            ];
            const modeRack = document.getElementById('game-mode-selector-rack');
            modeRack.innerHTML = '';
            modes.forEach(m => {
                const active = state.gameMode === m.id;
                const btn = document.createElement('button');
                btn.className = `w-full text-left p-3 rounded-xl border-2 border-gameDark flex items-center justify-between transition-all shadow-cartoon-sm ${active ? 'bg-gamePurple text-white' : 'bg-slate-50 text-gameDark hover:bg-gray-100'}`;
                btn.innerHTML = `
                            <span class="text-sm"><i class="fa-solid ${m.icon} mr-2"></i> ${m.name}</span>
                            ${active ? '<i class="fa-solid fa-circle-check"></i>' : ''}
                        `;
                btn.onclick = () => {
                    App.storage.mutate(s => s.gameMode = m.id);
                    App.ui.renderDashboardView();
                };
                modeRack.appendChild(btn);
            });
        },

        renderProfileView() {
            const state = App.storage.load();
            document.getElementById('profile-name-input').value = state.username;
            this.buildAvatarSelector('profile-avatar-grid', state.avatar);
        },

        // ADULT VERIFICATION GATE SECURITY METHOD HOOKS
        toggleParentVerification() {
            const valA = Math.floor(Math.random() * 8) + 3;
            const valB = Math.floor(Math.random() * 7) + 3;
            this.activeParentCodeAnswer = valA * valB;

            document.getElementById('parent-gate-question').innerText = `${valA} x ${valB} = ?`;
            document.getElementById('parent-gate-answer').value = '';
            document.getElementById('parent-gate-modal').classList.remove('hidden');
        },

        closeParentVerification() {
            document.getElementById('parent-gate-modal').classList.add('hidden');
        },

        verifyParentGateSubmit() {
            const givenAns = parseInt(document.getElementById('parent-gate-answer').value);
            if (givenAns === this.activeParentCodeAnswer) {
                this.closeParentVerification();
                App.router.navigate('parent');
            } else {
                App.audio.playFeedback('wrong');
                alert("Incorrect secure response answer! Accessible to parents or adults only.");
                this.closeParentVerification();
            }
        },

        triggerRewardCelebrationModal(title, desc, items = { stars: 5, coins: 10, xp: 15 }) {
            document.getElementById('reward-modal-title').innerText = title;
            document.getElementById('reward-modal-desc').innerText = desc;
            document.getElementById('reward-gain-stars').innerText = `+${items.stars}`;
            document.getElementById('reward-gain-coins').innerText = `+${items.coins}`;
            document.getElementById('reward-gain-xp').innerText = `+${items.xp} XP`;

            const modal = document.getElementById('reward-modal');
            const card = document.getElementById('reward-modal-card');

            modal.classList.remove('hidden');
            App.audio.playFeedback('reward');

            gsap.to(card, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });
        },

        closeRewardModal() {
            const card = document.getElementById('reward-modal-card');
            gsap.to(card, {
                scale: 0.8, opacity: 0, duration: 0.2, onComplete: () => {
                    document.getElementById('reward-modal').classList.add('hidden');
                    App.router.navigate('dashboard');
                }
            });
        },

        toggleLargeFont() {
            const currentSize = document.body.style.fontSize;
            document.body.style.fontSize = currentSize === '1.15rem' ? '1rem' : '1.15rem';
        }
    },

    // LOCAL AUTH MANAGEMENT ENGINE SYSTEM
    auth: {
        handleRegistration(e) {
            e.preventDefault();
            const chosenName = document.getElementById('auth-username').value.trim();
            const selectGrid = document.getElementById('avatar-selector-grid');
            const selectedActiveNode = selectGrid.querySelector('[data-selected]');
            const chosenAvatar = selectedActiveNode ? selectedActiveNode.dataset.selected : '🐱';

            App.storage.mutate(state => {
                state.username = chosenName || 'Explorer';
                state.avatar = chosenAvatar;
            });

            App.router.navigate('dashboard');
        },

        triggerGuestMode() {
            App.storage.mutate(state => {
                state.username = "StarExplorer";
                state.avatar = "🤖";
            });
            App.router.navigate('dashboard');
        },

        saveProfileEdits() {
            const newName = document.getElementById('profile-name-input').value.trim();
            const activeNode = document.getElementById('profile-avatar-grid').querySelector('[data-selected]');
            const newAv = activeNode ? activeNode.dataset.selected : '🐱';

            App.storage.mutate(state => {
                if (newName) state.username = newName;
                state.avatar = newAv;
            });
            App.router.navigate('dashboard');
        },

        resetAllGameData() {
            if (confirm("Are you sure you want to completely erase all progress, unlockable elements and histories?")) {
                localStorage.removeItem(App.storage.key);
                window.location.reload();
            }
        }
    },

    // AUDIO ARCHITECTURE SIMULATION ENGINE (STANDALONE NATIVE COMPATIBLE OVERRIDE)
    audio: {
        muted: false,

        toggleMuteState() {
            this.muted = !this.muted;
            const btn = document.getElementById('audio-mute-btn');
            if (this.muted) {
                btn.innerText = "MUTED";
                btn.classList.remove('bg-gameGreen');
                btn.classList.add('bg-gray-300');
            } else {
                btn.innerText = "ACTIVE";
                btn.classList.remove('bg-gray-300');
                btn.classList.add('bg-gameGreen');
            }
        },

        playFeedback(type) {
            if (this.muted) return;
            // Production fallback architecture mapping via cross-browser window synthesis native audio notes APIs
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);

                if (type === 'click') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, ctx.currentTime);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.05);
                } else if (type === 'correct') {
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                } else if (type === 'wrong') {
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220, ctx.currentTime);
                    osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
                    gain.gain.setValueAtTime(0.1, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                } else if (type === 'reward') {
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
                    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2);
                    gain.gain.setValueAtTime(0.15, ctx.currentTime);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.4);
                }
            } catch (e) {
                console.warn("Audio system initialized fallback context exception: ", e);
            }
        }
    },

    // PROCEDURAL CORE GAME REPLAY PLAYGROUND MECHANICS ENGINE
    game: {
        activeSession: null,
        timerIntervalPointer: null,

        initiateContinueGame() {
            this.launchGameArenaSession();
        },

        launchGameArenaSession() {
            const state = App.storage.load();
            const activeWorld = CAMPAIGN_WORLDS.find(w => w.id === state.currentWorld) || CAMPAIGN_WORLDS[0];

            // Setup internal state machine profile tracking data matrix loops configurations
            this.activeSession = {
                world: activeWorld,
                mode: state.gameMode,
                score: 0,
                combo: 1,
                currentQuestionIdx: 0,
                totalQuestionsCount: 5,
                timeAllowed: state.gameMode === 'timed' ? 20 : 45,
                timeLeft: 45,
                correctStreak: 0,
                historyLogData: [],
                hintsLeft: 3
            };

            this.activeSession.timeLeft = this.activeSession.timeAllowed;

            // Synchronize DOM elements UI fields tags values locations
            document.getElementById('arena-score').innerText = '0';
            document.getElementById('arena-combo').innerText = 'x1';
            document.getElementById('arena-info-difficulty').innerText = `Focus: ${activeWorld.category}`;
            document.getElementById('arena-world-identifier-tag').innerText = `Current Map: ${activeWorld.name}`;
            document.getElementById('arena-mascot-avatar').innerText = state.avatar;
            document.getElementById('hint-count-text').innerText = this.activeSession.hintsLeft;

            // Build question navigation status track lights dashboard indicator parameters tracker mapping arrays
            const dotsRack = document.getElementById('arena-question-dots');
            dotsRack.innerHTML = '';
            for (let i = 0; i < this.activeSession.totalQuestionsCount; i++) {
                const node = document.createElement('div');
                node.className = `w-4 h-4 rounded-full border-2 border-gameDark transition-all bg-gray-200`;
                node.id = `q-dot-${i}`;
                dotsRack.appendChild(node);
            }

            App.router.navigate('arena');
            this.generateNextProceduralQuestion();
            this.launchArenaTimerSystem();
        },

        launchArenaTimerSystem() {
            clearInterval(this.timerIntervalPointer);
            if (this.activeSession.mode === 'endless') {
                document.getElementById('arena-timer-container').classList.add('hidden');
                return;
            }
            document.getElementById('arena-timer-container').classList.remove('hidden');

            const pBar = document.getElementById('arena-timer-progress');
            const tText = document.getElementById('arena-timer-text');

            this.timerIntervalPointer = setInterval(() => {
                this.activeSession.timeLeft--;
                tText.innerText = `${this.activeSession.timeLeft}s`;

                const pct = (this.activeSession.timeLeft / this.activeSession.timeAllowed) * 100;
                pBar.style.width = `${pct}%`;

                if (this.activeSession.timeLeft <= 5) {
                    pBar.classList.remove('bg-gamePink');
                    pBar.classList.add('bg-red-500');
                } else {
                    pBar.classList.remove('bg-red-500');
                    pBar.classList.add('bg-gamePink');
                }

                if (this.activeSession.timeLeft <= 0) {
                    clearInterval(this.timerIntervalPointer);
                    this.finalizeGameArenaSession(true); // Complete via timeout failure flag fallback parameters
                }
            }, 1000);
        },

        generateNextProceduralQuestion() {
            // Update layout dot indicator states variables
            const idx = this.activeSession.currentQuestionIdx;
            const activeDot = document.getElementById(`q-dot-${idx}`);
            if (activeDot) {
                activeDot.classList.remove('bg-gray-200');
                activeDot.classList.add('bg-gameYellow', 'scale-110');
            }

            // Procedural generation core operations loops dependent configurations criteria selection categories matrices
            let category = this.activeSession.world.category;
            let questionString = "";
            let targetCorrectValue = 0;
            let choicesArray = [];

            const difficultyModifier = Math.min(3, Math.floor(App.storage.load().level / 2) + 1);

            if (category === 'Addition') {
                let a = Math.floor(Math.random() * (10 * difficultyModifier)) + 2;
                let b = Math.floor(Math.random() * (8 * difficultyModifier)) + 2;
                questionString = `${a} + ${b} = ?`;
                targetCorrectValue = a + b;
            } else if (category === 'Subtraction') {
                let a = Math.floor(Math.random() * (12 * difficultyModifier)) + 5;
                let b = Math.floor(Math.random() * a) + 1;
                questionString = `${a} - ${b} = ?`;
                targetCorrectValue = a - b;
            } else if (category === 'Multiplication') {
                let a = Math.floor(Math.random() * 5) + 2;
                let b = Math.floor(Math.random() * 9) + 1;
                questionString = `${a} × ${b} = ?`;
                targetCorrectValue = a * b;
            } else if (category === 'Division') {
                let b = Math.floor(Math.random() * 4) + 2;
                let targetCorrectValueSim = Math.floor(Math.random() * 5) + 1;
                let a = b * targetCorrectValueSim;
                questionString = `${a} ÷ ${b} = ?`;
                targetCorrectValue = targetCorrectValueSim;
            } else { // Fallback profile / Geometry / Fractions concepts simple mapping placeholders
                let elements = [2, 4, 6, 8];
                let selection = elements[Math.floor(Math.random() * elements.length)];
                questionString = `Sides of a square with parameter ${selection * 4}?`;
                targetCorrectValue = selection;
            }

            this.activeSession.currentTargetCorrectValue = targetCorrectValue;

            // Generate choices tracking grid matrix cleanly without duplicates records mapping values systems
            choicesArray.push(targetCorrectValue);
            while (choicesArray.length < 4) {
                let variance = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
                let potentialChoice = targetCorrectValue + variance;
                if (potentialChoice >= 0 && !choicesArray.includes(potentialChoice)) {
                    choicesArray.push(potentialChoice);
                }
            }
            // Shuffle utility parameters random indexes swaps positions
            choicesArray.sort(() => Math.random() - 0.5);

            // Inject to DOM workspace nodes
            document.getElementById('arena-question-text').innerText = questionString;

            const answersGrid = document.getElementById('arena-answers-grid');
            answersGrid.innerHTML = '';

            choicesArray.forEach((choice, index) => {
                const btn = document.createElement('button');
                btn.className = `choice-card-element bg-white hover:bg-slate-50 text-gameDark border-4 border-gameDark rounded-2xl py-4 text-2xl font-bold shadow-cartoon transition-all transform active:translate-y-1 active:shadow-cartoon-sm dynamic-bounce`;
                btn.innerText = choice;
                btn.onclick = () => this.evaluateUserSelectionSubmission(choice, btn);
                answersGrid.appendChild(btn);
            });

            // Trigger smooth entry transitions sequence
            gsap.fromTo("#question-box-wrapper", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
            gsap.fromTo(".choice-card-element", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stuffed: true, stale: true, delay: 0.05, staging: 0.05 });
        },

        triggerDynamicHint() {
            if (this.activeSession.hintsLeft <= 0) {
                alert("No remaining hints available for this level challenge loop session run!");
                return;
            }
            this.activeSession.hintsLeft--;
            document.getElementById('hint-count-text').innerText = this.activeSession.hintsLeft;

            // Highlight or eliminate one invalid mathematical choices options grid node block interface components
            const validAns = this.activeSession.currentTargetCorrectValue;
            const items = document.getElementsByClassName('choice-card-element');
            let removed = false;

            Array.from(items).forEach(btn => {
                if (parseInt(btn.innerText) !== validAns && !removed && !btn.disabled) {
                    btn.classList.add('opacity-30', 'line-through');
                    btn.disabled = true;
                    removed = true;
                }
            });
        },

        evaluateUserSelectionSubmission(chosenValue, nativeButtonNode) {
            const corr = this.activeSession.currentTargetCorrectValue;
            const isCorrect = chosenValue === corr;

            this.activeSession.historyLogData.push({
                index: this.activeSession.currentQuestionIdx,
                correct: isCorrect
            });

            if (isCorrect) {
                App.audio.playFeedback('correct');
                nativeButtonNode.classList.remove('bg-white');
                nativeButtonNode.classList.add('bg-gameGreen');

                // Increment dynamic stats
                this.activeSession.score += 10 * this.activeSession.combo;
                this.activeSession.correctStreak++;

                if (this.activeSession.correctStreak % 2 === 0) {
                    this.activeSession.combo++;
                    // Trigger dynamic background combo pulse tracking animation visually wrappers lines
                    const pulseNode = document.getElementById('combo-pulse-bg');
                    pulseNode.classList.remove('opacity-0');
                    pulseNode.classList.add('opacity-20');
                    setTimeout(() => pulseNode.classList.remove('opacity-20'), 300);
                }

                // Set dot visual status indicator check state values checks locations
                const activeDot = document.getElementById(`q-dot-${this.activeSession.currentQuestionIdx}`);
                if (activeDot) {
                    activeDot.classList.remove('bg-gameYellow');
                    activeDot.classList.add('bg-gameGreen');
                }

                document.getElementById('arena-mascot-dialogue').innerText = ["Incredible calculation!", "You're a math magician!", "Cosmic power level rising!"].sort(() => Math.random() - 0.5)[0];

            } else {
                App.audio.playFeedback('wrong');
                nativeButtonNode.classList.remove('bg-white');
                nativeButtonNode.classList.add('bg-gamePink');

                this.activeSession.combo = 1;
                this.activeSession.correctStreak = 0;

                const activeDot = document.getElementById(`q-dot-${this.activeSession.currentQuestionIdx}`);
                if (activeDot) {
                    activeDot.classList.remove('bg-gameYellow');
                    activeDot.classList.add('bg-gamePink');
                }

                document.getElementById('arena-mascot-dialogue').innerText = `Oops! The universe expected ${corr}. Let's get the next one!`;
            }

            document.getElementById('arena-score').innerText = this.activeSession.score;
            document.getElementById('arena-combo').innerText = `x${this.activeSession.combo}`;

            // Delay execution safely then proceed to route next question node indexes track states parameters updates
            // Freeze intermediate layout components pointer event nodes to protect tracking registers mutations errors logs
            document.getElementById('arena-answers-grid').style.pointerEvents = 'none';

            setTimeout(() => {
                document.getElementById('arena-answers-grid').style.pointerEvents = 'auto';
                this.activeSession.currentQuestionIdx++;

                if (this.activeSession.currentQuestionIdx < this.activeSession.totalQuestionsCount) {
                    this.generateNextProceduralQuestion();
                } else {
                    this.finalizeGameArenaSession(false);
                }
            }, 1200);
        },

        quitCurrentGameArena() {
            if (confirm("Are you sure you want to exit the active game map arena? Progress will not register.")) {
                clearInterval(this.timerIntervalPointer);
                App.router.navigate('dashboard');
            }
        },

        finalizeGameArenaSession(isTimeout = false) {
            clearInterval(this.timerIntervalPointer);

            const loggedHits = this.activeSession.historyLogData;
            const correctCount = loggedHits.filter(h => h.correct).length;
            const accuracyPct = loggedHits.length > 0 ? Math.round((correctCount / loggedHits.length) * 100) : 0;

            // Compute dynamic gamified items allocation payload schemas structure registers
            const baseStarsGained = correctCount * 2;
            const baseCoinsGained = correctCount * 5;
            const baseXpGained = (correctCount * 15) + (this.activeSession.score > 50 ? 20 : 0);

            // Mutate state persistent payload systems data frameworks interface records
            App.storage.mutate(state => {
                state.stars += baseStarsGained;
                state.coins += baseCoinsGained;
                state.xp += baseXpGained;

                // Automatic algorithmic execution computation engine module checking for level increments triggers maps boundaries checks
                const nextLevelTarget = state.level * 100;
                if (state.xp >= nextLevelTarget) {
                    state.level++;
                }

                // Push profile analytics log histories records dataset entry array models dynamically mapping fields elements
                const formattedIsoDate = new Date().toISOString().split('T')[0];
                state.history.push({
                    date: formattedIsoDate,
                    category: this.activeSession.world.category,
                    points: this.activeSession.score,
                    accuracy: accuracyPct,
                    timeSpent: this.activeSession.timeAllowed - this.activeSession.timeLeft
                });
            });

            // Trigger graphical UI overlay congratulations notification boxes modules hooks configurations
            let finishTitle = isTimeout ? "Time Elapsed!" : "World Mission Complete!";
            let finishDesc = `You decoded ${correctCount} out of ${this.activeSession.totalQuestionsCount} cosmic security equations effectively!`;

            App.ui.triggerRewardCelebrationModal(finishTitle, finishDesc, {
                stars: baseStarsGained,
                coins: baseCoinsGained,
                xp: baseXpGained
            });
        }
    },

    // PARENT INSIGHTS & ANALYTICS VISUALIZATION DASHBOARD CONTEXT MATRIX
    analytics: {
        chartPointerA: null,
        chartPointerB: null,

        renderParentDashboard() {
            const state = App.storage.load();

            // Core aggregation loops calculators from histories profiles dataset logs matrices schemas models data layers 
            const logs = state.history || [];
            const totalSessionsCount = logs.length;
            const aggregateSolvedCount = logs.reduce((acc, currentItem) => acc + Math.round(currentItem.points / 10), 0);
            const totalEstimatedTimeSpent = Math.round(logs.reduce((acc, currentItem) => acc + (currentItem.timeSpent || 0), 0) / 60);

            const computationalAccuracyMean = totalSessionsCount > 0
                ? Math.round(logs.reduce((acc, currentItem) => acc + currentItem.accuracy, 0) / totalSessionsCount)
                : 0;

            // Update parent statistical elements nodes mapping IDs variables targets text
            document.getElementById('p-metric-sessions').innerText = totalSessionsCount;
            document.getElementById('p-metric-accuracy').innerText = `${computationalAccuracyMean}%`;
            document.getElementById('p-metric-solved').innerText = aggregateSolvedCount;
            document.getElementById('p-metric-time').innerText = `${totalEstimatedTimeSpent} min${totalEstimatedTimeSpent !== 1 ? 's' : ''}`;

            this.renderCategorizedStrengthsRadarChart(logs);
            this.renderProgressTimelineLineChart(logs);
            this.generateDiagnosticRecommendationsEngine(logs);
        },

        renderCategorizedStrengthsRadarChart(logs) {
            const ctx = document.getElementById('parentChartCategories').getContext('2d');
            if (this.chartPointerA) this.chartPointerA.destroy();

            // Aggregate accuracy indices across specific subjects keys configurations matrices loops pipelines
            const categoryTrackerMap = { 'Addition': [], 'Subtraction': [], 'Multiplication': [], 'Division': [], 'Geometry': [] };
            logs.forEach(item => {
                if (categoryTrackerMap[item.category] !== undefined) {
                    categoryTrackerMap[item.category].push(item.accuracy);
                }
            });

            const radarLabels = Object.keys(categoryTrackerMap);
            const radarDatasetValues = radarLabels.map(lbl => {
                const scoreSet = categoryTrackerMap[lbl];
                return scoreSet.length > 0 ? Math.round(scoreSet.reduce((a, b) => a + b, 0) / scoreSet.length) : 0;
            });

            this.chartPointerA = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: radarLabels,
                    datasets: [{
                        label: 'Average Accuracy % Score',
                        data: radarDatasetValues,
                        backgroundColor: ['#6C5CE7', '#55E6C1', '#FF7675', '#74B9FF', '#FFD200'],
                        borderWidth: 3,
                        borderColor: '#2D3436',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        },

        renderProgressTimelineLineChart(logs) {
            const ctx = document.getElementById('parentChartTimeline').getContext('2d');
            if (this.chartPointerB) this.chartPointerB.destroy();

            // Sort chronologically extraction models mapping pipelines elements parameters nodes
            const tailLogs = logs.slice(-7); // Capture last 7 sessions sequence items runs history records data
            const sequenceLabels = tailLogs.map((item, index) => `Session #${index + 1}`);
            const accuracyTimelinePoints = tailLogs.map(item => item.accuracy);
            const pointsMetricTimelinePoints = tailLogs.map(item => item.points);

            this.chartPointerB = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sequenceLabels,
                    datasets: [
                        {
                            label: 'Accuracy Pct (%)',
                            data: accuracyTimelinePoints,
                            borderColor: '#6C5CE7',
                            backgroundColor: 'rgba(108, 92, 231, 0.1)',
                            tension: 0.3,
                            fill: true,
                            borderWidth: 4
                        },
                        {
                            label: 'Game Points Earned',
                            data: pointsMetricTimelinePoints,
                            borderColor: '#FF7675',
                            backgroundColor: 'transparent',
                            tension: 0.1,
                            borderWidth: 3,
                            borderDash: [6, 6]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 0, max: 100 } }
                }
            });
        },

        generateDiagnosticRecommendationsEngine(logs) {
            const listElementContainer = document.getElementById('parent-recommendations-list');
            listElementContainer.innerHTML = '';

            // Analyze performance markers parameters configurations thresholds checks fields
            const categoryTrackerMap = { 'Addition': [], 'Subtraction': [], 'Multiplication': [], 'Division': [], 'Geometry': [] };
            logs.forEach(item => {
                if (categoryTrackerMap[item.category] !== undefined) categoryTrackerMap[item.category].push(item.accuracy);
            });

            let generatedRecommendationsCount = 0;

            Object.keys(categoryTrackerMap).forEach(cat => {
                const historySet = categoryTrackerMap[cat];
                const meanAccuracy = historySet.length > 0 ? historySet.reduce((a, b) => a + b, 0) / historySet.length : null;

                if (meanAccuracy !== null && meanAccuracy < 75) {
                    generatedRecommendationsCount++;
                    const row = document.createElement('div');
                    row.className = "py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2";
                    row.innerHTML = `
                                <div>
                                    <span class="inline-block bg-rose-100 text-rose-700 font-bold border border-rose-300 rounded-lg px-2.5 py-0.5 text-xs uppercase mb-1">Target Remediation Required</span>
                                    <h5 class="font-bold text-gameDark text-sm sm:text-base">Focus Area Optimization: ${cat} Track</h5>
                                    <p class="text-xs text-gray-500 max-w-xl">Current mathematical operational accuracy score tracks lower at <span class="text-gamePink font-bold">${Math.round(meanAccuracy)}%</span>. Child experiences foundational structural calculation errors under load conditions inside this branch matrix environment pipelines.</p>
                                </div>
                                <button onclick="App.storage.mutate(s=>{s.currentWorld='${CAMPAIGN_WORLDS.find(w => w.category === cat)?.id || 'space_world'}'}); App.game.launchGameArenaSession();" class="bg-gameYellow border-2 border-gameDark text-xs px-3 py-1.5 rounded-xl shadow-cartoon-sm hover:bg-amber-400 self-start sm:self-center transition-all whitespace-nowrap">
                                    Launch Practice Arena <i class="fa-solid fa-arrow-right ml-1"></i>
                                </button>
                            `;
                    listElementContainer.appendChild(row);
                }
            });

            // General adaptive backup diagnostic placeholder if profile tracking fields show high competence scores registers
            if (generatedRecommendationsCount === 0) {
                listElementContainer.innerHTML = `
                            <div class="py-4 text-center text-gray-500 text-sm">
                                <i class="fa-solid fa-circle-check text-gameGreen text-3xl mb-2 block"></i>
                                Universal educational tracking logs verify steady performance markers profiles across active categories! All accuracy targets verify greater than 75% margins limits clean.
                            </div>
                        `;
            }
        }
    }
};

// LIFECYCLE PLATFORM BOOTSTRAP INITIALIZATION INVOKER TRIGGER RUNS
window.addEventListener('DOMContentLoaded', () => {
    App.ui.init();
});
