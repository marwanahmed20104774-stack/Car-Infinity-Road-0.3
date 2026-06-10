const authScreen = document.getElementById('authScreen');
const gameWrapper = document.getElementById('gameWrapper');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const levelSelect = document.getElementById('levelSelect');
const deviceSelect = document.getElementById('deviceSelect'); 
const mobileControls = document.getElementById('mobileControls'); 

const playerNameDisplay = document.getElementById('playerName');
const currentLevelDisplay = document.getElementById('currentLevelDisplay');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverTitle = document.getElementById('gameOverTitle');
const finalScore = document.getElementById('finalScore');
const newRecordMsg = document.getElementById('newRecordMsg');
const curbLeft = document.getElementById('curbLeft');
const curbRight = document.getElementById('curbRight');
const fuelBar = document.getElementById('fuelBar');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const brakeBtn = document.getElementById('brakeBtn');

let currentUser = "";
let score = 0;
let highScore = 0;
let gameActive = false;

let playerX = 185; 
let baseRoadSpeed = 5; 
let roadSpeed = 5;     
const turnSpeed = 7; 
let curbOffset = 0;

let fuel = 100;
let fuelItem = { element: null, x: 0, y: -200, active: false };

const keys = { ArrowLeft: false, ArrowRight: false, Brake: false };
let enemyData = [];

// 🔊 صوت الديناصور (تأثير البييب المميز للـ Checkpoint برمجياً)
function playCheckpointSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.1, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc1.connect(gain1); gain1.connect(ctx.destination);
        osc1.start(); osc1.stop(ctx.currentTime + 0.1);

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(987.77, ctx.currentTime);
            gain2.gain.setValueAtTime(0.1, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc2.connect(gain2); gain2.connect(ctx.destination);
            osc2.start(); osc2.stop(ctx.currentTime + 0.15);
        }, 80);
    } catch (e) { console.log("Audio error:", e); }
}

function loginPlayer() {
    const name = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    if (name === "" || password === "") {
        alert("برجاء إدخال الاسم وكلمة المرور معاً!");
        return;
    }

    const savedPassword = localStorage.getItem('carGame_pass_' + name);

    if (savedPassword === null) {
        localStorage.setItem('carGame_pass_' + name, password);
        alert("تم إنشاء حساب جديد لك بنجاح! 🎉");
    } else {
        if (savedPassword !== password) {
            alert("❌ كلمة المرور خاطئة!");
            return;
        }
    }

    currentUser = name;
    playerNameDisplay.innerText = currentUser;

    const selectedLevel = levelSelect.value;
    if (selectedLevel === "easy") baseRoadSpeed = 5; 
    else if (selectedLevel === "medium") baseRoadSpeed = 8; 
    else if (selectedLevel === "hard") baseRoadSpeed = 12;
    currentLevelDisplay.innerText = selectedLevel === "easy" ? "سهل" : selectedLevel === "medium" ? "متوسط" : "صعب";
    roadSpeed = baseRoadSpeed;

    const selectedDevice = deviceSelect.value;
    if (selectedDevice === "mobile") {
        mobileControls.style.display = "block"; 
    } else {
        mobileControls.style.display = "none";  
    }

    highScore = localStorage.getItem('carGame_highScore_' + currentUser + '_' + selectedLevel) || 0;
    highScoreDisplay.innerText = highScore;

    authScreen.style.display = 'none';
    gameWrapper.style.display = 'block'; 
    
    initGameElements();
    gameActive = true;
    updateGame();
}

function initGameElements() {
    const oldLines = document.querySelectorAll('.line');
    const oldEnemies = document.querySelectorAll('.enemy-car');
    const oldFuel = document.querySelector('.fuel-item');
    oldLines.forEach(l => l.remove()); oldEnemies.forEach(e => e.remove());
    if(oldFuel) oldFuel.remove();
    
    enemyData = [];
    fuel = 100;
    fuelBar.style.width = '100%';

    for (let i = 0; i < 3; i++) {
        let line = document.createElement('div');
        line.classList.add('line');
        line.style.top = (i * 220) + 'px';
        gameArea.appendChild(line);
    }

    const numberOfEnemies = 5;
    for (let i = 0; i < numberOfEnemies; i++) {
        let enemy = document.createElement('div');
        enemy.classList.add('enemy-car');
        let typeId = i % 3; 
        enemy.classList.add('enemy-type-' + typeId);
        
        enemy.innerHTML = `
            <div class="spoiler"></div><div class="glass"></div>
            <div class="wheel wl"></div><div class="wheel wr"></div>
            <div class="wheel bl"></div><div class="wheel br"></div>
            <div class="headlight hl"></div><div class="headlight hr"></div>
        `;
        
        let startX = Math.floor(Math.random() * (gameArea.clientWidth - 75)) + 20;
        
        // 🎯 الـ Upgrade هنا: جعل مسافة البداية بعيدة جداً بالسالب لتأخير ظهور العربيات في بداية السباق
        // أول عربية هتبدأ من -600 والتانية من -850 وهكذا، فتاخد وقت عبال ما تنزل الشاشة
        let startTop = -600 - (i * 250); 
        
        enemy.style.top = startTop + 'px';
        enemy.style.left = startX + 'px';
        
        const racingGradients = [
            'linear-gradient(to top, #4ca1af, #c4e0e5)', 
            'linear-gradient(to top, #f12711, #f5af19)', 
            'linear-gradient(to top, #11998e, #38ef7d)'  
        ];
        enemy.style.background = racingGradients[typeId];
        gameArea.appendChild(enemy);

        enemyData.push({ element: enemy, x: startX, y: startTop, type: typeId, sideSpeed: (Math.random() * 1.4) - 0.7 });
    }

    fuelItem.element = document.createElement('div');
    fuelItem.element.classList.add('fuel-item');
    fuelItem.active = false;
    fuelItem.y = -300;
}

// ⌨️ تحكم الكيبورد (للكمبيوتر)
document.addEventListener('keydown', (e) => { 
    if (e.key === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.key === 'ArrowRight') keys.ArrowRight = true;
    if (e.key === 'ArrowDown' || e.key === ' ') { keys.Brake = true; player.classList.add('braking'); }
});
document.addEventListener('keyup', (e) => { 
    if (e.key === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.key === 'ArrowRight') keys.ArrowRight = false;
    if (e.key === 'ArrowDown' || e.key === ' ') { keys.Brake = false; player.classList.remove('braking'); }
});

// ==================== 📱🕹️ نظام التحكم الشامل بالأزرار (لمس ومواس) ====================

// ⬅️ زر السهم الشمال
leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowLeft = true; });
leftBtn.addEventListener('touchend', () => { keys.ArrowLeft = false; });
leftBtn.addEventListener('mousedown', () => { keys.ArrowLeft = true; }); 
leftBtn.addEventListener('mouseup', () => { keys.ArrowLeft = false; });   

// ➡️ زر السهم اليمين
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys.ArrowRight = true; });
rightBtn.addEventListener('touchend', () => { keys.ArrowRight = false; });
rightBtn.addEventListener('mousedown', () => { keys.ArrowRight = true; }); 
rightBtn.addEventListener('mouseup', () => { keys.ArrowRight = false; });   

// 🛑 زر الفرامل
brakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); keys.Brake = true; player.classList.add('braking'); });
brakeBtn.addEventListener('touchend', () => { keys.Brake = false; player.classList.remove('braking'); });
brakeBtn.addEventListener('mousedown', () => { keys.Brake = true; player.classList.add('braking'); }); 
brakeBtn.addEventListener('mouseup', () => { keys.Brake = false; player.classList.remove('braking'); });   

// حماية إضافية للماوس لو ساب الزرار بره النطاق
document.addEventListener('mouseup', () => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.Brake = false;
    player.classList.remove('braking');
});

function updateGame() {
    if (!gameActive) return;

    const maxRight = gameArea.clientWidth - 65; 

    if (keys.Brake) { roadSpeed = baseRoadSpeed * 0.4; } 
    else { roadSpeed = baseRoadSpeed; }

    if (keys.ArrowLeft && playerX > 20) { playerX -= turnSpeed; }
    if (keys.ArrowRight && playerX < maxRight) { playerX += turnSpeed; }
    player.style.left = playerX + 'px';

    fuel -= 0.05 * (roadSpeed / baseRoadSpeed);
    if (fuel <= 0) {
        fuel = 0; fuelBar.style.width = '0%';
        endGame("fuel_out"); return;
    }
    fuelBar.style.width = fuel + '%';

    curbOffset += roadSpeed;
    if (curbOffset >= 70) curbOffset = 0; 
    curbLeft.style.backgroundPosition = `0px ${curbOffset}px`;
    curbRight.style.backgroundPosition = `0px ${curbOffset}px`;

    let lines = document.querySelectorAll('.line');
    lines.forEach(line => {
        let top = parseInt(line.style.top);
        if (top >= 650) { top = -90; }
        line.style.top = (top + roadSpeed) + 'px';
    });

    if (!fuelItem.active && Math.random() < 0.003) { 
        fuelItem.x = Math.floor(Math.random() * (gameArea.clientWidth - 50)) + 20;
        fuelItem.y = -100;
        fuelItem.element.style.left = fuelItem.x + 'px';
        fuelItem.element.style.top = fuelItem.y + 'px';
        gameArea.appendChild(fuelItem.element);
        fuelItem.active = true;
    }

    if (fuelItem.active) {
        fuelItem.y += roadSpeed;
        fuelItem.element.style.top = fuelItem.y + 'px';
        if (isCollide(player, fuelItem.element)) {
            fuel = Math.min(fuel + 35, 100); 
            fuelItem.element.remove(); fuelItem.active = false;
        } else if (fuelItem.y >= 650) {
            fuelItem.element.remove(); fuelItem.active = false;
        }
    }

    enemyData.forEach(enemy => {
        let relativeSpeed = roadSpeed - 3; 
        if (relativeSpeed < 1.5) relativeSpeed = 1.5; 
        enemy.y += relativeSpeed;
        
        if (enemy.y >= 650) {
            let safeX = Math.floor(Math.random() * (gameArea.clientWidth - 75)) + 20;
            let minY = 0;
            enemyData.forEach(e => { if(e.y < minY) minY = e.y; });
            enemy.y = minY - 260; 
            enemy.x = safeX;
            enemy.sideSpeed = (Math.random() * 1.4) - 0.7; 
            
            score += 10;
            scoreDisplay.innerText = score;
            if (score > 0 && score % 200 === 0) { playCheckpointSound(); }
        }
        
        enemy.element.style.top = enemy.y + 'px';
        enemy.x += enemy.sideSpeed;
        if (enemy.x < 20 || enemy.x > maxRight) { enemy.sideSpeed *= -1; }
        enemy.element.style.left = enemy.x + 'px';

        if (isCollide(player, enemy.element)) { endGame("crash"); }
    });

    requestAnimationFrame(updateGame);
}

function isCollide(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();
    const p = 6; 
    return !(((aRect.bottom - p) < (bRect.top + p)) || ((aRect.top + p) > (bRect.bottom - p)) || ((aRect.right - p) < (bRect.left + p)) || ((aRect.left + p) > (bRect.right - p)));
}

function endGame(reason) {
    gameActive = false;
    finalScore.innerText = score;
    keys.ArrowLeft = false; keys.ArrowRight = false; keys.Brake = false;
    player.classList.remove('braking');
    if (reason === "fuel_out") gameOverTitle.innerText = "شطبت بنزين! ⛽💀";
    else gameOverTitle.innerText = "حادث عنيف! 💥";

    const selectedLevel = levelSelect.value;
    if (score > highScore) {
        highScore = score; highScoreDisplay.innerText = highScore;
        localStorage.setItem('carGame_highScore_' + currentUser + '_' + selectedLevel, highScore);
        newRecordMsg.style.display = 'block';
    } else { newRecordMsg.style.display = 'none'; }
    gameOverScreen.style.display = 'block';
}

function restartGame() {
    score = 0; scoreDisplay.innerText = score;
    playerX = (gameArea.clientWidth / 2) - 25;
    player.style.left = playerX + 'px';
    gameOverScreen.style.display = 'none';
    initGameElements();
    gameActive = true;
    updateGame();
}

function logout() {
    gameOverScreen.style.display = 'none';
    gameWrapper.style.display = 'none'; 
    authScreen.style.display = 'block'; 
    usernameInput.value = ""; passwordInput.value = "";
}