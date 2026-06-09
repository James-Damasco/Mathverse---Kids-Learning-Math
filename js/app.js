const BADGES_DATABASE = [
    { id: 'first_step', title: 'Novice Cadet', desc: 'Solved 1 question', icon: '🚀', color: 'bg-blue-100' },
    { id: 'addition_pro', title: 'Summoner Pro', desc: 'Mastered Addition', icon: '➕', color: 'bg-green-100' },
    { id: 'speed_demon', title: 'Speed Demon', desc: 'Combo level reached x5', icon: '⚡', color: 'bg-yellow-100' },
    { id: 'math_god', title: 'Grandmaster', desc: 'Earned 1000+ Total XP', icon: '👑', color: 'bg-purple-100' }
];

const CAMPAIGN_WORLDS = [
    { id: 'space_world', name: 'Space Cosmos', category: 'Addition', icon: '🪐', color: 'from-cyan-400 to-blue-500', minXp: 0 },
    { id: 'jungle_world', name: 'Jungle Safari', category: 'Subtraction', icon: '🌴', color: 'from-green-400 to-emerald-600', minXp: 40 },
    { id: 'candy_world', name: 'Candy Metropolis', category: 'Multiplication', icon: '🍬', color: 'from-pink-400 to-rose-500', minXp: 120 },
    { id: 'ocean_world', name: 'Deep Sea Trench', category: 'Division', icon: '🐙', color: 'from-blue-400 to-indigo-600', minXp: 250 },
    { id: 'dino_island', name: 'Dinosaur Island', category: 'Geometry', icon: '🦖', color: 'from-amber-500 to-orange-600', minXp: 450 }
];

const COMPANION_AVATARS = ['🐱', '🦊', '🐸', '🤖', '🦁', '🦄', '🐼', '🐨', '🦖', '🐝'];

// App State and Module Configs
const App = {
    db: null,
    authObj: null,
    userId: null,
    isOnline: true,
    storage: {
        key: 'mathverse_production_profile_v2',

        getInitialSchema() {
            return {
                username: 'Explorer',
                avatar: '🐱',
                xp: 0,
                level: 1,
                coins: 40,
                stars: 0,
                streak: 1,
                lastActiveTimestamp: Date.now(),
                unlockedBadges: ['first_step'],
                gameMode: 'normal',
                currentDifficulty: 'easy',
                purchasedWorlds: [],
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
            let parsed = JSON.parse(data);
            if (!parsed.currentDifficulty) parsed.currentDifficulty = 'easy';
            if (!parsed.purchasedWorlds) parsed.purchasedWorlds = [];
            return parsed;
        },

        save(data) {
            localStorage.setItem(this.key, JSON.stringify(data));
            App.storage.syncToCloud(data);
        },

        mutate(callback) {
            const current = this.load();
            callback(current);
            this.save(current);
            App.ui.syncHUD(current);
        },

        // Cloud Firestore Standback Persistent Pipe Sync (Rule 1, Rule 2, Rule 3 integration)
        async syncToCloud(localData) {
            if (!App.db || !App.userId) return;
            try {
                const userDocPath = firebase.firestore().doc(`artifacts/${App.appId}/users/${App.userId}/profile/state`);
                await userDocPath.set({
                    ...localData,
                    updatedAt: Date.now()
                }, { merge: true });

                // Sync to public leaderboard if star count changes
                const publicLeaderboardPath = firebase.firestore().doc(`artifacts/${App.appId}/public/data/leaderboard/${App.userId}`);
                await publicLeaderboardPath.set({
                    username: localData.username,
                    avatar: localData.avatar,
                    stars: localData.stars,
                    level: localData.level,
                    xp: localData.xp,
                    updatedAt: Date.now()
                });
                App.ui.updateSyncBadge(true);
            } catch (err) {
                console.warn("Storage sync offline or restricted", err);
                App.ui.updateSyncBadge(false);
            }
        }
    },

    router: {
        currentScreen: null,

        navigate(screenId) {
            const state = App.storage.load();
            if (!state.username && screenId !== 'auth') {
                screenId = 'auth';
            }

            document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
            const targetPanel = document.getElementById(`screen-${screenId}`);

            if (targetPanel) {
                targetPanel.classList.remove('hidden');
                this.currentScreen = screenId;

                if (screenId !== 'auth') {
                    document.getElementById('global-hud').classList.remove('hidden');
                } else {
                    document.getElementById('global-hud').classList.add('hidden');
                }

                if (screenId === 'dashboard') App.ui.renderDashboardView();
                if (screenId === 'parent') App.analytics.renderParentDashboard();
                if (screenId === 'profile') App.ui.renderProfileView();

                gsap.fromTo(targetPanel, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            }
        }
    },

    ui: {
        activeParentCodeAnswer: null,

        init() {
            const state = App.storage.load();
            this.syncHUD(state);

            if (!localStorage.getItem(App.storage.key)) {
                this.buildAvatarSelector('avatar-selector-grid');
                App.router.navigate('auth');
            } else {
                App.router.navigate('dashboard');
            }

            document.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('.dynamic-bounce')) {
                    App.audio.playFeedback('click');
                }
            });

            // Network offline trackers
            window.addEventListener('online', () => App.ui.updateSyncBadge(true));
            window.addEventListener('offline', () => App.ui.updateSyncBadge(false));
        },

        updateSyncBadge(isSynced) {
            const status = document.getElementById('sync-status');
            if (isSynced) {
                status.className = "text-xs bg-emerald-100 text-emerald-700 border-2 border-gameDark px-2 py-1 rounded-lg flex items-center gap-1 shadow-cartoon-sm";
                status.innerHTML = `<i class="fa-solid fa-cloud"></i> <span class="hidden md:inline">Online Sync</span>`;
            } else {
                status.className = "text-xs bg-amber-100 text-amber-700 border-2 border-gameDark px-2 py-1 rounded-lg flex items-center gap-1 shadow-cartoon-sm";
                status.innerHTML = `<i class="fa-solid fa-cloud-arrow-down animate-bounce"></i> <span class="hidden md:inline">Offline Cache</span>`;
            }
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
                    Array.from(container.children).forEach(c => c.classList.remove('border-gamePurple', 'bg-purple-100', 'scale-110'));
                    Array.from(container.children).forEach(c => c.classList.add('border-gameDark'));
                    btn.classList.add('border-gamePurple', 'bg-purple-100', 'scale-110');
                    btn.dataset.selected = av;
                };
                container.appendChild(btn);
            });
            container.children[0].dataset.selected = activeAvatar;
        },

        renderDashboardView() {
            const state = App.storage.load();
            document.getElementById('dash-welcome-name').innerText = state.username;
            document.getElementById('dash-avatar-icon').innerText = state.avatar;

            const levelFloorXp = (state.level - 1) * 100;
            const nextLevelCeilXp = state.level * 100;
            const computedProgressPct = Math.min(100, Math.max(5, ((state.xp - levelFloorXp) / 100) * 100));

            document.getElementById('dash-xp-progress').style.width = `${computedProgressPct}%`;
            document.getElementById('dash-xp-text').innerText = `${state.xp} / ${nextLevelCeilXp} XP`;

            ['easy', 'medium', 'hard'].forEach(d => {
                const targetBtn = document.getElementById(`diff-btn-${d}`);
                if (state.currentDifficulty === d) {
                    targetBtn.className = "bg-gamePurple text-white border-4 border-gameDark rounded-xl py-3 font-bold text-lg heading-font transition-all scale-105 shadow-inner-cartoon";
                } else {
                    targetBtn.className = "bg-white hover:bg-gray-50 text-gameDark border-4 border-gameDark rounded-xl py-3 font-bold text-lg heading-font transition-all shadow-cartoon-sm";
                }
            });

            // Render Campaign Maps Grid
            const worldContainer = document.getElementById('world-maps-container');
            worldContainer.innerHTML = '';
            CAMPAIGN_WORLDS.forEach(world => {
                const isUnlockedByXp = state.xp >= world.minXp;
                const isUnlockedByPurchase = state.purchasedWorlds && state.purchasedWorlds.includes(world.id);
                const isAvailable = isUnlockedByXp || isUnlockedByPurchase;

                const card = document.createElement('div');
                card.className = `border-4 border-gameDark rounded-2xl p-4 text-white bg-gradient-to-br ${world.color} relative overflow-hidden shadow-cartoon transition-all ${isAvailable ? 'cursor-pointer hover:-translate-y-1' : 'opacity-90'}`;

                let actionButtonMarkup = '';
                if (isAvailable) {
                    actionButtonMarkup = `<span class="bg-white/30 text-xs px-2 py-0.5 rounded-full uppercase font-bold">Ready</span>`;
                } else {
                    actionButtonMarkup = `
                                <button onclick="event.stopPropagation(); App.game.buyWorldEarly('${world.id}', 60)" class="mt-1 bg-gameYellow hover:bg-amber-400 text-gameDark border-2 border-gameDark px-2.5 py-1 text-xs rounded-xl shadow-cartoon-sm font-bold block relative z-20">
                                    Unlock 60 <i class='fa-solid fa-coins'></i>
                                </button>
                            `;
                }

                card.innerHTML = `
                            <div class="absolute -right-4 -bottom-4 text-6xl opacity-20">${world.icon}</div>
                            <div class="flex justify-between items-start">
                                <span class="text-3xl">${world.icon}</span>
                                ${isAvailable ? `<span class="bg-white/30 text-xs px-2 py-0.5 rounded-full uppercase">Active</span>` : `<span class="bg-gameDark text-white text-xs px-2 py-0.5 rounded-full"><i class="fa-solid fa-lock"></i> Locked</span>`}
                            </div>
                            <h4 class="heading-font text-lg mt-2">${world.name}</h4>
                            <p class="text-xs text-white/90">Curriculum: ${world.category}</p>
                            <div class="mt-2 flex justify-between items-center">
                                ${!isAvailable ? `<p class="text-[10px] text-yellow-200 font-bold">Needs ${world.minXp} XP</p>` : '<p class="text-[10px] text-white/70">Unlocked Matrix</p>'}
                                ${actionButtonMarkup}
                            </div>
                        `;

                if (isAvailable) {
                    card.onclick = () => {
                        App.storage.mutate(s => s.currentWorld = world.id);
                        App.game.launchGameArenaSession();
                    };
                }
                worldContainer.appendChild(card);
            });

            // Render Achievement Showcase Rack
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

            // Match Mode Choices
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
                btn.className = `w-full text-left p-3 rounded-xl border-2 border-gameDark flex items-center justify-between transition-all shadow-cartoon-sm ${active ? 'bg-gamePurple text-white font-bold' : 'bg-slate-50 text-gameDark hover:bg-gray-100'}`;
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

            // Initialize public leaderboard sync render
            App.multiplayer.refreshLeaderboard();
        },

        renderProfileView() {
            const state = App.storage.load();
            document.getElementById('profile-name-input').value = state.username;
            this.buildAvatarSelector('profile-avatar-grid', state.avatar);
        },

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
                alert("Incorrect answer! Security gate holds.");
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
            if (confirm("Are you sure you want to completely erase all progress logs?")) {
                localStorage.removeItem(App.storage.key);
                window.location.reload();
            }
        }
    },

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
                    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
                    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
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
                console.warn(e);
            }
        }
    },

    game: {
        activeSession: null,
        timerIntervalPointer: null,
        showCarryVisualizer: false,

        setDifficulty(levelMode) {
            App.storage.mutate(s => s.currentDifficulty = levelMode);
            App.ui.renderDashboardView();
        },

        buyWorldEarly(worldId, coinCost) {
            const state = App.storage.load();
            if (state.coins >= coinCost) {
                App.storage.mutate(s => {
                    s.coins -= coinCost;
                    if (!s.purchasedWorlds.includes(worldId)) {
                        s.purchasedWorlds.push(worldId);
                    }
                });
                App.audio.playFeedback('reward');
                alert("World unlocked early via coin booster! Ready for math action.");
                App.ui.renderDashboardView();
            } else {
                alert("Not enough coins! Solve more arena questions to collect rewards.");
            }
        },

        initiateContinueGame() {
            this.launchGameArenaSession();
        },

        launchGameArenaSession() {
            const state = App.storage.load();
            const activeWorld = CAMPAIGN_WORLDS.find(w => w.id === state.currentWorld) || CAMPAIGN_WORLDS[0];

            this.activeSession = {
                world: activeWorld,
                mode: state.gameMode,
                difficulty: state.currentDifficulty,
                score: 0,
                combo: 1,
                currentQuestionIdx: 0,
                timeAllowed: state.gameMode === 'timed' ? 25 : 60,
                timeLeft: 60,
                correctStreak: 0,
                historyLogData: [],
                hintsLeft: 3
            };

            this.activeSession.timeLeft = this.activeSession.timeAllowed;

            document.getElementById('arena-score').innerText = '0';
            document.getElementById('arena-combo').innerText = 'x1';
            document.getElementById('arena-info-difficulty').innerText = `Focus: ${activeWorld.category} (${state.currentDifficulty.toUpperCase()})`;
            document.getElementById('arena-world-identifier-tag').innerText = `Map: ${activeWorld.name}`;
            document.getElementById('arena-mascot-avatar').innerText = state.avatar;
            document.getElementById('hint-count-text').innerText = this.activeSession.hintsLeft;
            document.getElementById('buy-hint-btn').classList.add('hidden');

            document.getElementById('arena-question-dots').innerHTML = '';

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
                }

                if (this.activeSession.timeLeft <= 0) {
                    clearInterval(this.timerIntervalPointer);
                    this.finishCurrentGameArenaSession();
                }
            }, 1000);
        },

        getRandomNDigitNumber(digitsCount) {
            const min = Math.pow(10, digitsCount - 1);
            const max = Math.pow(10, digitsCount) - 1;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        generateNextProceduralQuestion() {
            const dotsRack = document.getElementById('arena-question-dots');
            const trackingNode = document.createElement('div');
            trackingNode.className = `w-4 h-4 rounded-full border border-gameDark bg-gameYellow flex-shrink-0 scale-110 transition-all`;
            trackingNode.id = `q-dot-${this.activeSession.currentQuestionIdx}`;
            dotsRack.appendChild(trackingNode);

            dotsRack.scrollLeft = dotsRack.scrollWidth;

            const category = this.activeSession.world.category;
            let questionString = "";
            let targetCorrectValue = 0;
            let choicesArray = [];

            let targetDigits = 2;
            if (this.activeSession.difficulty === 'medium') targetDigits = 3;
            if (this.activeSession.difficulty === 'hard') targetDigits = 4;

            let rawA = 0, rawB = 0;

            if (category === 'Addition') {
                rawA = this.getRandomNDigitNumber(targetDigits);
                rawB = this.getRandomNDigitNumber(targetDigits);
                questionString = `${rawA} + ${rawB} = ?`;
                targetCorrectValue = rawA + rawB;
            } else if (category === 'Subtraction') {
                rawA = this.getRandomNDigitNumber(targetDigits);
                rawB = Math.floor(Math.random() * (rawA - Math.pow(10, targetDigits - 1))) + Math.pow(10, targetDigits - 1);
                if (rawB > rawA) rawB = Math.floor(rawA / 2);
                questionString = `${rawA} - ${rawB} = ?`;
                targetCorrectValue = rawA - rawB;
            } else if (category === 'Multiplication') {
                rawA = this.getRandomNDigitNumber(targetDigits);
                rawB = Math.floor(Math.random() * 9) + 2;
                questionString = `${rawA} × ${rawB} = ?`;
                targetCorrectValue = rawA * rawB;
            } else if (category === 'Division') {
                let quotient = Math.floor(Math.random() * 9) + 2;
                let divisor = this.getRandomNDigitNumber(targetDigits - 1 || 1);
                rawA = divisor * quotient;
                rawB = divisor;
                questionString = `${rawA} ÷ ${rawB} = ?`;
                targetCorrectValue = quotient;
            } else {
                let baseVal = this.getRandomNDigitNumber(targetDigits - 1 || 1);
                questionString = `Perimeter of square with side lengths of ${baseVal}?`;
                targetCorrectValue = baseVal * 4;
                rawA = baseVal;
                rawB = 4;
            }

            this.activeSession.currentTargetCorrectValue = targetCorrectValue;
            this.activeSession.rawA = rawA;
            this.activeSession.rawB = rawB;

            choicesArray.push(targetCorrectValue);
            while (choicesArray.length < 4) {
                let variance = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);
                let potentialChoice = targetCorrectValue + variance;
                if (potentialChoice >= 0 && !choicesArray.includes(potentialChoice)) {
                    choicesArray.push(potentialChoice);
                }
            }
            choicesArray.sort(() => Math.random() - 0.5);

            document.getElementById('arena-question-text').innerText = questionString;

            if (this.showCarryVisualizer) {
                this.renderVisualCarryHelper();
            }

            const answersGrid = document.getElementById('arena-answers-grid');
            answersGrid.innerHTML = '';

            choicesArray.forEach((choice) => {
                const btn = document.createElement('button');
                btn.className = `choice-card-element bg-white hover:bg-slate-50 text-gameDark border-4 border-gameDark rounded-2xl py-4 text-2xl font-bold shadow-cartoon transition-all transform active:translate-y-1 active:shadow-cartoon-sm dynamic-bounce`;
                btn.innerText = choice;
                btn.onclick = () => this.evaluateUserSelectionSubmission(choice, btn);
                answersGrid.appendChild(btn);
            });

            gsap.fromTo("#question-box-wrapper", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
        },

        // Auto Carrie 1 Toggle & Visualizer Renderer
        toggleVisualCarryHelper() {
            this.showCarryVisualizer = !this.showCarryVisualizer;
            const panel = document.getElementById('carry-visualizer-panel');
            const btn = document.getElementById('auto-carry-btn');
            if (this.showCarryVisualizer) {
                panel.classList.remove('hidden');
                btn.classList.add('bg-gameGreen', 'text-gameDark');
                this.renderVisualCarryHelper();
            } else {
                panel.classList.add('hidden');
                btn.classList.remove('bg-gameGreen', 'text-gameDark');
            }
        },

        renderVisualCarryHelper() {
            const content = document.getElementById('carry-visualizer-content');
            if (!this.activeSession) return;

            const numA = this.activeSession.rawA;
            const numB = this.activeSession.rawB;
            const cat = this.activeSession.world.category;

            if (cat !== 'Addition' && cat !== 'Subtraction') {
                content.innerHTML = `<div class="text-xs text-gray-500">Auto Carry is active for Addition/Subtraction to demonstrate carry-over column arithmetic!</div>`;
                return;
            }

            // Simple mathematical alignment split
            const strA = numA.toString();
            const strB = numB.toString();
            const len = Math.max(strA.length, strB.length);
            const paddedA = strA.padStart(len, '0');
            const paddedB = strB.padStart(len, '0');

            let carries = Array(len).fill(0);
            let resultDigits = [];
            let carryExplain = "";

            if (cat === 'Addition') {
                let currentCarry = 0;
                for (let i = len - 1; i >= 0; i--) {
                    let sum = parseInt(paddedA[i]) + parseInt(paddedB[i]) + currentCarry;
                    if (sum >= 10) {
                        currentCarry = 1;
                        if (i > 0) carries[i - 1] = 1;
                    } else {
                        currentCarry = 0;
                    }
                }
                carryExplain = carries.includes(1)
                    ? "✨ Auto Carrie Helper detected column overflow! The <b>1</b> floats to the top column! ✨"
                    : "Simple alignment! No column overflow detected.";
            } else {
                // Subtraction borrow detection
                let borrows = Array(len).fill(0);
                let workA = paddedA.split('').map(Number);
                for (let i = len - 1; i >= 0; i--) {
                    if (workA[i] < parseInt(paddedB[i])) {
                        if (i > 0) {
                            workA[i - 1] -= 1;
                            borrows[i] = 1;
                        }
                    }
                }
                carries = borrows;
                carryExplain = borrows.includes(1)
                    ? "✨ Carrie Helper detected borrowing! We lend a <b>10</b> from the column directly left. ✨"
                    : "Simple alignment! No borrowing required.";
            }

            // Build columnized representation html layout 
            let colsHtml = `<div class="flex gap-4 font-mono text-lg font-bold">`;
            for (let i = 0; i < len; i++) {
                colsHtml += `
                            <div class="flex flex-col items-center bg-white p-2 border-2 border-gameDark rounded-xl">
                                <span class="text-xs text-gamePink">${carries[i] ? 'Carry 1' : '0'}</span>
                                <span class="border-b border-gray-300 w-8 text-center text-gray-400">${carries[i] ? '①' : ' '}</span>
                                <span class="text-gamePurple text-xl">${paddedA[i]}</span>
                                <span class="text-gamePink text-xl">${i === 0 ? (cat === 'Addition' ? '+' : '-') : ''} ${paddedB[i]}</span>
                                <span class="border-t-2 border-gameDark w-8 text-center mt-1"></span>
                            </div>
                        `;
            }
            colsHtml += `</div>`;
            colsHtml += `<p class="text-xs text-indigo-900 mt-2 font-sans">${carryExplain}</p>`;
            content.innerHTML = colsHtml;
        },

        triggerDynamicHint() {
            if (this.activeSession.hintsLeft <= 0) {
                document.getElementById('buy-hint-btn').classList.remove('hidden');
                alert("No free hints remaining! Purchase a hint with your coins.");
                return;
            }
            this.activeSession.hintsLeft--;
            document.getElementById('hint-count-text').innerText = this.activeSession.hintsLeft;

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

        purchaseHintWithCoins() {
            const state = App.storage.load();
            if (state.coins >= 10) {
                App.storage.mutate(s => s.coins -= 10);
                this.activeSession.hintsLeft++;
                document.getElementById('hint-count-text').innerText = this.activeSession.hintsLeft;
                document.getElementById('buy-hint-btn').classList.add('hidden');
                App.audio.playFeedback('reward');
                this.triggerDynamicHint();
            } else {
                alert("Not enough coins to purchase a hint!");
            }
        },

        evaluateUserSelectionSubmission(chosenValue, nativeButtonNode) {
            const corr = this.activeSession.currentTargetCorrectValue;
            const isCorrect = chosenValue === corr;

            this.activeSession.historyLogData.push({
                index: this.activeSession.currentQuestionIdx,
                correct: isCorrect
            });

            const activeDot = document.getElementById(`q-dot-${this.activeSession.currentQuestionIdx}`);

            if (isCorrect) {
                App.audio.playFeedback('correct');
                nativeButtonNode.classList.remove('bg-white');
                nativeButtonNode.classList.add('bg-gameGreen');

                this.activeSession.combo += 2;
                this.activeSession.score += 10 * this.activeSession.combo;
                this.activeSession.correctStreak++;

                const pulseNode = document.getElementById('combo-pulse-bg');
                pulseNode.classList.remove('opacity-0');
                pulseNode.classList.add('opacity-20');
                setTimeout(() => pulseNode.classList.remove('opacity-20'), 300);

                if (activeDot) {
                    activeDot.classList.remove('bg-gameYellow');
                    activeDot.classList.add('bg-gameGreen');
                }

                document.getElementById('arena-mascot-dialogue').innerText = "Incredible calculation! Combo boosted by +2!";

            } else {
                App.audio.playFeedback('wrong');
                nativeButtonNode.classList.remove('bg-white');
                nativeButtonNode.classList.add('bg-gamePink');

                this.activeSession.combo = 1;
                this.activeSession.correctStreak = 0;

                if (activeDot) {
                    activeDot.classList.remove('bg-gameYellow');
                    activeDot.classList.add('bg-gamePink');
                }

                document.getElementById('arena-mascot-dialogue').innerText = `Oops! The correct answer was ${corr}. Keep exploring!`;
            }

            document.getElementById('arena-score').innerText = this.activeSession.score;
            document.getElementById('arena-combo').innerText = `x${this.activeSession.combo}`;

            document.getElementById('arena-answers-grid').style.pointerEvents = 'none';

            setTimeout(() => {
                document.getElementById('arena-answers-grid').style.pointerEvents = 'auto';
                this.activeSession.currentQuestionIdx++;
                this.generateNextProceduralQuestion();
            }, 1200);
        },

        finishCurrentGameArenaSession() {
            clearInterval(this.timerIntervalPointer);

            const loggedHits = this.activeSession.historyLogData;
            const correctCount = loggedHits.filter(h => h.correct).length;
            const accuracyPct = loggedHits.length > 0 ? Math.round((correctCount / loggedHits.length) * 100) : 0;

            const baseStarsGained = correctCount * 2;
            const baseCoinsGained = correctCount * 5;
            const baseXpGained = (correctCount * 15) + (this.activeSession.score > 100 ? 30 : 0);

            App.storage.mutate(state => {
                state.stars += baseStarsGained;
                state.coins += baseCoinsGained;
                state.xp += baseXpGained;

                const nextLevelTarget = state.level * 100;
                if (state.xp >= nextLevelTarget) {
                    state.level++;
                }

                const formattedIsoDate = new Date().toISOString().split('T')[0];
                state.history.push({
                    date: formattedIsoDate,
                    category: this.activeSession.world.category,
                    points: this.activeSession.score,
                    accuracy: accuracyPct,
                    timeSpent: this.activeSession.timeAllowed - this.activeSession.timeLeft
                });
            });

            let finishTitle = "Quest Rewards Calculated!";
            let finishDesc = `You resolved ${correctCount} mathematical challenges total in this run under the endless system configuration matrix.`;

            App.ui.triggerRewardCelebrationModal(finishTitle, finishDesc, {
                stars: baseStarsGained,
                coins: baseCoinsGained,
                xp: baseXpGained
            });
        }
    },

    // Peer-To-Peer cloud rooms multiplayer engine integration (Rule 1, Rule 2, Rule 3)
    multiplayer: {
        activeRoomId: null,
        roomListener: null,
        isRivalAI: false,
        aiInterval: null,
        localCorrectCount: 0,
        rivalCorrectCount: 0,

        async createDuelRoom() {
            const state = App.storage.load();
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            this.activeRoomId = code;
            this.isRivalAI = false;
            this.localCorrectCount = 0;
            this.rivalCorrectCount = 0;

            try {
                const roomDocRef = firebase.firestore().doc(`artifacts/${App.appId}/public/data/rooms/${code}`);
                await roomDocRef.set({
                    roomId: code,
                    hostId: App.userId,
                    hostName: state.username,
                    hostScore: 0,
                    hostAvatar: state.avatar,
                    guestId: null,
                    guestName: null,
                    guestScore: 0,
                    guestAvatar: null,
                    question: "15 + 18 = ?",
                    correctAnswer: 33,
                    choices: [23, 33, 43, 35],
                    status: 'waiting',
                    updatedAt: Date.now()
                });

                this.listenToRoom(code);
                alert(`Duel Room Created! Share Code: ${code} with a friend to begin.`);
            } catch (err) {
                console.warn("Failed creating cloud room, launching fast simulated bot duel instead.", err);
                this.matchRandomOpponent();
            }
        },

        async joinDuelRoom() {
            const code = document.getElementById('join-room-code').value.trim().toUpperCase();
            if (code.length !== 4) {
                alert("Please provide a valid 4-digit code.");
                return;
            }
            const state = App.storage.load();
            this.activeRoomId = code;
            this.isRivalAI = false;
            this.localCorrectCount = 0;
            this.rivalCorrectCount = 0;

            try {
                const roomDocRef = firebase.firestore().doc(`artifacts/${App.appId}/public/data/rooms/${code}`);
                const snapshot = await roomDocRef.get();
                if (!snapshot.exists) {
                    alert("Room not found! Try starting a simulated fast match.");
                    return;
                }

                await roomDocRef.update({
                    guestId: App.userId,
                    guestName: state.username,
                    guestAvatar: state.avatar,
                    status: 'playing',
                    updatedAt: Date.now()
                });

                this.listenToRoom(code);
            } catch (err) {
                alert("Room Join Restricted or offline. Matching with AI.");
                this.matchRandomOpponent();
            }
        },

        matchRandomOpponent() {
            this.isRivalAI = true;
            this.activeRoomId = "AI_BOT";
            this.localCorrectCount = 0;
            this.rivalCorrectCount = 0;

            document.getElementById('multi-room-lbl').innerText = "MATCH: GLOBAL BOT";
            document.getElementById('multi-hero-name').innerText = App.storage.load().username;
            document.getElementById('multi-rival-name').innerText = "CosmicAI Kid";

            App.router.navigate('multiplayer');
            this.generateNextMultiplayerQuestion();
            this.startAIRivalSimulation();
        },

        startAIRivalSimulation() {
            clearInterval(this.aiInterval);
            this.aiInterval = setInterval(() => {
                if (Math.random() > 0.6) {
                    this.rivalCorrectCount++;
                    this.updateMultiScores();
                    if (this.rivalCorrectCount >= 5) {
                        this.declareDuelWinner(false);
                    }
                }
            }, 4000);
        },

        listenToRoom(code) {
            const roomDocRef = firebase.firestore().doc(`artifacts/${App.appId}/public/data/rooms/${code}`);
            App.router.navigate('multiplayer');
            document.getElementById('multi-room-lbl').innerText = `ROOM: ${code}`;

            this.roomListener = roomDocRef.onSnapshot((snap) => {
                if (!snap.exists) return;
                const data = snap.data();

                const isHost = data.hostId === App.userId;
                document.getElementById('multi-hero-name').innerText = isHost ? data.hostName : (data.guestName || "Waiting for Peer...");
                document.getElementById('multi-rival-name').innerText = isHost ? (data.guestName || "Searching Peer...") : data.hostName;

                this.localCorrectCount = isHost ? data.hostScore : data.guestScore;
                this.rivalCorrectCount = isHost ? data.guestScore : data.hostScore;

                this.updateMultiScores();

                if (data.status === 'playing' && document.getElementById('multi-arena-question-text').innerText === "2 + 2 = ?") {
                    this.generateNextMultiplayerQuestion();
                }

                if (this.localCorrectCount >= 5) {
                    this.declareDuelWinner(true);
                } else if (this.rivalCorrectCount >= 5) {
                    this.declareDuelWinner(false);
                }
            }, (err) => {
                console.error(err);
            });
        },

        updateMultiScores() {
            document.getElementById('multi-hero-score').innerText = `${this.localCorrectCount} / 5 Correct`;
            document.getElementById('multi-rival-score').innerText = `${this.rivalCorrectCount} / 5 Correct`;

            const heroPct = (this.localCorrectCount / 5) * 100;
            const rivalPct = (this.rivalCorrectCount / 5) * 100;

            document.getElementById('multi-hero-bar').style.width = `${heroPct}%`;
            document.getElementById('multi-rival-bar').style.width = `${rivalPct}%`;
        },

        generateNextMultiplayerQuestion() {
            const a = Math.floor(Math.random() * 80) + 10;
            const b = Math.floor(Math.random() * 80) + 10;
            const sum = a + b;
            const qString = `${a} + ${b} = ?`;

            document.getElementById('multi-arena-question-text').innerText = qString;

            let choices = [sum];
            while (choices.length < 4) {
                let potential = sum + (Math.floor(Math.random() * 10) + 1) * (Math.random() > 0.5 ? 1 : -1);
                if (potential >= 0 && !choices.includes(potential)) choices.push(potential);
            }
            choices.sort(() => Math.random() - 0.5);

            const grid = document.getElementById('multi-arena-answers-grid');
            grid.innerHTML = '';
            choices.forEach(ch => {
                const btn = document.createElement('button');
                btn.className = "bg-white hover:bg-indigo-50 border-4 border-gameDark rounded-2xl py-4 text-xl font-bold shadow-cartoon transition-all transform active:translate-y-1 active:shadow-cartoon-sm";
                btn.innerText = ch;
                btn.onclick = () => {
                    if (ch === sum) {
                        App.audio.playFeedback('correct');
                        this.submitMultiPoint();
                    } else {
                        App.audio.playFeedback('wrong');
                        alert(`Wrong! Focus up!`);
                    }
                };
                grid.appendChild(btn);
            });
        },

        async submitMultiPoint() {
            this.localCorrectCount++;
            this.updateMultiScores();

            if (this.isRivalAI) {
                if (this.localCorrectCount >= 5) {
                    this.declareDuelWinner(true);
                } else {
                    this.generateNextMultiplayerQuestion();
                }
            } else {
                try {
                    const isHost = (await firebase.firestore().doc(`artifacts/${App.appId}/public/data/rooms/${this.activeRoomId}`).get()).data().hostId === App.userId;
                    const roomDocRef = firebase.firestore().doc(`artifacts/${App.appId}/public/data/rooms/${this.activeRoomId}`);
                    if (isHost) {
                        await roomDocRef.update({ hostScore: this.localCorrectCount });
                    } else {
                        await roomDocRef.update({ guestScore: this.localCorrectCount });
                    }
                    this.generateNextMultiplayerQuestion();
                } catch (err) {
                    console.warn(err);
                }
            }
        },

        declareDuelWinner(isLocalUser) {
            clearInterval(this.aiInterval);
            if (this.roomListener) this.roomListener();

            if (isLocalUser) {
                App.storage.mutate(s => {
                    s.stars += 10;
                    s.coins += 20;
                    s.xp += 50;
                });
                App.ui.triggerRewardCelebrationModal("Multiplayer Champion!", "Outstanding speed calculations! You conquered the Star Duel and claimed +10 Stars!", { stars: 10, coins: 20, xp: 50 });
            } else {
                alert("The rival reached the destination first! Good effort, practice more in the techniques hub!");
                App.router.navigate('dashboard');
            }
        },

        leaveRoom() {
            clearInterval(this.aiInterval);
            if (this.roomListener) this.roomListener();
            App.router.navigate('dashboard');
        },

        async refreshLeaderboard() {
            const list = document.getElementById('leaderboard-list');
            if (!App.db) {
                list.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">Cloud database offline. Showing guest placeholder.</p>`;
                return;
            }
            try {
                const snap = await firebase.firestore().collection(`artifacts/${App.appId}/public/data/leaderboard`).get();
                let users = [];
                snap.forEach(doc => users.push(doc.data()));

                // Rule 2 compliant sorting in JS memory
                users.sort((a, b) => (b.stars || 0) - (a.stars || 0));

                if (users.length === 0) {
                    list.innerHTML = `<p class="text-center text-xs text-gray-400 py-4">No active records. Be the first champion!</p>`;
                    return;
                }

                let html = '';
                users.slice(0, 5).forEach((usr, idx) => {
                    html += `
                                <div class="flex items-center justify-between p-2.5 border-b border-gray-100 ${usr.username === App.storage.load().username ? 'bg-yellow-50' : ''}">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-gray-400">#${idx + 1}</span>
                                        <span class="text-xl">${usr.avatar || '🐱'}</span>
                                        <span class="text-xs font-bold">${usr.username}</span>
                                    </div>
                                    <span class="text-xs text-amber-500 font-bold"><i class="fa-solid fa-star"></i> ${usr.stars || 0}</span>
                                </div>
                            `;
                });
                list.innerHTML = html;
            } catch (err) {
                console.warn(err);
            }
        }
    },

    // Parent analytics with structured offline download option and Gemini AI API recommendation
    analytics: {
        chartPointerA: null,
        chartPointerB: null,
        diagnosticCache: "",

        renderParentDashboard() {
            const state = App.storage.load();
            const logs = state.history || [];
            const totalSessionsCount = logs.length;
            const aggregateSolvedCount = logs.reduce((acc, cItem) => acc + Math.round(cItem.points / 10), 0);
            const totalEstimatedTimeSpent = Math.round(logs.reduce((acc, cItem) => acc + (cItem.timeSpent || 0), 0) / 60);

            const computationalAccuracyMean = totalSessionsCount > 0
                ? Math.round(logs.reduce((acc, cItem) => acc + cItem.accuracy, 0) / totalSessionsCount)
                : 0;

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
                        label: 'Accuracy % Score',
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

            const tailLogs = logs.slice(-7);
            const sequenceLabels = tailLogs.map((item, idx) => `Run #${idx + 1}`);
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
                            label: 'Points Earned',
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
                                    <p class="text-xs text-gray-500 max-w-xl">Current mathematical operational accuracy score tracks lower at <span class="text-gamePink font-bold">${Math.round(meanAccuracy)}%</span>.</p>
                                </div>
                                <button onclick="App.storage.mutate(s=>{s.currentWorld='${CAMPAIGN_WORLDS.find(w => w.category === cat)?.id || 'space_world'}'}); App.game.launchGameArenaSession();" class="bg-gameYellow border-2 border-gameDark text-xs px-3 py-1.5 rounded-xl shadow-cartoon-sm hover:bg-amber-400 self-start sm:self-center transition-all whitespace-nowrap">
                                    Launch Practice Arena <i class="fa-solid fa-arrow-right ml-1"></i>
                                </button>
                            `;
                    listElementContainer.appendChild(row);
                }
            });

            if (generatedRecommendationsCount === 0) {
                listElementContainer.innerHTML = `
                            <div class="py-4 text-center text-gray-500 text-sm">
                                <i class="fa-solid fa-circle-check text-gameGreen text-3xl mb-2 block"></i>
                                Universal educational tracking logs verify steady performance markers profiles across active categories! All accuracy targets verify greater than 75% margins limits clean.
                            </div>
                        `;
            }
        },

        // Advancing Gemini-Based AI Diagnostic Report Creator
        async triggerAICustomDiagnosticReport() {
            const state = App.storage.load();
            const reportPanel = document.getElementById('ai-diagnostic-export-panel');
            const textDisplay = document.getElementById('ai-diagnostic-text');

            reportPanel.classList.remove('hidden');
            textDisplay.innerText = "Connecting to Gemini Cognitive Diagnostics. Compiling performance matrices...";

            const prompt = `Develop a formal mathematical pedagogical diagnostic report for a student explorer named ${state.username}. 
                                    Current profile level: ${state.level}. Total stars: ${state.stars}. Total experience: ${state.xp}.
                                    Recent calculated logs history: ${JSON.stringify(state.history)}. 
                                    Provide a constructive analysis containing:
                                    1. Performance telemetry overview.
                                    2. Actionable curricular recommendations.
                                    3. Friendly gamified steps to keep them motivated!`;

            let reportText = "";
            try {
                const apiKey = ""; // Empty string, provided by runtime execution context
                const response = await fetch(`https://genergenerativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: "You are a professional educational math psychologist specializing in young explorers cognitive skill-building." }] }
                    })
                });
                const data = await response.json();
                reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No AI feedback gathered.";
            } catch (err) {
                // Offline standard fallback formula compilation
                reportText = `==========================================================
MATHVERSE COGNITIVE RESEARCH LABS — DIAGNOSTIC EXPORT
==========================================================
STUDENT NAME: ${state.username}
LEVEL PROFILE: ${state.level}
STREAK COUNTER: ${state.streak} Days

Pedagogical Assessment Summary:
-------------------------------
The student exhibits solid exploration activity. Their average accuracy level is trending robustly.
To build high-performing neural calculation pathways, we recommend focusing on early subtraction borrowing techniques and ensuring column visualizers are kept active.

Action Plan Strategy:
--------------------
- Conduct 3 normal mode practice arena sessions.
- Play 2 Arithmetic duels to exercise instant mental recalling logic.
- Master auto-carry addition columns.`;
            }

            this.diagnosticCache = reportText;
            textDisplay.innerText = reportText;
        },

        downloadDiagnosticReport() {
            if (!this.diagnosticCache) {
                alert("Please generate the AI diagnostic report first!");
                return;
            }
            const element = document.createElement("a");
            const file = new Blob([this.diagnosticCache], { type: 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = `MathVerse_AI_Diagnostic_Report_${App.storage.load().username}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },

        copyDiagnosticReport() {
            if (!this.diagnosticCache) {
                alert("Please generate the AI diagnostic report first!");
                return;
            }
            // Rule compliance clipboard copy technique
            const tempInput = document.createElement("textarea");
            tempInput.value = this.diagnosticCache;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            alert("Report successfully copied to system clipboard!");
        }
    }
};

// Firebase Configuration & Initialization
window.addEventListener('DOMContentLoaded', () => {
    App.appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    if (typeof __firebase_config !== 'undefined') {
        const firebaseConfig = JSON.parse(__firebase_config);
        firebase.initializeApp(firebaseConfig);
        App.db = firebase.firestore();
        App.authObj = firebase.auth();

        // Authentication (Rule 3)
        const startAuth = async () => {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await App.authObj.signInWithCustomToken(__initial_auth_token);
            } else {
                await App.authObj.signInAnonymously();
            }
            App.userId = App.authObj.currentUser?.uid || "LocalGuestExplorer";
            App.ui.updateSyncBadge(true);
        };
        startAuth().catch(err => {
            console.warn("Firebase Auth failure, utilizing guest memory system.", err);
            App.userId = "LocalGuestExplorer";
            App.ui.updateSyncBadge(false);
        });
    }

    App.ui.init();
});

// Offline PWA Standalone installer button logic
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'block';
});

const pwaBtn = document.getElementById('pwa-install-btn');
if (pwaBtn) {
    pwaBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        } else {
            alert("This application is already installed or your browser doesn't support automatic PWA triggers. Try adding it to home screen manually!");
        }
    });
}
