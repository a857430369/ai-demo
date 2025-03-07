<template>
  <div class="gomoku-container">
    <h1>五子棋</h1>
    <div class="status">{{ statusText }}</div>
    <div class="board">
      <div 
        v-for="(row, i) in board" 
        :key="i" 
        class="row"
      >
        <div
          v-for="(cell, j) in row"
          :key="j"
          class="cell"
          :class="{ black: cell === 1, white: cell === 2 }"
          @click="handleClick(i, j)"
        >
          <div class="crosshair"></div>
        </div>
      </div>
    </div>
    <button @click="resetGame" class="restart-btn">重新开始</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const BOARD_SIZE = 15;
const currentPlayer = ref(1); // 1: 黑棋, 2: 白棋
const gameOver = ref(false);
const board = ref(Array(BOARD_SIZE).fill().map(() => 
  Array(BOARD_SIZE).fill(0)
));

const statusText = computed(() => {
  if (gameOver.value) return `玩家 ${currentPlayer.value === 1 ? '黑棋' : '白棋'} 胜利!`;
  return `当前玩家: ${currentPlayer.value === 1 ? '黑棋' : '白棋'}`;
});

const checkWin = (row, col) => {
  const directions = [
    [ [0, -1], [0, 1] ],   // 水平
    [ [-1, 0], [1, 0] ],   // 垂直
    [ [-1, -1], [1, 1] ],  // 正斜线
    [ [-1, 1], [1, -1] ]   // 反斜线
  ];

  for (const [dir1, dir2] of directions) {
    let count = 1;
    
    const checkDirection = (dx, dy) => {
      let x = row + dx;
      let y = col + dy;
      while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
        if (board.value[x][y] === currentPlayer.value) {
          count++;
          x += dx;
          y += dy;
        } else {
          break;
        }
      }
    };

    checkDirection(...dir1);
    checkDirection(...dir2);
    
    if (count >= 5) return true;
  }
  return false;
};

const handleClick = (row, col) => {
  if (gameOver.value || board.value[row][col] !== 0) return;
  
  board.value[row][col] = currentPlayer.value;
  
  if (checkWin(row, col)) {
    gameOver.value = true;
  } else {
    currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
  }
};

const resetGame = () => {
  board.value = Array(BOARD_SIZE).fill().map(() => 
    Array(BOARD_SIZE).fill(0)
  );
  currentPlayer.value = 1;
  gameOver.value = false;
};
</script>

<style scoped>
.gomoku-container {
  max-width: 800px;
  margin: 20px auto;
  text-align: center;
}

.status {
  font-size: 1.5em;
  margin: 20px 0;
  color: #333;
}

.board {
  display: inline-block;
  border: 2px solid #654321;
  background: #f0d9a4;
  padding: 10px;
}

.row {
  display: flex;
}

.cell {
  width: 40px;
  height: 40px;
  position: relative;
  cursor: pointer;
  border: 1px solid #ccc;
}

.crosshair {
  position: absolute;
  width: 100%;
  height: 100%;
  background: 
    linear-gradient(to right, transparent 49%, #ccc 49%, #ccc 51%, transparent 51%),
    linear-gradient(to bottom, transparent 49%, #ccc 49%, #ccc 51%, transparent 51%);
}

.black::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.white::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.restart-btn {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1.1em;
  background: #316C72;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.restart-btn:hover {
  background: #2B4C59;
}
</style> 