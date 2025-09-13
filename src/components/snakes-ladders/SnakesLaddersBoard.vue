<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed p-4"
    style="background-image: url('./src/assets/images/background-rac-1.png')"
  >
    <!-- Hamburger Menu (top-right) -->
    <div class="fixed top-4 right-4 z-[60]">
      <div class="relative" ref="menuRef">
        <button
          @click="showMenu = !showMenu"
          :class="[
            'w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white/90 text-gray-800 shadow-md ring-1 ring-white/50 transition-colors transform transition-transform duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400',
            showMenu ? 'rotate-90 scale-110' : ''
          ]"
          aria-label="Menu"
          :aria-expanded="showMenu.toString()"
          aria-haspopup="true"
        >
          <span class="relative inline-block w-5 h-5">
            <span
              :class="[
                'absolute inset-0 flex items-center justify-center transition-all duration-200',
                showMenu ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
              ]"
            >☰</span>
            <span
              :class="[
                'absolute inset-0 flex items-center justify-center transition-all duration-200',
                showMenu ? 'opacity-100 scale-100 rotate-90' : 'opacity-0 scale-75'
              ]"
            >✕</span>
          </span>
        </button>
        <Transition
          enter-active-class="transition ease-out duration-150"
          enter-from-class="opacity-0 translate-y-1 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition ease-in duration-100"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-1 scale-95"
        >
          <div
            v-if="showMenu"
            class="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur rounded-xl shadow-lg ring-1 ring-black/10 overflow-hidden origin-top-right"
          >
            <button
              @click="goHome"
              class="w-full text-left px-4 py-3 hover:bg-white text-gray-800 font-medium flex items-center gap-2 transition-colors"
            >
              <span>🏠</span>
              <span>Kembali ke Menu Utama</span>
            </button>
            <div class="h-px bg-black/10"></div>
            <button
              @click="openReset"
              class="w-full text-left px-4 py-3 hover:bg-white text-gray-800 font-medium flex items-center gap-2 transition-colors"
            >
              <span>🔄</span>
              <span>Reset Game</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
    <div class="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Game Master Controls -->

      <!-- Game Board -->
      <div class="flex-1 flex justify-center">
        <GameBoardGrid
          ref="gameBoardRef"
          :players="players"
          :board-size="boardSize"
          class="w-full"
        />
      </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import GameMasterControls from './GameMasterControls.vue'
import GameBoardGrid from './GameBoardGrid.vue'
import ResetConfirmModal from './ResetConfirmModal.vue'

// Refs
const gameBoardRef = ref(null)
const menuRef = ref(null)

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
const showMenu = ref(false)

// Router
const router = useRouter()

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

// Menu actions
const goHome = () => {
  showMenu.value = false
  router.push('/')
}

const openReset = () => {
  showMenu.value = false
  showResetModal.value = true
}

// Initialize
onMounted(() => {
  selectedPlayerId.value = players.value[0].id
  // click outside to close menu
  const onDocClick = (e) => {
    if (!menuRef.value) return
    if (!menuRef.value.contains(e.target)) {
      showMenu.value = false
    }
  }
  document.addEventListener('click', onDocClick)
  // store to remove on unmount
  menuRef.value && (menuRef.value.__onDocClick = onDocClick)
})

onBeforeUnmount(() => {
  if (menuRef.value && menuRef.value.__onDocClick) {
    document.removeEventListener('click', menuRef.value.__onDocClick)
  }
})
</script>
