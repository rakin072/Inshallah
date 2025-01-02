const canvas = document.getElementById('flappyBird');
const context = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const retryButton = document.getElementById('retryButton');
const finalScore = document.getElementById('finalScore');

// Sound effects
const flapSound = new Audio('sounds/flap.mp3');
const scoreSound = new Audio('sounds/score.mp3');
const collisionSound = new Audio('sounds/collision.mp3');

// Set canvas to full-screen size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Load new background image
const backgroundImage = new Image();
backgroundImage.src = "images/background.jpg"; // Local background image

// Bird properties and methods
const bird = {
    x: 50,
    y: 150,
    width: 40,
    height: 30,
    gravity: 0.2,
    lift: -6,
    velocity: 0,
    hasFlapped: false,  // Flag to track if the bird has flapped

    draw() {
        context.drawImage(birdImage, this.x, this.y, this.width, this.height);
    },

    update() {
        if (this.hasFlapped) {
            this.velocity += this.gravity;
            this.y += this.velocity;

            if (this.y + this.height > canvas.height) {
                this.y = canvas.height - this.height;
                this.velocity = 0;
            }
        }
    },

    reset() {
        this.y = 150;
        this.velocity = 0;
        this.hasFlapped = false;  // Reset the flapped state when restarting
    }
};

// Load bird and pipe images
const birdImage = new Image();
birdImage.src = "images/bird.png";  // Local bird image

const pipeImage = new Image();
pipeImage.src = "images/pipe.png"; // Local pipe image

// Pipe properties and methods
const pipes = [];
const pipeWidth = 50;
const pipeGap = 220;
let pipeSpeed = 3;
let frameCount = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let isGameOver = false;
let isGamePaused = true;

// Save game state
let savedGameState = null;
let retryButtonUsed = false;  // Flag to track if Retry button is used

function generatePipe() {
    const pipeHeight = Math.random() * (canvas.height / 2) + 30;
    pipes.push({ x: canvas.width, y: 0, height: pipeHeight, isTop: true, passed: false });
    pipes.push({ x: canvas.width, y: pipeHeight + pipeGap, height: canvas.height - pipeHeight - pipeGap, isTop: false });
}

function drawPipes() {
    pipes.forEach(pipe => {
        context.drawImage(pipeImage, pipe.x, pipe.y, pipeWidth, pipe.height);
    });
}

function updatePipes() {
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        if (!pipe.passed && pipe.isTop && pipe.x + pipeWidth < bird.x) {
            score++;
            pipe.passed = true;
            scoreSound.play(); // Play scoring sound
        }
    });

    if (pipes.length && pipes[0].x + pipeWidth < 0) {
        pipes.splice(0, 2);
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
}

function detectCollision() {
    const collided = pipes.some(pipe => 
        bird.x < pipe.x + pipeWidth &&
        bird.x + bird.width > pipe.x &&
        bird.y < pipe.y + pipe.height &&
        bird.y + bird.height > pipe.y
    ) || bird.y < 0 || bird.y + bird.height > canvas.height;

    if (collided) {
        collisionSound.play(); // Play collision sound
    }

    return collided;
}

function showGameOverPopup() {
    document.getElementById('gameOverPopup').style.display = "block";
    document.getElementById('finalScore').textContent = `Your Score: ${score}`;

    // Display "Retry" and "Play Again" buttons only once
    if (!retryButtonUsed) {
        document.getElementById('popupRetryButton').style.display = "inline-block";
    } else {
        document.getElementById('popupRetryButton').style.display = "none";
    }
}

function drawBackground() {
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function drawScore() {
    context.fillStyle = "#FFD700";  // Gold color for Score
    context.font = "24px Arial";
    context.textShadow = "3px 3px 5px rgba(0, 0, 0, 0.7)";  // Adding 3D shadow
    context.fillText(`Score: ${score}`, 20, 30);
}

function drawHighScore() {
    context.fillStyle = "#FFD700";  // Gold color for High Score
    context.font = "24px Arial";
    context.textShadow = "3px 3px 5px rgba(0, 0, 0, 0.7)";  // Adding 3D shadow
    context.fillText(`High Score: ${highScore}`, 20, 60);
}

function gameLoop() {
    if (isGamePaused || isGameOver) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    bird.draw();
    bird.update();

    if (frameCount % 100 === 0) generatePipe();

    drawPipes();
    updatePipes();

    drawScore();
    drawHighScore();

    if (detectCollision()) {
        isGameOver = true;
        savedGameState = {
            birdY: bird.y,
            birdVelocity: bird.velocity,
            pipes: [...pipes],
            score: score,
            frameCount: frameCount
        };
        showGameOverPopup();
        return;
    }

    frameCount++;
    requestAnimationFrame(gameLoop);
}

document.getElementById('startButton').addEventListener('click', () => {
    isGamePaused = false;
    document.getElementById('gameMenu').style.display = "none";
    gameLoop();
});

document.getElementById('popupRetryButton').addEventListener('click', () => {
    if (savedGameState && !retryButtonUsed) {
        retryButtonUsed = true;

        // Clear pipes completely to prevent overlapping
        pipes.length = 0;

        // Restore the saved game state
        bird.y = savedGameState.birdY;
        bird.velocity = savedGameState.birdVelocity;
        bird.hasFlapped = false;  // Reset flapped state on retry

        savedGameState.pipes.forEach(pipe => {
            pipe.x += 150;  // Move pipes forward to maintain space between them
            pipes.push(pipe);
        });

        // Adjust the score to be one less than the saved score
        score = Math.max(savedGameState.score - 1, 0);

        frameCount = savedGameState.frameCount;
        isGameOver = false;
        document.getElementById('gameOverPopup').style.display = "none";
        gameLoop();
    }
});

document.getElementById('popupPlayAgainButton').addEventListener('click', () => {
    score = 0;
    pipes.length = 0;
    bird.reset();
    isGameOver = false;
    document.getElementById('gameOverPopup').style.display = "none";
    retryButtonUsed = false;  // Reset the retry button usage flag
    gameLoop();
});

document.addEventListener('keydown', (event) => {
    if (event.key === "F2") {
        isGamePaused = !isGamePaused;
        if (!isGamePaused) gameLoop();
    }


    if (event.key === " " && !isGamePaused && !isGameOver) {
        bird.velocity = bird.lift;
        bird.hasFlapped = true;
        flapSound.play(); // Play flapping sound
    }

    
});


