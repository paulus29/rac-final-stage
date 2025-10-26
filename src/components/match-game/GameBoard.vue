<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useMatchGameStore } from '@/stores/matchGame'
import { useSoundEffects } from '@/composables/useSoundEffects'
import Card from './GameCard.vue'
import PlayerPanel from './PlayerPanel.vue'
import GameCompleteModal from './GameCompleteModal.vue'
import GameControls from './GameControls.vue'
import PlayerNameInput from './PlayerNameInput.vue'
import QuestionModal from './QuestionModal.vue'
import TurnChoiceModal from './TurnChoiceModal.vue'

// Sound effects
const { playMatchGameBackgroundMusic, stopMatchGameBackgroundMusic } = useSoundEffects()

// Pinia store hookup
const mg = useMatchGameStore()
const {
  cards,
  openedCards,
  matchedPairs,
  gameStarted,
  namesSet,
  gameCompleted,
  attempts,
  timer,
  isCardDisabled,
  isPaused,
  showQuestionModal,
  currentQuestion,
  pendingCardIndex,
  currentPlayer,
  player1Points,
  player2Points,
  player1Matches,
  player2Matches,
  player1Attempts,
  player2Attempts,
  player1Name,
  player2Name,
  winner,
  currentTurnAttempts,
  showContinueChoice,
  isFirstAttemptInTurn,
  isProcessingClick,
  cardRows,
  pointGainEvent,
  usedQuestionCount,
  totalQuestions,
} = storeToRefs(mg)

// Map actions for template compatibility
const startGame = mg.startGame
const resetGame = mg.resetGame
const resetToNameInput = mg.resetToNameInput
const handlePlayerNames = mg.handlePlayerNames
const handleResetFromModal = mg.handleResetFromModal
const startTimer = mg.startTimer
const stopTimer = mg.stopTimer
const formatTime = mg.formatTime
const handleCardClick = mg.handleCardClick
const handleCorrectAnswer = mg.handleCorrectAnswer
const handleWrongAnswer = mg.handleWrongAnswer
const handleCloseModal = mg.handleCloseModal
const resetTurnState = mg.resetTurnState
const switchPlayer = mg.switchPlayer
const handleContinueTurn = mg.handleContinueTurn
const handleEndTurn = mg.handleEndTurn
const getCardPoints = mg.getCardPoints

// Map point gain event to each player panel for animation
const p1Gain = computed(() =>
  pointGainEvent.value && pointGainEvent.value.playerId === 1 ? pointGainEvent.value : null,
)
const p2Gain = computed(() =>
  pointGainEvent.value && pointGainEvent.value.playerId === 2 ? pointGainEvent.value : null,
)

onMounted(() => {
  mg.init()

  // Play background music hanya jika game sudah dimulai DAN nama sudah di-set (loaded dari storage)
  if (gameStarted.value && namesSet.value) {
    playMatchGameBackgroundMusic()
  }
})

onBeforeUnmount(() => {
  mg.stopTimer()
  // Stop background music saat komponen di-unmount
  stopMatchGameBackgroundMusic()
})
</script>

<template>
  <div class="fixed top-4 right-4 z-[100] flex items-start gap-3">
    <div v-if="gameStarted" class="hidden sm:flex flex-col items-end gap-2">
      <div
        class="px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-amber-300 text-amber-900 text-xs font-semibold shadow"
      >
        ⏱️ {{ formatTime(timer) }}<span v-if="isPaused" class="ml-1">⏸️</span>
      </div>
      <div
        class="px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-amber-300 text-amber-900 text-xs font-semibold shadow"
        title="Jumlah pertanyaan yang sedang digunakan"
      >
        ❓ {{ usedQuestionCount }} / {{ totalQuestions }}
      </div>
    </div>
    <GameControls @reset-game="resetToNameInput" />
  </div>

  <div class="min-h-screen flex flex-col justify-center max-w-6xl mx-auto p-2 sm:p-4 text-center overflow-x-hidden">
    

    <div
      v-if="gameStarted"
      class="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 xl:gap-8"
    >
      <div class="order-1 lg:order-1 flex items-center justify-center">
        <PlayerPanel
          :playerName="player1Name"
          :points="player1Points"
          :pointGain="p1Gain"
          :matches="player1Matches"
          :attempts="player1Attempts"
          :isActive="currentPlayer === 1"
          :currentTurnAttempts="currentPlayer === 1 ? currentTurnAttempts : 0"
        />
      </div>

      <div class="order-3 lg:order-2 flex items-center justify-center">
        <div
          class="p-6 sm:p-8 rounded-xl shadow-xl space-y-4 max-w-lg sm:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-white/90 to-lime-50/80 border-2 border-emerald-600/30 backdrop-blur-md"
        >
          <!-- Grid pola 3-4-4-3 untuk kartu dengan spacing yang konsisten -->
          <div class="space-y-4 sm:space-y-6 max-w-[650px] mx-auto">
            <div
              v-for="(row, rowIndex) in cardRows"
              :key="'row-' + rowIndex"
              :class="['flex', 'justify-center', 'items-center', 'gap-4', 'sm:gap-6']"
            >
              <Card
                v-for="(card, idx) in row.items"
                :key="`r${rowIndex}-c${idx}`"
                :letter="card.letter"
                :position="row.startIndex + idx + 1"
                :points="getCardPoints(row.startIndex + idx + 1)"
                :isFlipped="card.isFlipped"
                :isMatched="card.isMatched"
                :isDisabled="isCardDisabled"
                @card-click="handleCardClick(row.startIndex + idx)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="order-2 lg:order-3 flex items-center justify-center">
        <PlayerPanel
          :playerName="player2Name"
          :points="player2Points"
          :pointGain="p2Gain"
          :matches="player2Matches"
          :attempts="player2Attempts"
          :isActive="currentPlayer === 2"
          :currentTurnAttempts="currentPlayer === 2 ? currentTurnAttempts : 0"
        />
      </div>
    </div>

    <GameCompleteModal
      v-if="gameCompleted"
      :winner="winner"
      :player1Name="player1Name"
      :player2Name="player2Name"
      :player1Points="player1Points"
      :player2Points="player2Points"
      :player1Attempts="player1Attempts"
      :player2Attempts="player2Attempts"
      :timer="timer"
      :formatTime="formatTime"
      @reset-game="resetToNameInput"
    />

    <PlayerNameInput v-if="!namesSet" @start-game="handlePlayerNames" />

    <QuestionModal
      v-if="showQuestionModal && currentQuestion"
      :questionData="currentQuestion"
      :cardPosition="pendingCardIndex + 1"
      :currentPlayer="currentPlayer"
      :playerName="currentPlayer === 1 ? player1Name : player2Name"
      :currentAttempt="currentTurnAttempts"
      @answer-correct="handleCorrectAnswer"
      @answer-wrong="handleWrongAnswer"
      @close-modal="handleCloseModal"
    />

    <TurnChoiceModal
      v-if="showContinueChoice"
      :playerName="currentPlayer === 1 ? player1Name : player2Name"
      :currentTurnAttempts="currentTurnAttempts"
      @continue-turn="handleContinueTurn"
      @end-turn="handleEndTurn"
    />

    <!-- Pause Overlay -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isPaused && gameStarted && !gameCompleted"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center"
      >
        <div
          class="bg-white/95 rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-300"
        >
          <div class="text-center">
            <div class="text-6xl mb-4">⏸️</div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2">Game Di-Pause</h2>
            <p class="text-gray-600 mb-6">Timer dan pertanyaan dihentikan sementara</p>
            <button
              @click="mg.resumeGame()"
              class="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg flex items-center gap-2 mx-auto"
            >
              <span>▶️</span>
              <span>Lanjutkan Game</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
