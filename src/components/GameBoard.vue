<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import Card from './GameCard.vue'
import PlayerPanel from './PlayerPanel.vue'
import GameCompleteModal from './GameCompleteModal.vue'
import GameControls from './GameControls.vue'
import GameInstructions from './GameInstructions.vue'
import GameStats from './GameStats.vue'
import PlayerNameInput from './PlayerNameInput.vue'
import QuestionModal from './QuestionModal.vue'
import TurnChoiceModal from './TurnChoiceModal.vue'
import { useQuestions } from '../composables/useQuestions.js'

const cards = ref([])
const openedCards = ref([])
const matchedPairs = ref(0)
const gameStarted = ref(false)
const namesSet = ref(false)
const gameCompleted = ref(false)
const score = ref(0)
const attempts = ref(0)
const timer = ref(0)
const timerInterval = ref(null)
const isCardDisabled = ref(false)
const showQuestionModal = ref(false)
const currentQuestion = ref(null)
const pendingCardIndex = ref(null)
const { loadQuestions, getQuestionById } = useQuestions()
const currentPlayer = ref(1)
const player1Score = ref(0)
const player2Score = ref(0)
const player1Attempts = ref(0)
const player2Attempts = ref(0)
const player1Name = ref('Player 1')
const player2Name = ref('Player 2')
const winner = ref(null)
const currentTurnAttempts = ref(0)
const showContinueChoice = ref(false)
const isFirstAttemptInTurn = ref(true)
const isProcessingClick = ref(false) // Tambahkan flag untuk mencegah race condition

const initializeGame = () => {
  const numbers = []
  for (let i = 1; i <= 7; i++) {
    numbers.push(i, i)
  }

  shuffleArray(numbers)

  cards.value = numbers.map((number) => ({
    number,
    isFlipped: false,
    isMatched: false,
  }))

  openedCards.value = []
  matchedPairs.value = 0
  score.value = 0
  attempts.value = 0
  timer.value = 0
  gameCompleted.value = false
  isCardDisabled.value = false
  currentPlayer.value = 1
  player1Score.value = 0
  player2Score.value = 0
  player1Attempts.value = 0
  player2Attempts.value = 0
  winner.value = null
  currentTurnAttempts.value = 0
  showContinueChoice.value = false
  isFirstAttemptInTurn.value = true
  isProcessingClick.value = false
}

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

const startGame = () => {
  if (gameCompleted.value) {
    resetGame()
  }

  initializeGame()
  gameStarted.value = true
  startTimer()
}

const resetGame = () => {
  gameStarted.value = false
  gameCompleted.value = false
  stopTimer()
  initializeGame()
}

const resetToNameInput = () => {
  resetGame()
  namesSet.value = false
}

const handlePlayerNames = (playerData) => {
  player1Name.value = playerData.player1Name
  player2Name.value = playerData.player2Name
  namesSet.value = true
}

const handleResetFromModal = () => {
  resetGame()
}

const startTimer = () => {
  timerInterval.value = setInterval(() => {
    timer.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const handleCardClick = (cardIndex) => {
  // Cegah multiple clicks dengan debounce dan validasi state yang ketat
  if (
    isProcessingClick.value ||
    isCardDisabled.value ||
    cards.value[cardIndex].isFlipped ||
    cards.value[cardIndex].isMatched ||
    showQuestionModal.value ||
    showContinueChoice.value ||
    currentTurnAttempts.value >= 2
  ) {
    return
  }

  // Set flag untuk mencegah clicks berikutnya
  isProcessingClick.value = true

  currentTurnAttempts.value++
  pendingCardIndex.value = cardIndex
  const cardPosition = cardIndex + 1
  currentQuestion.value = getQuestionById(cardPosition)
  showQuestionModal.value = true

  // Reset flag setelah modal muncul
  setTimeout(() => {
    isProcessingClick.value = false
  }, 500)
}

const handleCorrectAnswer = () => {
  // Validasi state sebelum memproses jawaban benar
  if (pendingCardIndex.value === null || !showQuestionModal.value) {
    console.warn('Invalid state: handleCorrectAnswer called without pending card')
    return
  }

  const cardIndex = pendingCardIndex.value
  const currentPlayerBeforeMatch = currentPlayer.value

  attempts.value++
  if (currentPlayerBeforeMatch === 1) {
    player1Attempts.value++
  } else {
    player2Attempts.value++
  }

  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null
  cards.value[cardIndex].isFlipped = true

  const matchingCardIndex = openedCards.value.find(
    (openIndex) =>
      cards.value[openIndex].number === cards.value[cardIndex].number &&
      !cards.value[openIndex].isMatched,
  )

  openedCards.value.push(cardIndex)

  if (matchingCardIndex !== undefined) {
    cards.value[cardIndex].isMatched = true
    cards.value[matchingCardIndex].isMatched = true
    matchedPairs.value++
    score.value += 1

    if (currentPlayerBeforeMatch === 1) {
      player1Score.value += 1
    } else {
      player2Score.value += 1
    }

    if (matchedPairs.value === 7) {
      gameCompleted.value = true
      stopTimer()
      resetTurnState()

      if (player1Score.value > player2Score.value) {
        winner.value = 1
      } else if (player2Score.value > player1Score.value) {
        winner.value = 2
      } else {
        winner.value = 'tie'
      }
      return
    }

    // Validasi dan kelola giliran setelah jawaban benar
    if (currentTurnAttempts.value >= 2) {
      switchPlayer()
    } else {
      setTimeout(() => {
        // Pastikan state masih valid sebelum menampilkan pilihan
        if (!gameCompleted.value && !showQuestionModal.value) {
          showContinueChoice.value = true
          isFirstAttemptInTurn.value = false
        }
      }, 1000)
    }
  } else {
    // Validasi dan kelola giliran untuk kartu yang tidak cocok
    if (currentTurnAttempts.value >= 2) {
      switchPlayer()
    } else {
      setTimeout(() => {
        // Pastikan state masih valid sebelum menampilkan pilihan
        if (!gameCompleted.value && !showQuestionModal.value) {
          showContinueChoice.value = true
          isFirstAttemptInTurn.value = false
        }
      }, 1000)
    }
  }
}

const handleWrongAnswer = () => {
  // Validasi state sebelum memproses jawaban salah
  if (!showQuestionModal.value) {
    console.warn('Invalid state: handleWrongAnswer called without active modal')
    return
  }

  // Tambahkan penghitungan percobaan untuk jawaban salah
  attempts.value++
  if (currentPlayer.value === 1) {
    player1Attempts.value++
  } else {
    player2Attempts.value++
  }

  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null
  // Hapus pengurangan currentTurnAttempts yang menyebabkan bug

  // Langsung switch player karena jawaban salah
  switchPlayer()
}

const handleCloseModal = () => {
  // Validasi state sebelum menutup modal
  if (!showQuestionModal.value) {
    console.warn('Invalid state: handleCloseModal called without active modal')
    return
  }

  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null

  // Reset turn attempts agar pemain bisa melanjutkan memilih kartu
  currentTurnAttempts.value = Math.max(0, currentTurnAttempts.value - 1)

  // Reset processing flag untuk mencegah card disabled
  isProcessingClick.value = false

  // Jangan switch player ketika modal ditutup dengan tombol X
  // Biarkan pemain tetap melanjutkan gilirannya
}

const resetTurnState = () => {
  currentTurnAttempts.value = 0
  showContinueChoice.value = false
  isFirstAttemptInTurn.value = true
  isProcessingClick.value = false // Reset debounce flag untuk state yang bersih
}

const switchPlayer = () => {
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  resetTurnState()
}

const handleContinueTurn = () => {
  showContinueChoice.value = false
}

const handleEndTurn = () => {
  showContinueChoice.value = false
  switchPlayer()
}

onMounted(() => {
  loadQuestions()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <div class="fixed -top-8 left-8 z-50">
    <img
      src="/src/assets/images/rac-logo.png"
      alt="RAC Logo"
      class="sm:h-52 h-20 w-auto object-contain"
    />
  </div>

  <div class="fixed top-4 right-4 z-40">
    <GameControls
      :gameStarted="gameStarted"
      :gameCompleted="gameCompleted"
      @start-game="startGame"
      @reset-game="resetToNameInput"
    />
  </div>

  <div class="max-w-6xl mx-auto p-2 sm:p-4 text-center overflow-x-hidden">
    <div class="mb-4 sm:mb-6">
      <h1
        class="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg mt-2 sm:mt-3"
      >
        Stage 2 Final
      </h1>

      <GameStats v-if="gameStarted" :timer="timer" :formatTime="formatTime" />
    </div>

    <div
      v-if="gameStarted"
      class="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 lg:gap-6 xl:gap-8"
    >
      <div class="order-1 lg:order-1 flex items-center">
        <PlayerPanel
          :playerName="player1Name"
          :score="player1Score"
          :attempts="player1Attempts"
          :isActive="currentPlayer === 1"
          :currentTurnAttempts="currentPlayer === 1 ? currentTurnAttempts : 0"
        />
      </div>

      <div class="order-3 lg:order-2 flex items-center">
        <div
          class="p-6 sm:p-8 rounded-xl shadow-xl space-y-4 max-w-lg sm:max-w-2xl lg:max-w-3xl bg-gradient-to-br from-white/90 to-lime-50/80 border-2 border-emerald-600/30 backdrop-blur-md"
        >
          <!-- Grid 4 kolom untuk kartu -->
          <div class="grid grid-cols-4 gap-4 sm:gap-6 justify-items-center max-w-[650px]">
            <Card
              v-for="(card, index) in cards"
              :key="index"
              :number="card.number"
              :position="index + 1"
              :isFlipped="card.isFlipped"
              :isMatched="card.isMatched"
              :isDisabled="isCardDisabled"
              @card-click="handleCardClick(index)"
            />
          </div>
        </div>
      </div>

      <div class="order-2 lg:order-3 flex items-center">
        <PlayerPanel
          :playerName="player2Name"
          :score="player2Score"
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
      :player1Score="player1Score"
      :player2Score="player2Score"
      :player1Attempts="player1Attempts"
      :player2Attempts="player2Attempts"
      :totalAttempts="attempts"
      :timer="timer"
      :formatTime="formatTime"
      @reset-game="handleResetFromModal"
    />

    <PlayerNameInput v-if="!namesSet" @start-game="handlePlayerNames" />

    <GameInstructions v-if="namesSet && !gameStarted" />

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
  </div>
</template>
