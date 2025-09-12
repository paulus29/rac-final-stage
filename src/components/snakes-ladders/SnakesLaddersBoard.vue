<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed p-4"
    style="background-image: url('./src/assets/images/background-rac-1.png')"
  >
    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="text-4xl font-bold text-white mb-2">🐍 Stage 3: Ular Tangga 🪜</h1>
      <p class="text-white/80">Game Master Mode - 3 Pemain</p>
    </div>

    <div class="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Game Master Controls -->
      <div class="xl:w-80 w-full">
        <div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
          <h2 class="text-2xl font-bold text-white mb-4 text-center">🎮 Game Master</h2>

          <!-- Player Selection -->
          <div class="mb-6">
            <label class="block text-white/90 font-semibold mb-2">Pilih Pemain:</label>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="player in players"
                :key="player.id"
                @click="selectPlayer(player.id)"
                :class="[
                  'p-3 rounded-lg font-semibold transition-all duration-200 text-white',
                  selectedPlayerId === player.id
                    ? `bg-${player.color}-500 shadow-lg scale-105`
                    : `bg-${player.color}-400/50 hover:bg-${player.color}-400/70`,
                ]"
              >
                {{ player.icon }} {{ player.name }}
                <span class="text-sm block opacity-80">Posisi: {{ player.position }}</span>
              </button>
            </div>
          </div>

          <!-- Step Controls -->
          <div class="mb-6">
            <label class="block text-white/90 font-semibold mb-2">Langkah:</label>
            <div class="flex items-center gap-2 mb-3">
              <button
                @click="decrementSteps"
                :disabled="steps <= 1"
                class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white w-10 h-10 rounded-full font-bold transition-colors"
              >
                -
              </button>
              <div
                class="bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-bold text-center min-w-16"
              >
                {{ steps }}
              </div>
              <button
                @click="incrementSteps"
                :disabled="steps >= 6"
                class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white w-10 h-10 rounded-full font-bold transition-colors"
              >
                +
              </button>
            </div>
            <div class="grid grid-cols-3 gap-1 mb-4">
              <button
                v-for="n in 6"
                :key="n"
                @click="setSteps(n)"
                :class="[
                  'py-2 rounded font-semibold transition-all',
                  steps === n
                    ? 'bg-amber-500 text-white'
                    : 'bg-white/70 hover:bg-white/90 text-gray-800',
                ]"
              >
                {{ n }}
              </button>
            </div>
          </div>

          <!-- Move Button -->
          <button
            @click="movePlayer"
            :disabled="!selectedPlayerId"
            class="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors text-lg"
          >
            🎲 Jalankan {{ selectedPlayerName }}
          </button>

          <!-- Reset Button -->
          <button
            @click="resetGame"
            class="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-colors"
          >
            🔄 Reset Game
          </button>
        </div>
      </div>

      <!-- Game Board -->
      <div class="flex-1 flex justify-center">
        <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 w-full">
          <div class="grid grid-cols-8 gap-1 w-full max-w-2xl mx-auto min-w-0">
            <div
              v-for="(cell, index) in boardCells"
              :key="index"
              :class="[
                'relative aspect-square border-2 border-white/30 rounded-lg flex items-center justify-center min-w-0 min-h-0 overflow-hidden',
                getCellBackground(cell.number),
              ]"
            >
              <!-- Cell Number -->
              <div
                class="absolute top-1 left-1 z-30 text-xs font-bold text-gray-700 bg-white/80 rounded px-1"
              >
                {{ cell.number }}
              </div>

              <!-- Players on this cell -->
              <div class="absolute inset-0 p-2 z-20 pointer-events-none">
                <div
                  v-for="(player, idx) in getPlayersOnCell(cell.number)"
                  :key="player.id"
                  class="absolute -translate-x-1/2 -translate-y-1/2"
                  :style="getPlayerOffsetStyle(cell.number, idx)"
                >
                  <span :class="`${getPlayerSizeClass(cell.number)} ${getPlayerShadow(player.color)} block leading-none select-none`">
                    {{ player.icon }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Player Status -->
    <div class="mt-6 max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="player in players"
          :key="player.id"
          :class="[
            'bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 text-center',
            selectedPlayerId === player.id ? 'ring-2 ring-yellow-400' : '',
          ]"
        >
          <div class="text-3xl mb-2">{{ player.icon }}</div>
          <h3 class="text-white font-bold text-lg">{{ player.name }}</h3>
          <p class="text-white/80">Posisi: {{ player.position }}/64</p>
          <div :class="`w-full bg-${player.color}-500/30 rounded-full h-2 mt-2`">
            <div
              :class="`bg-${player.color}-500 h-2 rounded-full transition-all duration-300`"
              :style="`width: ${(player.position / 64) * 100}%`"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Game state
const players = ref([
  { id: 1, name: 'Pemain 1', icon: '🔴', color: 'red', position: 1 },
  { id: 2, name: 'Pemain 2', icon: '🟢', color: 'green', position: 1 },
  { id: 3, name: 'Pemain 3', icon: '🔵', color: 'blue', position: 1 },
])

const selectedPlayerId = ref(null)
const steps = ref(1)

// Computed properties
const selectedPlayerName = computed(() => {
  const player = players.value.find((p) => p.id === selectedPlayerId.value)
  return player ? player.name : ''
})

const boardCells = computed(() => {
  const cells = []
  // Generate 8x8 board with snake-like numbering (alternating direction per row)
  for (let row = 0; row < 8; row++) {
    const isEvenRow = row % 2 === 0
    for (let col = 0; col < 8; col++) {
      const position = isEvenRow ? row * 8 + col + 1 : row * 8 + (8 - col)
      cells.push({
        number: position,
        row: 7 - row, // Reverse for display (bottom to top)
        col: isEvenRow ? col : 7 - col,
      })
    }
  }
  return cells.sort((a, b) => a.number - b.number)
})

// Methods
const selectPlayer = (playerId) => {
  selectedPlayerId.value = playerId
}

const incrementSteps = () => {
  if (steps.value < 6) steps.value++
}

const decrementSteps = () => {
  if (steps.value > 1) steps.value--
}

const setSteps = (value) => {
  steps.value = value
}

const movePlayer = () => {
  if (!selectedPlayerId.value) return

  const playerIndex = players.value.findIndex((p) => p.id === selectedPlayerId.value)
  if (playerIndex === -1) return

  const player = players.value[playerIndex]
  const newPosition = Math.min(player.position + steps.value, 64)

  players.value[playerIndex].position = newPosition

  // Check if player wins
  if (newPosition === 64) {
    setTimeout(() => {
      alert(`🎉 ${player.name} menang! 🎉`)
    }, 500)
  }
}

const resetGame = () => {
  players.value.forEach((player) => {
    player.position = 1
  })
  selectedPlayerId.value = null
  steps.value = 1
}

const getCellBackground = (cellNumber) => {
  // Alternating colors for better visibility
  const row = Math.floor((cellNumber - 1) / 8)
  const col = (cellNumber - 1) % 8
  const isLight = (row + col) % 2 === 0
  return isLight ? 'bg-white/40' : 'bg-white/20'
}

const getPlayersOnCell = (cellNumber) => {
  // Urutkan agar posisi konsisten antar render
  return players.value
    .filter((player) => player.position === cellNumber)
    .sort((a, b) => a.id - b.id)
}

// Ukuran ikon menyesuaikan jumlah pemain pada sel agar tetap muat
const getPlayerSizeClass = (cellNumber) => {
  const count = getPlayersOnCell(cellNumber).length
  if (count <= 1) return 'text-3xl'
  if (count === 2) return 'text-3xl'
  if (count >= 3) return 'text-2xl'
  return 'text-2xl'
}

// Posisi pemain dalam sel menggunakan persentase agar stabil dan tidak bertumpuk
const getPlayerOffsetStyle = (cellNumber, idx) => {
  const count = getPlayersOnCell(cellNumber).length
  // Default center
  let positions = [{ left: '50%', top: '50%' }]

  if (count === 2) {
    positions = [
      { left: '35%', top: '50%' },
      { left: '65%', top: '50%' },
    ]
  } else if (count >= 3) {
    positions = [
      { left: '35%', top: '35%' },
      { left: '65%', top: '35%' },
      { left: '50%', top: '65%' },
      // Fallback ke sudut kanan bawah jika ada lebih dari 3 (meski tidak dipakai sekarang)
      { left: '65%', top: '65%' },
    ]
  }

  const pos = positions[idx] || positions[0]
  return `left: ${pos.left}; top: ${pos.top};`
}

const getPlayerShadow = (color) => {
  const shadows = {
    red: 'drop-shadow-lg',
    green: 'drop-shadow-lg',
    blue: 'drop-shadow-lg',
  }
  return shadows[color] || 'drop-shadow-lg'
}

// Initialize
onMounted(() => {
  selectedPlayerId.value = players.value[0].id
})
</script>
