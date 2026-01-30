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

// Player
const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 150, // Adjusted Y position for larger height
    width: 70,
    height: 70,
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
        this.width = 90;
        this.height = 90;
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

// Event Listeners
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

// Touch Controls for Mobile
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    const touchX = e.touches[0].clientX;
    const middleX = window.innerWidth / 2;

    if (touchX < middleX) {
        keys.ArrowLeft = true;
        keys.ArrowRight = false;
    } else {
        keys.ArrowLeft = false;
        keys.ArrowRight = true;
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
});

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
    // Player Movement
    if (keys.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

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
