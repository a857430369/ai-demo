<template>
  <div class="snake-container" tabindex="0" @keydown="handleKeyDown">
    <h1>贪吃蛇</h1>
    <div class="game-info">
      <div>得分: {{ score }}</div>
      <div>等级: {{ level }}</div>
      <button @click="toggleGame">{{ gameStatus === 'playing' ? '暂停' : '开始' }}</button>
      <button @click="resetGame">重新开始</button>
    </div>
    <div class="game-board">
      <div 
        v-for="(row, y) in board" 
        :key="y" 
        class="row"
      >
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="cell"
          :class="{
            snake: cell === 1,
            head: cell === 2,
            food: cell === 3
          }"
        ></div>
      </div> 
    </div>

    <!-- 游戏结束提示 -->
    <n-modal v-model:show="showGameOverModal">
      <n-card
        style="max-width: 400px;"
        title="游戏结束"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <div class="game-over-content">
          <div class="stats">
            <n-statistic label="得分" :value="score" />
            <n-statistic label="等级" :value="level" />
          </div>
          <div class="actions">
            <n-button type="primary" @click="resetGame">再来一局</n-button>
            <n-button @click="showGameOverModal = false">查看结果</n-button>
          </div>
        </div>
      </n-card>
    </n-modal>

    <!-- 在游戏信息区域添加提示 -->
    <div class="controls-tip">
      {{ gameStatus === 'stopped' ? '按空格键开始游戏' : '方向键控制移动，空格键暂停' }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';

const BOARD_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 200;

// 游戏状态
const gameStatus = ref('stopped'); // stopped/playing/paused
const score = ref(0);
const level = ref(1);
const direction = ref('right');
const nextDirection = ref('right');

// 游戏数据
const snake = reactive({
  body: [{x: 5, y: 5}],
  length: 1
});

const food = reactive({
  position: {x: 15, y: 15}
});

// 游戏板
const board = ref(Array(BOARD_SIZE).fill().map(() => 
  Array(BOARD_SIZE).fill(0)
));

// 生成食物
const generateFood = () => {
  do {
    food.position = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    };
  } while (isPositionOnSnake(food.position));
};

// 判断位置是否在蛇身上
const isPositionOnSnake = (pos) => {
  return snake.body.some(segment => 
    segment.x === pos.x && segment.y === pos.y
  );
};

// 更新游戏板
const updateBoard = () => {
  const newBoard = Array(BOARD_SIZE).fill().map(() => 
    Array(BOARD_SIZE).fill(0)
  );
  
  // 绘制食物
  newBoard[food.position.y][food.position.x] = 3;
  
  // 绘制蛇身
  snake.body.forEach((segment, index) => {
    newBoard[segment.y][segment.x] = index === 0 ? 2 : 1;
  });
  
  board.value = newBoard;
};

// 移动蛇
const moveSnake = () => {
  if (gameStatus.value !== 'playing') return;

  const head = {...snake.body[0]};
  direction.value = nextDirection.value;

  switch(direction.value) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }

  // 碰撞检测
  if (head.x < 0 || head.x >= BOARD_SIZE || 
      head.y < 0 || head.y >= BOARD_SIZE ||
      isPositionOnSnake(head)) {
    gameOver();
    return;
  }

  // 添加新头部
  snake.body.unshift(head);

  // 吃食物检测
  if (head.x === food.position.x && head.y === food.position.y) {
    score.value += 100;
    if (snake.body.length % 5 === 0) level.value++;
    generateFood();
  } else {
    snake.body.pop();
  }

  updateBoard();
};

// 游戏循环
let gameLoop;
const startGameLoop = () => {
  const speed = Math.max(50, INITIAL_SPEED - (level.value - 1) * 15);
  gameLoop = setInterval(moveSnake, speed);
};

// 游戏开始/暂停
const toggleGame = () => {
  if (gameStatus.value === 'stopped') {
    // 首次开始游戏时重置方向
    nextDirection.value = 'right';
    direction.value = 'right';
  }
  
  if (gameStatus.value === 'playing') {
    gameStatus.value = 'paused';
    clearInterval(gameLoop);
  } else {
    gameStatus.value = 'playing';
    startGameLoop();
  }
};

// 游戏结束
const gameOver = () => {
  gameStatus.value = 'stopped';
  clearInterval(gameLoop);
  alert(`游戏结束！得分：${score.value}`);
};

// 重置游戏
const resetGame = () => {
  snake.body = [{x: 5, y: 5}];
  snake.length = 1;
  score.value = 0;
  level.value = 1;
  direction.value = 'right';
  nextDirection.value = 'right';
  generateFood();
  updateBoard();
  if (gameStatus.value === 'playing') {
    clearInterval(gameLoop);
    startGameLoop();
  }
};

// 键盘控制
const handleKeyDown = (e) => {
  // 新增：空格键控制开始/暂停
  if (e.code === 'Space') {
    e.preventDefault();
    toggleGame();
    return;
  }

  if (gameStatus.value !== 'playing') return;

  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
  };

  const newDirection = keyMap[e.key];
  if (!newDirection) return;

  // 禁止180度转向
  const oppositeDirections = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left'
  };

  if (newDirection !== oppositeDirections[direction.value]) {
    nextDirection.value = newDirection;
  }
};

// 生命周期
onMounted(() => {
  generateFood();
  updateBoard();
});

onUnmounted(() => {
  clearInterval(gameLoop);
});
</script>

<style scoped>
.snake-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  outline: none;
}

.game-info {
  margin: 20px 0;
  display: flex;
  gap: 20px;
  align-items: center;
}

.game-board {
  border: 2px solid #316C72;
  background: #f0f0f0;
}

.row {
  display: flex;
}

.cell {
  width: 20px;
  height: 20px;
  box-sizing: border-box;
}

.snake {
  background: #316C72;
}

.head {
  background: #2B4C59;
}

.food {
  background: #ff4757;
  border-radius: 50%;
}

button {
  padding: 8px 16px;
  background: #316C72;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #2B4C59;
}

button + button {
  margin-left: 10px;
}

/* 添加提示样式 */
.controls-tip {
  margin-top: 10px;
  color: #666;
  font-size: 0.9em;
}
</style> 