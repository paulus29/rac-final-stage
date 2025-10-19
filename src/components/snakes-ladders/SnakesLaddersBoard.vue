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
    <!-- Player Name Input Modal -->
    <PlayerNameInput v-if="showNameInput" @start-game="onStartGame" />

    <div v-if="!showNameInput" class="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
      <!-- Game Master Controls -->

      <!-- Game Board -->
      <div class="flex-1 flex justify-center">
        <GameBoardGrid
          ref="gameBoardRef"
          :players="players"
          :board-size="boardSize"
          :markers="markers"
          :checkpoint-cells="checkpointCells"
          class="w-full"
        />
      </div>
      <div class="xl:w-80 w-full">
        <GameMasterControls
          ref="controlsRef"
          :players="players"
          :selectedPlayerId="selectedPlayerId"
          :selectedPlayerName="selectedPlayerName"
          :steps="steps"
          :disabled="
            isAnimating ||
            showChallengeModal ||
            showRewardModal ||
            showFinishModal ||
            showFinalModal
          "
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
      :disabledOptions="challengeDisabledOptions"
      :source="activeChallengeSource"
      @close="closeChallenge"
      @decide="onChallengeDecide"
      @judge="onChallengeJudge"
    />

    <!-- Reward Choice Modal (after correct answer) -->
    <RewardChoiceModal
      :isVisible="showRewardModal"
      :players="players"
      :currentPlayerId="rewardPlayerId"
      @close="showRewardModal = false"
      @choose="onRewardChoose"
    />

    <!-- Finish Modal with Confetti -->
    <FinishModal
      :isVisible="showFinishModal"
      :playerName="finishPlayerName"
      :rank="finishPlayerRank"
      @close="showFinishModal = false"
    />

    <!-- Final Leaderboard Modal (stop game when 2 players finished) -->
    <FinalLeaderboardModal
      :isVisible="showFinalModal"
      :players="players"
      @reset="confirmReset"
      @home="goHome"
      @close="showFinalModal = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSnakesLaddersStore } from '@/stores/snakesLadders'
import { useSoundEffects } from '@/composables/useSoundEffects'
import GameMasterControls from './GameMasterControls.vue'
import GameBoardGrid from './GameBoardGrid.vue'
import ResetConfirmModal from './ResetConfirmModal.vue'
import QuestionChallengeModal from './QuestionChallengeModal.vue'
import RewardChoiceModal from './RewardChoiceModal.vue'
import FinishModal from './FinishModal.vue'
import FinalLeaderboardModal from './FinalLeaderboardModal.vue'
import PlayerNameInput from './PlayerNameInput.vue'

// Refs
const gameBoardRef = ref(null)
const menuRef = ref(null)
const controlsRef = ref(null)

// Sound effects
const {
  playWalkingForward,
  playWalkingBackward,
  playShooting,
  playShieldBroken,
  playGetShield,
  playVictory1st,
  playVictoryAllRanking,
  stopSound,
  playBackgroundMusic,
  stopBackgroundMusic,
  fadeOutBackgroundMusic,
  fadeInBackgroundMusic,
} = useSoundEffects()

// Pinia store
const sl = useSnakesLaddersStore()
const {
  players,
  selectedPlayerId,
  steps,
  boardSize,
  isAnimating,
  showResetModal,
  showNameInput,
  nextRank,
  showFinishModal,
  finishPlayerName,
  finishPlayerRank,
  showFinalModal,
  markers,
  checkpointCells,
  showChallengeModal,
  challengeType,
  challengeQuestion,
  challengeDisabledOptions,
  landedPlayerId,
  selectedAnswererId,
  activeChallengeSource,
  showRewardModal,
  rewardPlayerId,
  selectedPlayerName,
  maxCell,
} = storeToRefs(sl)

// Local UI-only state
const showMenu = ref(false)

// Router
const router = useRouter()

// Computed properties tersedia dari store (mis. selectedPlayerName)

// Methods
const selectPlayer = (playerId) => {
  sl.selectPlayer(playerId)
}

const incrementSteps = () => {
  sl.incrementSteps()
}

const decrementSteps = () => {
  sl.decrementSteps()
}

const setSteps = (value) => {
  sl.setSteps(value)
}

const movePlayerForward = async () => {
  if (!selectedPlayerId.value || isAnimating.value) return

  const playerIndex = players.value.findIndex((p) => p.id === selectedPlayerId.value)
  if (playerIndex === -1) return

  const player = players.value[playerIndex]
  // Cegah pergerakan pemain yang sudah selesai
  if (player.finished) return
  const maxCellVal = maxCell.value
  const newPosition = Math.min(player.position + steps.value, maxCellVal)
  const startPos = player.position

  // Start animation
  isAnimating.value = true

  // Play sound: jalan maju (looped)
  const walkingAudio = playWalkingForward()

  try {
    // Play animation first
    if (gameBoardRef.value && gameBoardRef.value.animateMove) {
      await gameBoardRef.value.animateMove(player, steps.value, 300)
    }

    // Then update the actual position
    players.value[playerIndex].position = newPosition

    // Check finish & assign rank
    if (newPosition === maxCellVal && !players.value[playerIndex].finished) {
      players.value[playerIndex].finished = true
      players.value[playerIndex].rank = nextRank.value++
      // Kosongkan pilihan pemain agar tidak mencoba menggerakkan yang sudah selesai
      // Pilih pemain berikutnya yang belum finish
      selectedPlayerId.value = sl.getNextActivePlayerId(player.id)
      // Tampilkan finish modal
      finishPlayerName.value = player.name
      finishPlayerRank.value = players.value[playerIndex].rank
      showFinishModal.value = true
      
      // Play sound: victory untuk juara pertama
      if (players.value[playerIndex].rank === 1) {
        // Fade out background music, play victory, lalu fade in
        await fadeOutBackgroundMusic(500)
        playVictory1st()
        // Tunggu victory sound selesai (sekitar 3 detik), lalu fade in background
        setTimeout(() => fadeInBackgroundMusic(0.3, 1000), 3000)
      }
      
      // Cek finalisasi (dua pemain sudah finish)
      const finishedCount = players.value.filter((p) => p.finished).length
      if (finishedCount >= 2) {
        showFinalModal.value = true
        // Play sound: semua ranking lengkap
        await fadeOutBackgroundMusic(500)
        playVictoryAllRanking()
        // Tunggu victory sound selesai (sekitar 5 detik), lalu fade in background
        setTimeout(() => fadeInBackgroundMusic(0.3, 1000), 5000)
      }
    } else {
      // Check challenge marker setelah mendarat (hanya jika belum finish)
      const crossed = sl.getCrossedCheckpointCell(startPos, newPosition, player.id)
      const markerTriggered = await sl.maybeTriggerChallenge(playerIndex)
      if (markerTriggered) {
        // Jika marker terpicu, tetap tandai checkpoint sebagai visited agar tidak ditanya lagi
        if (crossed) sl.markVisitedCheckpoint(player.id, crossed)
      } else if (crossed) {
        // Tidak ada marker, tapi melewati checkpoint yang belum visited -> tampilkan challenge checkpoint
        await sl.triggerCheckpointChallenge(playerIndex, crossed)
      } else {
        // Jika tidak ada tantangan apapun, langsung ganti giliran
        selectedPlayerId.value = sl.getNextActivePlayerId(player.id)
      }
    }
  } finally {
    // Stop walking sound after animation (always executed)
    stopSound(walkingAudio)
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
  const startPos = player.position

  // Start animation
  isAnimating.value = true

  // Play sound: jalan mundur
  playWalkingBackward()

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
  const crossed = sl.getCrossedCheckpointCell(startPos, newPosition, player.id)
  const markerTriggered = await sl.maybeTriggerChallenge(playerIndex)
  if (markerTriggered) {
    if (crossed) sl.markVisitedCheckpoint(player.id, crossed)
  } else if (crossed) {
    // Saat mundur: hanya tandai visited, tidak memicu soal checkpoint
    sl.markVisitedCheckpoint(player.id, crossed)
    selectedPlayerId.value = sl.getNextActivePlayerId(player.id)
  } else {
    selectedPlayerId.value = sl.getNextActivePlayerId(player.id)
  }
}

const resetGame = () => {
  sl.resetGame()
}

const confirmReset = () => {
  // Stop background music saat reset game
  stopBackgroundMusic()
  sl.confirmReset()
}

// Menu actions
const onStartGame = ({ player1Name, player2Name, player3Name }) => {
  if (import.meta.env.DEV) {
    console.log('[SL Board] onStartGame payload', {
      player1Name,
      player2Name,
      player3Name,
    })
  }
  sl.startGameSetNames({ player1Name, player2Name, player3Name })
  
  // Play background music saat game dimulai
  playBackgroundMusic()
  
  // Auto-start timer pada panel kontrol (tunggu komponen ter-mount via v-if)
  nextTick(() => {
    // Tambahkan delay kecil untuk memastikan komponen sudah benar-benar ter-mount
    setTimeout(() => {
      if (controlsRef.value && controlsRef.value.resetTimer) {
        controlsRef.value.resetTimer()
        console.log('[SL Board] Timer reset')
      }
      if (controlsRef.value && controlsRef.value.startTimer) {
        controlsRef.value.startTimer()
        console.log('[SL Board] Timer started automatically')
      }
    }, 100)
  })
}

const goHome = () => {
  showMenu.value = false
  // Stop background music saat kembali ke menu utama
  stopBackgroundMusic()
  router.push('/')
}

const openReset = () => {
  showMenu.value = false
  sl.resetGame()
}

// Initialize
onMounted(() => {
  sl.init()
  
  // Play background music jika game sudah dimulai (loaded dari storage)
  if (!showNameInput.value) {
    playBackgroundMusic()
  }
  
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
  // Stop background music saat komponen di-unmount
  stopBackgroundMusic()
  
  if (menuRef.value && menuRef.value.__onDocClick) {
    document.removeEventListener('click', menuRef.value.__onDocClick)
  }
})

// Utilities & Challenge Logic dipindahkan ke store (generateMarkers, deck, dsb)

const maybeTriggerChallenge = async (playerIndex) => {
  await sl.maybeTriggerChallenge(playerIndex)
}

const closeChallenge = () => {
  sl.closeChallenge()
}

const onChallengeDecide = (answererId) => {
  sl.onChallengeDecide(answererId)
}

const onChallengeJudge = async ({ answererId, isCorrect, selectedIndex }) => {
  // Update mapping (mark wrong option or rotate question on correct)
  sl.onJudgeResult({ isCorrect, selectedIndex })
  const idx = players.value.findIndex((p) => p.id === answererId)
  if (idx === -1) return
  const player = players.value[idx]
  const maxCellVal = maxCell.value

  // Tahan modal sejenak agar feedback terlihat
  isAnimating.value = true
  await new Promise((r) => setTimeout(r, 900))
  showChallengeModal.value = false

  try {
    if (isCorrect) {
      // Tampilkan modal hadiah setelah feedback
      showRewardModal.value = true
      rewardPlayerId.value = answererId
      // Tidak ada animasi di sini; animasi akan terjadi pada handler pilihan
    } else {
      // Play sound: jalan mundur karena jawaban salah
      playWalkingBackward()
      
      const steps = 4
      if (gameBoardRef.value && gameBoardRef.value.animateBackward) {
        await gameBoardRef.value.animateBackward(player, steps, 250)
      }
      players.value[idx].position = Math.max(player.position - steps, 1)
    }
  } finally {
    isAnimating.value = false
  }

  // Atur giliran berikutnya (selalu round-robin dari pendarat) dan cleanup
  if (!isCorrect) {
    if (landedPlayerId.value != null) {
      selectedPlayerId.value = sl.getNextActivePlayerId(landedPlayerId.value)
    }
    // cleanup setelah selesai tanpa reward modal
    landedPlayerId.value = null
    selectedAnswererId.value = null
    activeChallengeSource.value = null
  }
}

// Handler untuk pilihan reward setelah jawaban benar
const onRewardChoose = async ({ action, targetId }) => {
  showRewardModal.value = false
  if (!rewardPlayerId.value) return
  const idx = players.value.findIndex((p) => p.id === rewardPlayerId.value)
  if (idx === -1) return
  const actor = players.value[idx]
  const maxCellVal = maxCell.value

  // Helper: check finish for a specific player index
  const checkFinish = async (playerIndex) => {
    const p = players.value[playerIndex]
    if (p.position === maxCellVal && !p.finished) {
      p.finished = true
      p.rank = nextRank.value++
      if (selectedPlayerId.value === p.id) selectedPlayerId.value = null
      finishPlayerName.value = p.name
      finishPlayerRank.value = p.rank
      showFinishModal.value = true
      
      // Play sound: victory untuk juara pertama
      if (p.rank === 1) {
        // Fade out background music, play victory, lalu fade in
        await fadeOutBackgroundMusic(500)
        playVictory1st()
        // Tunggu victory sound selesai (sekitar 3 detik), lalu fade in background
        setTimeout(() => fadeInBackgroundMusic(0.3, 1000), 3000)
      }
      
      // Finalize if two players finished
      const finishedCount = players.value.filter((pl) => pl.finished).length
      if (finishedCount >= 2) {
        showFinalModal.value = true
        // Play sound: semua ranking lengkap
        await fadeOutBackgroundMusic(500)
        playVictoryAllRanking()
        // Tunggu victory sound selesai (sekitar 5 detik), lalu fade in background
        setTimeout(() => fadeInBackgroundMusic(0.3, 1000), 5000)
      }
    }
  }

  if (action === 'shield') {
    // Tambah shield ke pemain dan maju 1 langkah
    players.value[idx].shield = Math.min((players.value[idx].shield || 0) + 1, 2)
    const steps = 1
    isAnimating.value = true
    
    // Play sound: mendapatkan shield (tanpa sound jalan maju)
    playGetShield()
    
    try {
      if (gameBoardRef.value && gameBoardRef.value.animateMove) {
        await gameBoardRef.value.animateMove(actor, steps, 250)
      }
      players.value[idx].position = Math.min(actor.position + steps, maxCellVal)
      await checkFinish(idx)
      // Animasi saat mendapatkan perisai (pop + pulse) SETELAH bergerak
      if (gameBoardRef.value && gameBoardRef.value.animateShieldGain) {
        await gameBoardRef.value.animateShieldGain(actor)
      }
    } finally {
      isAnimating.value = false
    }
  } else if (action === 'advance') {
    // Maju 4 langkah seperti sebelumnya
    const steps = 4
    isAnimating.value = true
    
    // Play sound: jalan maju (looped)
    const walkingAudio = playWalkingForward()
    
    try {
      if (gameBoardRef.value && gameBoardRef.value.animateMove) {
        await gameBoardRef.value.animateMove(actor, steps, 250)
      }
      players.value[idx].position = Math.min(actor.position + steps, maxCellVal)
      await checkFinish(idx)
    } finally {
      // Stop walking sound
      stopSound(walkingAudio)
      isAnimating.value = false
    }
  } else if (action === 'shoot') {
    // Tembak lawan: jika lawan punya shield, kurangi shield; jika tidak, mundurkan 4 langkah
    if (!targetId) return
    const tIdx = players.value.findIndex((p) => p.id === targetId)
    if (tIdx === -1) return
    const target = players.value[tIdx]
    if (target.finished) return // abaikan jika target sudah finish

    // Animasi serang imersif: jika target punya shield, tampilkan 'hold' dulu, lalu proyektil ditembakkan
    isAnimating.value = true
    try {
      const hasShield = (target.shield || 0) > 0
      // 1) Jika target punya shield, tampilkan perisai (hold) sebelum ditembak
      if (hasShield && gameBoardRef.value && gameBoardRef.value.animateShieldHoldStart) {
        gameBoardRef.value.animateShieldHoldStart(target)
      }

      // 2) Tembakkan proyektil (kecepatan konstan ditentukan internal)
      // Play sound: menyerang lawan
      playShooting()
      
      if (gameBoardRef.value && gameBoardRef.value.animateShoot) {
        await gameBoardRef.value.animateShoot(actor, target)
      }

      if (hasShield) {
        // 3) Saat proyektil tiba: hentikan hold, lalu tampilkan pulse hijau, dan kurangi shield
        if (gameBoardRef.value && gameBoardRef.value.animateShieldHoldStop) {
          gameBoardRef.value.animateShieldHoldStop()
        }
        
        // Play sound: shield rusak
        playShieldBroken()
        
        if (gameBoardRef.value && gameBoardRef.value.animateShieldPulse) {
          await gameBoardRef.value.animateShieldPulse(target, 600)
        }
        players.value[tIdx].shield = Math.max(target.shield - 1, 0)
      } else {
        // Play sound: jalan mundur karena diserang tanpa shield
        playWalkingBackward()
        
        const steps = 4
        if (gameBoardRef.value && gameBoardRef.value.animateBackward) {
          await gameBoardRef.value.animateBackward(target, steps, 250)
        }
        players.value[tIdx].position = Math.max(target.position - steps, 1)
      }
    } finally {
      isAnimating.value = false
    }
  }
  // Selesai memproses reward: next turn SELALU pemain setelah pendarat (round-robin)
  if (landedPlayerId.value != null) {
    selectedPlayerId.value = sl.getNextActivePlayerId(landedPlayerId.value)
  }

  // cleanup state tantangan
  rewardPlayerId.value = null
  landedPlayerId.value = null
  selectedAnswererId.value = null
  activeChallengeSource.value = null
}

// Helper round-robin disediakan oleh store: sl.getNextActivePlayerId
</script>
