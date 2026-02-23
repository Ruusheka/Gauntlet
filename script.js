const bgm = document.getElementById("bgm");
bgm.volume = 0.2; // subtle cinematic volume

function startBGM() {
    bgm.play().catch(() => { });
    document.removeEventListener("click", startBGM);
    document.removeEventListener("keydown", startBGM);
}

// Start on first interaction (invisible)
document.addEventListener("click", startBGM);
document.addEventListener("keydown", startBGM);

function toggleAudio() {
    bgm.muted = !bgm.muted;
    const volumePath = document.getElementById("volume-path");
    const speakerPath = document.getElementById("speaker-path");

    if (bgm.muted) {
        // Muted state: remove volume waves and add an 'X' or cross
        volumePath.style.display = "none";
        // Optionally update speaker path or add a line for 'muted'
        speakerPath.setAttribute("d", "M11 5L6 9H2v6h4l5 4V5z M23 9l-6 6 M17 9l6 6");
    } else {
        // Unmuted state: restore waves and basic speaker
        volumePath.style.display = "block";
        speakerPath.setAttribute("d", "M11 5L6 9H2v6h4l5 4V5z");
    }
}
// ═══════════════════════════════════════════════════════
// STATE & PERSISTENCE
// ═══════════════════════════════════════════════════════
const STATE_KEY = 'thanos_ctf_state';

function loadState() {
    try {
        const s = localStorage.getItem(STATE_KEY);
        return s ? JSON.parse(s) : { stage: 0, videosPlayed: {}, stonesUnlocked: [] };
    } catch (e) { return { stage: 0, videosPlayed: {}, stonesUnlocked: [] }; }
}

function saveState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let G = loadState();

// ═══════════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════════
(function spawnParticles() {
    const c = document.getElementById('particles');
    const colors = ['#c9a84c', '#8b6914', '#e8630a', '#7c1ac4', '#1a6bc4'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 1;
        p.style.cssText = `
width:${size}px;height:${size}px;
left:${Math.random() * 100}%;
background:${colors[Math.floor(Math.random() * colors.length)]};
animation-duration:${8 + Math.random() * 12}s;
animation-delay:${Math.random() * 10}s;
`;
        c.appendChild(p);
    }
})();

// ═══════════════════════════════════════════════════════
// TYPEWRITER
// ═══════════════════════════════════════════════════════
function typewriterText(text, callback) {
    const activeStage = document.querySelector('.stage.visible');
    if (!activeStage) {
        if (callback) callback();
        return;
    }

    const el = activeStage.querySelector('.clue-text');
    if (!el) {
        if (callback) callback();
        return;
    }

    // If empty text, clear and return
    if (!text) {
        el.style.opacity = '0';
        setTimeout(() => {
            el.innerHTML = '';
            el.style.opacity = '1';
            if (callback) callback();
        }, 500);
        return;
    }

    el.innerHTML = '';
    el.style.opacity = '1';

    let i = 0;
    const cursor = document.createElement('span');
    cursor.className = 'thanos-cursor';
    el.appendChild(cursor);

    function type() {
        if (i < text.length) {
            cursor.before(document.createTextNode(text[i]));
            i++;
            setTimeout(type, 45 + Math.random() * 30);
        } else {
            cursor.remove();
            el.style.textShadow = "0 0 15px #c9a84c";
            if (callback) callback();
        }
    }
    type();
}

// ═══════════════════════════════════════════════════════
// VIDEO PLAYER
// ═══════════════════════════════════════════════════════
function playVideo(src, callback, forcePlay) {
    // If already played, skip (unless forced)
    if (!forcePlay && G.videosPlayed[src]) {
        if (callback) callback();
        return;
    }

    document.body.classList.add('video-playing');
    const vc = document.getElementById('video-container');
    const v = document.getElementById('main-video');
    v.src = src;
    vc.classList.add('active');
    v.classList.remove('clear');

    v.play().catch(() => {
        // autoplay blocked — try muted
        v.muted = true;
        v.play();
    });

    v.addEventListener('play', () => {
        setTimeout(() => v.classList.add('clear'), 100);
    }, { once: true });

    v.addEventListener('ended', () => {
        document.body.classList.remove('video-playing');
        vc.classList.remove('active');
        v.src = '';
        v.classList.remove('clear');
        G.videosPlayed[src] = true;
        saveState(G);
        if (callback) callback();
    }, { once: true });
}

// ═══════════════════════════════════════════════════════
// LEVEL TITLE SCREEN
// ═══════════════════════════════════════════════════════
function showLevelTitle(num, name, callback) {
    const ls = document.getElementById('level-title-screen');
    document.getElementById('level-num').textContent = `STONE ${num} OF 4`;
    document.getElementById('level-name').textContent = name;

    // reset animation
    const ln = document.getElementById('level-name');
    const ld = document.getElementById('level-divider');
    ln.style.animation = 'none'; void ln.offsetHeight;
    ln.style.animation = 'level-appear 1s ease forwards';
    ld.style.animation = 'none'; void ld.offsetHeight;
    ld.style.animation = 'expand-line 1.5s ease forwards .5s';

    ls.classList.add('active');
    setTimeout(() => {
        ls.classList.remove('active');
        if (callback) callback();
    }, 3500);
}

// ═══════════════════════════════════════════════════════
// STONE UNLOCK
// ═══════════════════════════════════════════════════════
const stoneOrder = ['space', 'mind', 'reality', 'power'];
function unlockStone(n) {
    const stone = stoneOrder[n];
    if (!G.stonesUnlocked.includes(stone)) {
        G.stonesUnlocked.push(stone);
        saveState(G);
    }
    const el = document.querySelector(`.stone[data-stone="${stone}"]`);
    if (el) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
        el.classList.add('active-anim');
        setTimeout(() => el.classList.remove('active-anim'), 700);
    }
}

function restoreStones() {
    G.stonesUnlocked.forEach(s => {
        const el = document.querySelector(`.stone[data-stone="${s}"]`);
        if (el) { el.classList.remove('locked'); el.classList.add('unlocked'); }
    });
}

// ═══════════════════════════════════════════════════════
// SHOW/HIDE STAGES
// ═══════════════════════════════════════════════════════
function showStage(n) {
    // Clear all clues instantly to prevent race conditions
    document.querySelectorAll('.clue-text').forEach(el => {
        el.innerHTML = '';
        el.style.opacity = '1';
    });

    document.querySelectorAll('.stage').forEach(s => s.classList.remove('visible'));
    if (n > 0) document.getElementById(`stage${n}`).classList.add('visible');
}

// ═══════════════════════════════════════════════════════
// STAGE 1
// ═══════════════════════════════════════════════════════
function startStage1() {
    G.stage = 1;
    saveState(G);
    showStage(0);

    showLevelTitle(1, 'Illusion of Sight', () => {
        playVideo('assets/videos/intro1.mp4', () => {
            showStage(1);
            typewriterText(
                "Mortals believe what is visible.They trust the surface.They obey what appears locked.But reality does not answer to appearances.It answers to those who dare to look beneath."
            );
        });
    });
}

// Stage 1: btn is disabled — user must remove 'disabled' via DevTools
document.getElementById('btn-stage1').addEventListener('click', () => {
    solveStage1();
});

function solveStage1() {
    unlockStone(0);
    showStage(0);
    playVideo('assets/videos/vic1.mp4', () => {
        showLevelTitle(2, 'In Search of Identity', () => {
            playVideo('assets/videos/intro2.mp4', startStage2);
        });
    });
}

// ═══════════════════════════════════════════════════════
// STAGE 2
// ═══════════════════════════════════════════════════════
function startStage2() {
    G.stage = 2; saveState(G);
    showStage(2);
    typewriterText(
        "Reality bends to those with power.Become more than you are.Names are given.Roles are assigned.Power is inherited.But identity… Identity can be rewritten."
    );
}

function loginStage2() {
    const payload = { username: "player", role: "user" };
    const token = btoa(JSON.stringify(payload));
    localStorage.setItem('jwt', token);
    const td = document.getElementById('token-display');
    td.style.display = 'block';
    td.textContent = 'Token: ' + token;
}

function checkAdmin() {
    const token = localStorage.getItem('jwt');
    const res = document.getElementById('admin-result');
    if (!token) { res.textContent = 'No token found. Generate one first.'; res.className = 'result-box error'; return; }
    try {
        const decoded = JSON.parse(atob(token));
        if (decoded.role === 'Thanos') {
            res.textContent = '⬡ Admin Access Granted! Welcome, Thanos.';
            res.className = 'result-box success';
            document.getElementById('admin-panel').style.display = 'block';
            setTimeout(solveStage2, 1500);
        } else {
            res.textContent = `Access Denied. Role "${decoded.role}" is insufficient. Only Thanos may pass.`;
            res.className = 'result-box error';
        }
    } catch (e) {
        res.textContent = 'Token decode failed. Ensure base64 JSON is valid.';
        res.className = 'result-box error';
    }
}

function solveStage2() {
    unlockStone(1);
    showStage(0);
    playVideo('assets/video/vic2.mp4', () => {
        showLevelTitle(3, 'The Weight of Authority', () => {
            playVideo('assets/video/intro3.mp4', startStage3);
        });
    });
}

// ═══════════════════════════════════════════════════════
// STAGE 3
// ═══════════════════════════════════════════════════════
function startStage3() {
    G.stage = 3; saveState(G);
    showStage(3);
    typewriterText(
        "Power without understanding is meaningless.Seek the hidden endpoint.The universe keeps its state.Change the state… and you change destiny"
    );
}

function callRealityAPI() {
    const res = document.getElementById('api-result');
    if (localStorage.getItem('reality_level') === '3000') {
        res.textContent = '⬡ Reality Shift Complete! The stone acknowledges you.';
        res.className = 'result-box success';
        setTimeout(solveStage3, 1500);
    } else {
        res.textContent = 'Reality state incomplete.';
        res.className = 'result-box error';
    }
}

function solveStage3() {
    unlockStone(2);
    showStage(0);
    playVideo('assets/video/vic3.mp4', () => {
        showLevelTitle(4, 'The Illusion of Truth', () => {
            playVideo('assets/video/intro4.mp4', startStage4);
        });
    });
}

// ═══════════════════════════════════════════════════════
// STAGE 4
// ═══════════════════════════════════════════════════════
function startStage4() {
    G.stage = 4; saveState(G);
    showStage(4);
    typewriterText(
        "You have altered what you see, and who you are.Now alter what is true.The final stone awaits those who see through the last illusion.Nothing is fixed.Everything is subject to the will.The universe is a canvas.And you are the brush."
    );
}

function triggerFinalVictory() {
    showStage(0);
    playVideo('assets/video/final_vic4.mp4', () => {
        unlockStone(3);
        // Final end screen with flag — NO gauntlet flag shown in DOM before this
        G.stage = 5; saveState(G);
        showEndScreen();
    });
}

function showEndScreen() {
    // Typewriter the end screen title then show flag
    const es = document.getElementById('end-screen');
    es.classList.add('active');
    // Animate flag in
    const flag = document.getElementById('end-flag');
    flag.style.opacity = '0';
    flag.style.transform = 'scale(.8)';
    flag.style.transition = 'all 1.5s ease 1s';
    setTimeout(() => {
        flag.style.opacity = '1';
        flag.style.transform = 'scale(1)';
    }, 500);
}

// ═══════════════════════════════════════════════════════
// RESUME FROM SAVED STATE
// ═══════════════════════════════════════════════════════
function resumeGame() {
    restoreStones();
    const overlay = document.getElementById('black-overlay');

    switch (G.stage) {
        case 0:
        default:
            const header = document.getElementById('game-header');
            header.classList.add('intro-center');   // Center header on first load

            setTimeout(() => {
                overlay.classList.add('fade-out');

                setTimeout(() => {
                    overlay.classList.add('hidden');

                    // Move header back to top before game starts
                    header.classList.remove('intro-center');

                    startStage1();
                }, 2000);

            }, 1500);
            break;
        case 1:
            overlay.classList.add('hidden');
            showStage(1);
            typewriterText("Mortals believe what is visible.They trust the surface.They obey what appears locked.But reality does not answer to appearances.It answers to those who dare to look beneath.");
            break;
        case 2:
            overlay.classList.add('hidden');
            showStage(2);
            typewriterText("Reality bends to those with power.Become more than you are.Names are given.Roles are assigned.Power is inherited.But identity… Identity can be rewritten.");
            break;
        case 3:
            overlay.classList.add('hidden');
            showStage(3);
            typewriterText("Power without understanding is meaningless.Seek the hidden endpoint.The universe keeps its state.Change the state… and you change destiny");
            break;
        case 4:
            overlay.classList.add('hidden');
            showStage(4);
            typewriterText("You have altered what you see, and who you are.Now alter what is true.The final stone awaits those who see through the last illusion.Nothing is fixed.Everything is subject to the will.The universe is a canvas.And you are the brush.");
            break;
        case 5:
            overlay.classList.add('hidden');
            showEndScreen();
            break;
    }
}

// ═══════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', resumeGame);