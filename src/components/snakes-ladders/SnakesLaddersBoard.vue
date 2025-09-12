<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed p-4"
    style="background-image: url('./src/assets/images/background-rac-1.png')"
  >
    <div class="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Game Master Controls -->
      <div class="xl:w-80 w-full">
        <GameMasterControls
          :players="players"
          :selectedPlayerId="selectedPlayerId"
          :selectedPlayerName="selectedPlayerName"
          :steps="steps"
          @select-player="selectPlayer"
          @increment-steps="incrementSteps"
          @decrement-steps="decrementSteps"
          @set-steps="setSteps"
          @move-player-forward="movePlayerForward"
          @move-player-backward="movePlayerBackward"
          @reset-game="resetGame"
        />
      </div>

      <!-- Game Board -->
      <div class="flex-1 flex justify-center">
        <GameBoardGrid 
          ref="gameBoardRef"
          :players="players" 
          :board-size="boardSize" 
          class="w-full" 
        />
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <ResetConfirmModal
      :isVisible="showResetModal"
      @close="showResetModal = false"
      @cancel="showResetModal = false"
      @confirm="confirmReset"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GameMasterControls from './GameMasterControls.vue'
import GameBoardGrid from './GameBoardGrid.vue'
import ResetConfirmModal from './ResetConfirmModal.vue'

// Refs
const gameBoardRef = ref(null)

// Game state
const players = ref([
  { id: 1, name: 'Pemain 1', icon: '🔴', color: 'red', position: 1 },
  { id: 2, name: 'Pemain 2', icon: '🟢', color: 'green', position: 1 },
  { id: 3, name: 'Pemain 3', icon: '🔵', color: 'blue', position: 1 },
])

const selectedPlayerId = ref(null)
const steps = ref(1)
const boardSize = ref(8)
const isAnimating = ref(false)
const showResetModal = ref(false)

// Computed properties
const selectedPlayerName = computed(() => {
  const player = players.value.find((p) => p.id === selectedPlayerId.value)
  return player ? player.name : ''
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

const movePlayerForward = async () => {
  if (!selectedPlayerId.value || isAnimating.value) return

  const playerIndex = players.value.findIndex((p) => p.id === selectedPlayerId.value)
  if (playerIndex === -1) return

  const player = players.value[playerIndex]
  const maxCell = boardSize.value * boardSize.value
  const newPosition = Math.min(player.position + steps.value, maxCell)

  // Start animation
  isAnimating.value = true
  
  try {
    // Play animation first
    if (gameBoardRef.value && gameBoardRef.value.animateMove) {
      await gameBoardRef.value.animateMove(player, steps.value, 300)
    }
    
    // Then update the actual position
    players.value[playerIndex].position = newPosition

    // Check if player wins
    if (newPosition === maxCell) {
      setTimeout(() => {
        alert(`🎉 ${player.name} menang! 🎉`)
      }, 200)
    }
  } finally {
    isAnimating.value = false
  }
}

const movePlayerBackward = async () => {
  if (!selectedPlayerId.value || isAnimating.value) return

  const playerIndex = players.value.findIndex((p) => p.id === selectedPlayerId.value)
  if (playerIndex === -1) return

  const player = players.value[playerIndex]
  const minCell = 1
  const newPosition = Math.max(player.position - steps.value, minCell)

  // Start animation
  isAnimating.value = true
  
  try {
    // Play animation first
    if (gameBoardRef.value && gameBoardRef.value.animateBackward) {
      await gameBoardRef.value.animateBackward(player, steps.value, 300)
    }
    
    // Then update the actual position
    players.value[playerIndex].position = newPosition
  } finally {
    isAnimating.value = false
  }
}

const resetGame = () => {
  showResetModal.value = true
}

const confirmReset = () => {
  players.value.forEach((player) => {
    player.position = 1
  })
  selectedPlayerId.value = null
  steps.value = 1
  showResetModal.value = false
}

// Initialize
onMounted(() => {
  selectedPlayerId.value = players.value[0].id
})
</script>
