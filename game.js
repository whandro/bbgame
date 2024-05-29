const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800; // Állítsd be a canvas méretét itt
canvas.height = 600;

const beeImg = new Image();
beeImg.src = 'bee.png';

const flowerImages = [];
for (let i = 1; i <= 4; i++) {
    const img = new Image();
    img.src = `flower${i}.png`;
    flowerImages.push(img);
}

let bee = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 32,
    speed: 2,
    direction: { x: 0, y: 0 },
    angle: 0
};

let flowers = [];
let score = 0;
let misses = 0;
const maxMisses = 3;
let gameOver = false;
let gameTime = 0;
let gameEndTime = 0;
let lastRender = 0;
let gameRunning = false;
let gamePaused = false;

function resetGame() {
    bee = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 32,
        speed: 3,
        direction: { x: 0, y: 0 },
        angle: 0
    };
    flowers = [];
    score = 0;
    misses = 0;
    gameOver = false;
    gameTime = 0;
    gameEndTime = 0;
    lastRender = 0;
    gameRunning = true;
    gamePaused = false;
    spawnFlower();
}

function getRandomFlower() {
    const img = flowerImages[Math.floor(Math.random() * flowerImages.length)];
    const margin = 50;
    return {
        x: Math.random() * (canvas.width - 2 * margin) + margin,
        y: Math.random() * (canvas.height - 2 * margin) + margin,
        size: 0,
        maxSize: 50,
        state: 'growing', // growing, floating, withering
        time: 0,
        image: img
    };
}

function spawnFlower() {
    if (gameOver) return;
    if (gameRunning) {
      const flower = getRandomFlower();
      flowers.push(flower);
    }
    setTimeout(spawnFlower, Math.random() * 2000 + 1000);
}

function updateFlowers(deltaTime) {
    flowers.forEach(flower => {
        flower.time += deltaTime;
        if (flower.state === 'growing') {
            flower.size = (flower.time / 3000) * flower.maxSize;
            if (flower.time >= 3000) {
                flower.state = 'floating';
                flower.time = 0;
            }
        } else if (flower.state === 'floating') {
            flower.x += Math.sin(flower.time / 1000) / 20;
            if (flower.time >= 25000) {
                flower.state = 'withering';
                flower.time = 0;
            }
        } else if (flower.state === 'withering') {
            flower.size = flower.maxSize * (1 - flower.time / 5000);
            if (flower.time >= 5000) {
                flower.state = 'done';
                misses++;
            }
        }
    });
    flowers = flowers.filter(flower => flower.state !== 'done');
}

function drawFlowers() {
    flowers.forEach(flower => {
        ctx.drawImage(flower.image, flower.x - flower.size / 2, flower.y - flower.size / 2, flower.size, flower.size);
    });
}

function updateBee() {
    bee.x += bee.direction.x * bee.speed;
    bee.y += bee.direction.y * bee.speed;

    // Prevent the bee from going out of bounds
    bee.x = Math.max(bee.size / 2, Math.min(canvas.width - bee.size / 2, bee.x));
    bee.y = Math.max(bee.size / 2, Math.min(canvas.height - bee.size / 2, bee.y));

    // Update bee's angle based on direction
    if (bee.direction.x !== 0 || bee.direction.y !== 0) {
        bee.angle = Math.atan2(bee.direction.y, bee.direction.x) + Math.PI / 2;
    }
}

function drawBee() {
    ctx.save();
    ctx.translate(bee.x, bee.y);
    ctx.rotate(bee.angle);
    ctx.drawImage(beeImg, -bee.size / 2, -bee.size / 2, bee.size, bee.size);
    ctx.restore();
}

function checkCollisions() {
    flowers.forEach(flower => {
        const dx = bee.x - flower.x;
        const dy = bee.y - flower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < bee.size / 2 + flower.size / 2 && flower.state !== 'done') {
            score++;
            flower.state = 'done';
        }
    });
}

function drawUI() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Misses: ${misses}`, canvas.width - 100, 30);
    ctx.fillText(`Time: ${Math.floor(gameTime / 1000)}s`, canvas.width / 2 - 30, 30);

    if (gameOver) {
    		if (gameTime>3) gameEndTime = gameTime;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = '30px Arial';
        ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, canvas.height / 2 + 50);
        ctx.fillText(`Time: ${Math.floor(gameEndTime / 1000)}s`, canvas.width / 2 - 50, canvas.height / 2 + 100);
    		gameTime=0;
    } else if (!gameRunning) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Press Enter or Space to Start', canvas.width / 2 - 200, canvas.height / 2);
    } else if (gamePaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Paused', canvas.width / 2 - 70, canvas.height / 2);
    }
}

function gameLoop(timestamp) {
    if (gameRunning && !gamePaused) {
        const deltaTime = timestamp - lastRender;
        gameTime += deltaTime;
        updateBee();
        updateFlowers(deltaTime);
        checkCollisions();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBee();
        drawFlowers();
        drawUI();

        if (misses >= maxMisses) {
            gameOver = true;
            gameRunning = false;
            if (gameTime>3) gameEndTime = gameTime;
            gameTime=0
        }
    } else {
        drawUI();
    }
    if (gameOver) { gameTime=0 }
    lastRender = timestamp;
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            bee.direction.y = -1;
            break;
        case 'ArrowDown':
            bee.direction.y = 1;
            break;
        case 'ArrowLeft':
            bee.direction.x = -1;
            break;
        case 'ArrowRight':
            bee.direction.x = 1;
            break;
        case 'Enter':
        case ' ':
            if (gameOver) {
                resetGame();
            } else if (gameRunning) {
                gamePaused = !gamePaused;
            } else {
                gameRunning = true;
                requestAnimationFrame(gameLoop);
                spawnFlower();
            }
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            bee.direction.y = 0;
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
            bee.direction.x = 0;
            break;
    }
});

// Kezdeti játék állapot
drawUI();
