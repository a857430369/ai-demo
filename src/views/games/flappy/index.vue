<template>
  <div class="flappy-container" tabindex="0" @keydown="handleKeyDown" @click="jump" @mousedown="handleInput">
    <h1>飞鸟挑战</h1>
    <div class="game-info">
      <div>得分: {{ score }}</div>
      <button @click="toggleGame">{{ gameRunning ? '暂停' : '开始' }}</button>
      <button @click="resetGame">重新开始</button>
      <button @click="debugMode = !debugMode" class="debug-btn">
        {{ debugMode ? '关闭调试' : '开启调试' }}
      </button>
    </div>

    <div class="game-area" :style="{ height: gameHeight + 'px' }" @mousedown="handleInput">
      <div 
        class="bird" 
        :style="{
          top: bird.y + 'px',
          transform: `rotate(${birdAngle}deg)`
        }"
      ></div>
      
      <div 
        v-for="(pipe, index) in pipes" 
        :id="`pipe-${pipe.id}`"
        :key="pipe.id"
        class="pipe"
        :style="{
          left: `${pipe.x}px`,
          width: `${PIPE_WIDTH}px`,
          height: `${pipe.height}px`,
          top: pipe.top ? `${pipe.top}px` : '0'
        }"
      ></div>
    </div>

    <n-modal v-model:show="showGameOver">
      <n-card
        style="max-width: 400px;"
        title="游戏结束"
        :bordered="false"
        size="huge"
      >
        <div class="game-over-content">
          <n-statistic label="最终得分" :value="score" />
          <div class="actions">
            <n-button type="primary" @click="resetGame">再玩一次</n-button>
          </div>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { NModal, NCard, NButton, NStatistic } from 'naive-ui';

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const PIPE_GAP = 200;
const PIPE_WIDTH = 60;
const PIPE_SPEED = 3;
const PIPE_SPACING = 400;
const MIN_HEIGHT = 100;

const gameRunning = ref(false);
const score = ref(0);
const showGameOver = ref(false);

const bird = ref({
  y: GAME_HEIGHT / 2 - 20,
  size: 40,
  velocity: 0
});

const pipes = ref([]);
let animationFrame;
let pipeCounter = 0;
let gameActive = false;

const birdAngle = ref(0);

const birdStyle = computed(() => ({
  top: bird.value.y + 'px',
  left: '50px',
  width: bird.value.size + 'px',
  height: bird.value.size + 'px'
}));

const pipeStyle = (pipe) => ({
  left: pipe.x + 'px',
  top: pipe.top + 'px',
  height: pipe.height + 'px',
  width: PIPE_WIDTH + 'px'
});

const jump = () => {
  if (!gameRunning.value) return;
  bird.value.velocity = JUMP_FORCE;
};

const updatePipes = () => {
  pipes.value.forEach(pipe => {
    pipe.x -= PIPE_SPEED;
    
    // 计分逻辑
    if (!pipe.passed && pipe.isUpper && pipe.x + PIPE_WIDTH < 50) {
      pipe.passed = true;
      score.value += 1;
    }
  });

  // 优化生成条件
  const lastPipeX = pipes.value.length > 0 ? Math.max(...pipes.value.map(p => p.x)) : 0;
  if (lastPipeX < GAME_WIDTH * 0.7) {
    generatePipe();
  }

  // 清理旧管道
  while (pipes.value[0]?.x < -PIPE_WIDTH) {
    pipes.value.splice(0, 2);
  }
};

const generatePipe = () => {
  pipeCounter++;
  const maxHeight = GAME_HEIGHT - PIPE_GAP - MIN_HEIGHT;
  const upperHeight = Math.floor(Math.random() * (maxHeight - MIN_HEIGHT)) + MIN_HEIGHT;

  const newPipe = {
    id: pipeCounter,
    x: GAME_WIDTH,
    height: upperHeight,
    isUpper: true,
    passed: false
  };
  
  pipes.value.push(newPipe);
  
  pipes.value.push({
    id: pipeCounter + 1,
    x: GAME_WIDTH,
    top: upperHeight + PIPE_GAP,
    height: GAME_HEIGHT - (upperHeight + PIPE_GAP),
    isUpper: false,
    passed: false
  });
};

// 常量定义
const FIXED_TIMESTEP = 16; // 60fps
const lastFrameTime = ref(0);
const accumulatedTime = ref(0);

const updateBird = () => {
  if (!gameActive.value) return;

  // 应用重力
  bird.value.velocity += GRAVITY;
  bird.value.y += bird.value.velocity;

  // 限制飞行高度
  if (bird.value.y < 0) {
    bird.value.y = 0;
    bird.value.velocity = 0;
  }

  // 更新小鸟角度
  birdAngle.value = Math.min(bird.value.velocity * 5, 90);
};

const updateGame = (timestamp) => {
  if (!gameActive) return;

  const deltaTime = timestamp - lastFrameTime.value;
  lastFrameTime.value = timestamp;
  accumulatedTime.value += deltaTime;

  while (accumulatedTime.value >= FIXED_TIMESTEP) {
    updateBird();
    updatePipes();
    checkCollision();
    accumulatedTime.value -= FIXED_TIMESTEP;
  }

  safeRender();
  if (gameActive) {
    requestAnimationFrame(updateGame);
  }
};

const safeRender = () => {
  try {
    pipes.value.forEach(pipe => {
      const element = document.getElementById(`pipe-${pipe.id}`);
      if (element) {
        element.style.left = `${pipe.x}px`;
      }
    });
  } catch (error) {
    console.error('渲染错误:', error);
  }
};

const checkCollision = () => {
  // 边界碰撞
  if (bird.value.y < 0 || bird.value.y + bird.value.size > GAME_HEIGHT) return true;

  // 管道碰撞
  return pipes.value.some(pipe => {
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;
    const pipeTop = pipe.isUpper ? 0 : pipe.top;
    const pipeBottom = pipe.isUpper ? pipe.height : pipe.top + pipe.height;

    const birdLeft = 50;
    const birdRight = 50 + bird.value.size;
    const birdTop = bird.value.y;
    const birdBottom = bird.value.y + bird.value.size;

    // 精确碰撞条件
    return (
      birdRight > pipeLeft &&
      birdLeft < pipeRight &&
      birdBottom > pipeTop &&
      birdTop < pipeBottom
    );
  });
};

const gameOver = () => {
  gameRunning.value = false;
  showGameOver.value = true;
  cancelAnimationFrame(animationFrame);
};

const resetGame = () => {
  bird.value.y = GAME_HEIGHT / 2 - 20;
  bird.value.velocity = 0;
  pipes.value.splice(0, pipes.value.length);
  score.value = 0;
  showGameOver.value = false;
  gameRunning.value = false;
};

const toggleGame = () => {
  gameRunning.value = !gameRunning.value;
  if (gameRunning.value) {
    initGame();
  } else {
    cancelAnimationFrame(animationFrame);
  }
};

const handleKeyDown = (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameRunning.value) toggleGame();
    else jump();
  }
};

const initGame = () => {
  pipes.value = [];
  pipeCounter = 0;
  gameActive = true;
  startGameLoop();
};

const startGameLoop = () => {
  lastFrameTime.value = performance.now();
  accumulatedTime.value = 0;
  requestAnimationFrame(updateGame);
};

const handleInput = () => {
  if (gameActive.value) {
    bird.value.velocity = JUMP_FORCE;
  }
};

onMounted(() => {
  const gameArea = document.querySelector('.game-area');
  gameArea.addEventListener('mousedown', handleInput);
  gameArea.addEventListener('touchstart', handleInput);
});

onUnmounted(() => {
  const gameArea = document.querySelector('.game-area');
  gameArea?.removeEventListener('mousedown', handleInput);
  gameArea?.removeEventListener('touchstart', handleInput);
  cancelAnimationFrame(animationFrame);
});
</script>

<style scoped>
.flappy-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  outline: none;
}

.game-area {
  position: relative;
  width: 100%;
  height: 600px;
  background: #4ec0ca;
  border: 2px solid red;
  overflow: hidden;
  touch-action: manipulation;
  cursor: pointer;
}

.bird {
  position: absolute;
  left: 50px;
  width: 40px;
  height: 40px;
  background: #FFD700;
  border-radius: 50%;
  transition: transform 0.2s ease-out;
  will-change: transform;
}

.pipe {
  position: absolute;
  background: #4CAF50; /* 默认颜色 */
  transition: none !important;
  z-index: 10;
  /* 添加3D效果提升渲染性能 */
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 下管道颜色区分 */
.pipe:nth-child(even) {
  background: #8BC34A;
}

.game-info {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
}

button {
  padding: 8px 16px;
  background: #316C72;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #2B4C59;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@keyframes flap {
  0% { transform: rotate(30deg); }
  100% { transform: rotate(-30deg); }
}

.bird:active {
  transform: rotate(-30deg);
}
</style> 