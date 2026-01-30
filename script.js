const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startBtn = document.getElementById('start-btn');

const poopImg = new Image();
poopImg.src = '똥.png';

const playerImg = new Image();
playerImg.src = '피하는.png';

// Game state
let gameRunning = false;
let score = 0;
let animationId;
let poops = [];
let lastTime = 0;
let poopSpawnTimer = 0;

// Responsive Sizing
const isMobile = window.innerWidth <= 600;
const playerSize = isMobile ? 30 : 40; // Smaller on mobile (30px), Standard on PC (40px)
const poopSize = isMobile ? 35 : 45;   // Smaller on mobile (35px), Standard on PC (45px)

// Player
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 100, // Adjusted Y position (needs to be near bottom)
    width: playerSize,
    height: playerSize,
    speed: 5,
    dx: 0,
    color: 'blue'
};

// Controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false
};

// Poop Class
class Poop {
    constructor() {
        const isGiant = Math.random() < 0.1; // 10% chance (1 out of 10)
        const sizeMultiplier = isGiant ? 3 : 1;

        this.width = poopSize * sizeMultiplier;
        this.height = poopSize * sizeMultiplier;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = 2 + Math.random() * 3; // Random speed between 2 and 5
        this.color = '#8B4513'; // Brown
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        if (poopImg.complete && poopImg.naturalHeight !== 0) {
            ctx.drawImage(poopImg, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Event Listeners (Keyboard)
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        keys[e.key] = false;
    }
});

// --- NEW MOBILE GLOBAL TOUCH CONTROLS ---

const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

function handleGlobalTouch(e) {
    // Allow start button to be clicked (it's a Button element)
    if (e.target.id === 'start-btn') return;

    e.preventDefault(); // Prevent scrolling/zooming

    // Reset keys locally first - we recalculate based on current touches
    let moveLeft = false;
    let moveRight = false;

    // Check all active touches
    for (let i = 0; i < e.touches.length; i++) {
        const touchX = e.touches[i].clientX;
        const middleX = window.innerWidth / 2;

        if (touchX < middleX) {
            moveLeft = true;
        } else {
            moveRight = true;
        }
    }

    // Apply strict Left/Right logic
    keys.ArrowLeft = moveLeft;
    keys.ArrowRight = moveRight;

    // Update Visual Feedback
    updateVisualButtons(moveLeft, moveRight);
}

function updateVisualButtons(left, right) {
    if (left) {
        leftBtn.style.transform = 'scale(1.1)';
        leftBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    } else {
        leftBtn.style.transform = 'scale(1)';
        leftBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    }

    if (right) {
        rightBtn.style.transform = 'scale(1.1)';
        rightBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    } else {
        rightBtn.style.transform = 'scale(1)';
        rightBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    }
}

// Attach to window to catch drags anywhere
window.addEventListener('touchstart', handleGlobalTouch, { passive: false });
window.addEventListener('touchmove', handleGlobalTouch, { passive: false });
window.addEventListener('touchend', handleGlobalTouch, { passive: false });
window.addEventListener('touchcancel', handleGlobalTouch, { passive: false });

// Mouse listeners for visual feedback on PC (optional, but good for testing)
window.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('touch-btn')) {
        if (e.target.id === 'left-btn') keys.ArrowLeft = true;
        if (e.target.id === 'right-btn') keys.ArrowRight = true;
        updateVisualButtons(keys.ArrowLeft, keys.ArrowRight);
    }
});
window.addEventListener('mouseup', () => {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    updateVisualButtons(false, false);
});
// ----------------------------------------

startBtn.addEventListener('click', startGame);

function startGame() {
    if (gameRunning) return;

    // Reset game state
    gameRunning = true;
    score = 0;
    poops = [];
    player.x = canvas.width / 2 - 20;
    scoreElement.innerText = score;
    startBtn.style.display = 'none';

    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Player Movement (Delta based to prevent jitter)
    let dx = 0;
    if (keys.ArrowLeft) dx -= player.speed;
    if (keys.ArrowRight) dx += player.speed;

    // Apply movement
    player.x += dx;

    // Clamp position (Keep inside canvas)
    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

    // Spawn Poops
    poopSpawnTimer += deltaTime;
    if (poopSpawnTimer > 500) { // Spawn every 500ms
        poops.push(new Poop());
        poopSpawnTimer = 0;
        score++; // Score increases over time/survival
        scoreElement.innerText = score;
    }

    // Update Poops
    for (let i = 0; i < poops.length; i++) {
        poops[i].update();

        // Remove off-screen poops
        if (poops[i].y > canvas.height) {
            poops.splice(i, 1);
            i--;
            continue;
        }

        // Collision Detection
        if (checkCollision(player, poops[i])) {
            endGame();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    if (playerImg.complete && playerImg.naturalHeight !== 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw Poops
    poops.forEach(poop => poop.draw());
}

function gameLoop(timestamp) {
    if (!gameRunning) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    animationId = requestAnimationFrame(gameLoop);
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    alert(`게임 오버! 당신의 점수는 ${score}점 입니다.`);
    startBtn.style.display = 'inline-block';
    startBtn.innerText = '다시 시작';
}
