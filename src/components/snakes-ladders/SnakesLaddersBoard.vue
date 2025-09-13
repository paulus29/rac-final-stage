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
            showMenu ? 'rotate-90 scale-110' : '',
          ]"
          aria-label="Menu"
          :aria-expanded="showMenu.toString()"
          aria-haspopup="true"
        >
          <span class="relative inline-block w-5 h-5">
            <span
              :class="[
                'absolute inset-0 flex items-center justify-center transition-all duration-200',
                showMenu ? 'opacity-0 scale-75' : 'opacity-100 scale-100',
              ]"
              >☰</span
            >
            <span
              :class="[
                'absolute inset-0 flex items-center justify-center transition-all duration-200',
                showMenu ? 'opacity-100 scale-100 rotate-90' : 'opacity-0 scale-75',
              ]"
              >✕</span
            >
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
          :markers="markers"
          class="w-full"
        />
      </div>
      <div class="xl:w-80 w-full">
        <GameMasterControls
          :players="players"
          :selectedPlayerId="selectedPlayerId"
          :selectedPlayerName="selectedPlayerName"
          :steps="steps"
          :disabled="isAnimating || showChallengeModal || showFinishModal"
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

    <!-- Question Challenge Modal -->
    <QuestionChallengeModal
      :isVisible="showChallengeModal"
      :type="challengeType"
      :players="players"
      :currentPlayerId="landedPlayerId"
      :question="challengeQuestion"
      @close="closeChallenge"
      @decide="onChallengeDecide"
      @judge="onChallengeJudge"
    />

    <!-- Finish Modal with Confetti -->
    <FinishModal
      :isVisible="showFinishModal"
      :playerName="finishPlayerName"
      :rank="finishPlayerRank"
      @close="showFinishModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import GameMasterControls from './GameMasterControls.vue'
import GameBoardGrid from './GameBoardGrid.vue'
import ResetConfirmModal from './ResetConfirmModal.vue'
import QuestionChallengeModal from './QuestionChallengeModal.vue'
import { useQuestionDeck } from '@/composables/useQuestionDeck'
import FinishModal from './FinishModal.vue'

// Refs
const gameBoardRef = ref(null)
const menuRef = ref(null)

// Game state
const players = ref([
  { id: 1, name: 'Pemain 1', icon: '🔴', color: 'red', position: 1, finished: false, rank: null },
  { id: 2, name: 'Pemain 2', icon: '🟢', color: 'green', position: 1, finished: false, rank: null },
  { id: 3, name: 'Pemain 3', icon: '🔵', color: 'blue', position: 1, finished: false, rank: null },
])

const selectedPlayerId = ref(null)
const steps = ref(1)
const boardSize = ref(8)
const isAnimating = ref(false)
const showResetModal = ref(false)
const showMenu = ref(false)

// Ranking state: pemain yang mencapai sel terakhir diberi peringkat berurutan
const nextRank = ref(1)

// Finish modal state
const showFinishModal = ref(false)
const finishPlayerName = ref('')
const finishPlayerRank = ref(1)

// Challenge system state
const markers = ref({}) // { [cellNumber]: 'optional' | 'forced' }
const showChallengeModal = ref(false)
const challengeType = ref('optional')
const challengeQuestion = ref('')
const landedPlayerId = ref(null)
const selectedAnswererId = ref(null)

// Question deck
const deck = useQuestionDeck()

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
  // Cegah pergerakan pemain yang sudah selesai
  if (player.finished) return
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

    // Check finish & assign rank
    if (newPosition === maxCell && !players.value[playerIndex].finished) {
      players.value[playerIndex].finished = true
      players.value[playerIndex].rank = nextRank.value++
      // Kosongkan pilihan pemain agar tidak mencoba menggerakkan yang sudah selesai
      selectedPlayerId.value = null
      // Tampilkan finish modal
      finishPlayerName.value = player.name
      finishPlayerRank.value = players.value[playerIndex].rank
      showFinishModal.value = true
    } else {
      // Check challenge marker setelah mendarat (hanya jika belum finish)
      await maybeTriggerChallenge(playerIndex)
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
  // Cegah pergerakan pemain yang sudah selesai
  if (player.finished) return
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

  // Check challenge marker after landing (hanya jika belum finish)
  await maybeTriggerChallenge(playerIndex)
}

const resetGame = () => {
  showResetModal.value = true
}

const confirmReset = () => {
  players.value.forEach((player) => {
    player.position = 1
    player.finished = false
    player.rank = null
  })
  selectedPlayerId.value = null
  steps.value = 1
  showResetModal.value = false
  nextRank.value = 1
  showFinishModal.value = false
  generateMarkers()
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
  generateMarkers()
  deck.load()
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

// Utilities & Challenge Logic
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const generateMarkers = () => {
  const total = boardSize.value * boardSize.value
  const eligible = []
  for (let n = 2; n <= total - 1; n++) eligible.push(n)
  const count = Math.floor(total / 3)
  const chosen = shuffle(eligible).slice(0, count)
  const map = {}
  // Bagi 50:50: setengah '?' (optional), setengah '!' (forced)
  const half = Math.floor(chosen.length / 2)
  const optionalCells = chosen.slice(0, half)
  const forcedCells = chosen.slice(half)
  optionalCells.forEach((cell) => (map[cell] = 'optional'))
  forcedCells.forEach((cell) => (map[cell] = 'forced'))
  markers.value = map
}

const maybeTriggerChallenge = async (playerIndex) => {
  // Jika pemain sudah finish, tidak ada tantangan
  if (players.value[playerIndex].finished) return
  const cell = players.value[playerIndex].position
  const type = markers.value[cell]
  if (!type) return

  landedPlayerId.value = players.value[playerIndex].id
  challengeType.value = type
  selectedAnswererId.value = type === 'forced' ? landedPlayerId.value : null

  // get question
  const q = deck.getNext ? deck.getNext() : null
  challengeQuestion.value = q || 'Pertanyaan tidak tersedia. Coba lagi.'
  showChallengeModal.value = true
}

const closeChallenge = () => {
  showChallengeModal.value = false
}

const onChallengeDecide = (answererId) => {
  selectedAnswererId.value = answererId
}

const onChallengeJudge = async ({ answererId, isCorrect }) => {
  showChallengeModal.value = false
  const idx = players.value.findIndex((p) => p.id === answererId)
  if (idx === -1) return
  const player = players.value[idx]
  const maxCell = boardSize.value * boardSize.value

  isAnimating.value = true
  try {
    if (isCorrect) {
      const steps = 4
      if (gameBoardRef.value && gameBoardRef.value.animateMove) {
        await gameBoardRef.value.animateMove(player, steps, 250)
      }
      players.value[idx].position = Math.min(player.position + steps, maxCell)

      if (players.value[idx].position === maxCell && !players.value[idx].finished) {
        players.value[idx].finished = true
        players.value[idx].rank = nextRank.value++
        // Jika yang finish adalah pemain terpilih, kosongkan selection
        if (selectedPlayerId.value === player.id) selectedPlayerId.value = null
        // Tampilkan finish modal
        finishPlayerName.value = player.name
        finishPlayerRank.value = players.value[idx].rank
        showFinishModal.value = true
      }
    } else {
      const steps = 4
      if (gameBoardRef.value && gameBoardRef.value.animateBackward) {
        await gameBoardRef.value.animateBackward(player, steps, 250)
      }
      players.value[idx].position = Math.max(player.position - steps, 1)
    }
  } finally {
    isAnimating.value = false
  }

  // cleanup
  landedPlayerId.value = null
  selectedAnswererId.value = null
}
</script>
