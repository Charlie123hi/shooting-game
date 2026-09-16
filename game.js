// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game State
let gameState = {
    score: 0,
    health: 100,
    wave: 1,
    gameOver: false,
    enemiesDefeated: 0
};

// Player Object
const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    width: 30,
    height: 30,
    speed: 5,
    health: 100,
    draw() {
        // Player body
        ctx.fillStyle = '#00d4ff';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Player indicator
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
    },
    update(keys) {
        if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
        if (keys['ArrowUp'] || keys['w']) this.y -= this.speed;
        if (keys['ArrowDown'] || keys['s']) this.y += this.speed;

        // Boundary check
        this.x = Math.max(this.width / 2, Math.min(canvas.width - this.width / 2, this.x));
        this.y = Math.max(this.height / 2, Math.min(canvas.height - this.height / 2, this.y));
    }
};

// Bullets Array
let bullets = [];

class Bullet {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.speed = 7;
        this.size = 5;
        
        // Calculate direction
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    isOffScreen() {
        return this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height;
    }
}

// Enemies Array
let enemies = [];

class Enemy {
    constructor(x, y, speed = 2) {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 25;
        this.speed = speed;
        this.health = 1;
    }

    update() {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // Enemy eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 8, this.y - 5, 4, 4);
        ctx.fillRect(this.x + 4, this.y - 5, 4, 4);
    }

    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

canvas.addEventListener('click', (e) => {
    if (gameState.gameOver) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    bullets.push(new Bullet(player.x, player.y, mouseX, mouseY));
});

// Spawn Enemies
function spawnEnemies() {
    const enemyCount = Math.min(3 + gameState.wave, 10);
    const speed = 1 + gameState.wave * 0.3;
    
    for (let i = 0; i < enemyCount; i++) {
        let x, y;
        const side = Math.random();
        
        if (side < 0.25) {
            x = Math.random() * canvas.width;
            y = -20;
        } else if (side < 0.5) {
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
        } else if (side < 0.75) {
            x = -20;
            y = Math.random() * canvas.height;
        } else {
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
        }
        
        enemies.push(new Enemy(x, y, speed));
    }
}

// Check Collisions
function checkCollisions() {
    // Bullet-Enemy collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            const bullet = bullets[i];
            const enemy = enemies[j];
            
            if (bullet.distanceTo(enemy.x, enemy.y) < 15) {
                bullets.splice(i, 1);
                enemy.health--;
                
                if (enemy.health <= 0) {
                    enemies.splice(j, 1);
                    gameState.score += 10;
                    gameState.enemiesDefeated++;
                }
                break;
            }
        }
    }

    // Enemy-Player collisions
    for (let enemy of enemies) {
        if (player.distanceTo(enemy.x, enemy.y) < 30) {
            gameState.health -= 0.5;
            
            if (gameState.health <= 0) {
                gameState.gameOver = true;
            }
        }
    }
}

player.distanceTo = function(x, y) {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
};

// Update UI
function updateUI() {
    document.getElementById('score').textContent = `Score: ${Math.floor(gameState.score)}`;
    document.getElementById('health').textContent = `Health: ${Math.max(0, Math.floor(gameState.health))}`;
    document.getElementById('wave').textContent = `Wave: ${gameState.wave}`;
}

// Game Loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameState.gameOver) {
        // Update
        player.update(keys);
        
        bullets.forEach(bullet => bullet.update());
        bullets = bullets.filter(b => !b.isOffScreen());
        
        enemies.forEach(enemy => enemy.update());
        
        checkCollisions();

        // Check wave completion
        if (enemies.length === 0 && gameState.enemiesDefeated > 0) {
            gameState.wave++;
            gameState.enemiesDefeated = 0;
            spawnEnemies();
        }

        // Spawn initial enemies
        if (enemies.length === 0 && gameState.wave === 1) {
            spawnEnemies();
        }

        // Draw
        player.draw();
        bullets.forEach(bullet => bullet.draw());
        enemies.forEach(enemy => enemy.draw());

        updateUI();
    } else {
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = `Final Score: ${Math.floor(gameState.score)}`;
    }

    requestAnimationFrame(gameLoop);
}

// Start Game
gameLoop();
