import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useQuestions } from '@/composables/useQuestions'

export const useMatchGameStore = defineStore('matchGame', () => {
  // Core state
  const cards = ref([])
  const openedCards = ref([])
  const matchedPairs = ref(0)
  const gameStarted = ref(false)
  const namesSet = ref(false)
  const gameCompleted = ref(false)
  const score = ref(0)
  const attempts = ref(0)
  const timer = ref(0)
  let timerId = null
  const isCardDisabled = ref(false)

  // Question modal state
  const showQuestionModal = ref(false)
  const currentQuestion = ref(null)
  const pendingCardIndex = ref(null)

  // Questions deck (Q&A)
  const { loadQuestions, getQuestionById } = useQuestions()

  // Players state
  const currentPlayer = ref(1)
  const player1Score = ref(0)
  const player2Score = ref(0)
  const player1Attempts = ref(0)
  const player2Attempts = ref(0)
  const player1Name = ref('Kelompok 1')
  const player2Name = ref('Kelompok 2')
  const winner = ref(null)

  // Turn state
  const currentTurnAttempts = ref(0)
  const showContinueChoice = ref(false)
  const isFirstAttemptInTurn = ref(true)
  const isProcessingClick = ref(false)

  // Getters
  const cardRows = computed(() => {
    const pattern = [3, 4, 4, 3]
    const rows = []
    let startIndex = 0
    let pi = 0
    while (startIndex < cards.value.length) {
      const size = pattern[pi] ?? pattern[pattern.length - 1]
      rows.push({ startIndex, items: cards.value.slice(startIndex, startIndex + size) })
      startIndex += size
      pi = (pi + 1) % pattern.length
    }
    return rows
  })

  // Helpers
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  const initializeGame = () => {
    const numbers = []
    for (let i = 1; i <= 7; i++) {
      numbers.push(i, i)
    }
    shuffleArray(numbers)
    cards.value = numbers.map((number) => ({ number, isFlipped: false, isMatched: false }))
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

  const startTimer = () => {
    if (timerId) return
    timerId = setInterval(() => {
      timer.value += 1
    }, 1000)
  }

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Actions
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

  const handlePlayerNames = ({ player1Name: p1, player2Name: p2 }) => {
    player1Name.value = p1
    player2Name.value = p2
    namesSet.value = true
    startGame()
  }

  const handleResetFromModal = () => {
    resetGame()
  }

  const handleCardClick = (cardIndex) => {
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

    isProcessingClick.value = true

    currentTurnAttempts.value++
    pendingCardIndex.value = cardIndex
    const cardPosition = cardIndex + 1
    currentQuestion.value = getQuestionById(cardPosition)
    showQuestionModal.value = true

    setTimeout(() => {
      isProcessingClick.value = false
    }, 500)
  }

  const handleCorrectAnswer = () => {
    if (pendingCardIndex.value === null || !showQuestionModal.value) return

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

      if (currentPlayerBeforeMatch === 1) player1Score.value += 1
      else player2Score.value += 1

      if (matchedPairs.value === 7) {
        gameCompleted.value = true
        stopTimer()
        resetTurnState()
        if (player1Score.value > player2Score.value) winner.value = 1
        else if (player2Score.value > player1Score.value) winner.value = 2
        else winner.value = 'tie'
        return
      }

      if (currentTurnAttempts.value >= 2) {
        switchPlayer()
      } else {
        setTimeout(() => {
          if (!gameCompleted.value && !showQuestionModal.value) {
            showContinueChoice.value = true
            isFirstAttemptInTurn.value = false
          }
        }, 1000)
      }
    } else {
      if (currentTurnAttempts.value >= 2) {
        switchPlayer()
      } else {
        setTimeout(() => {
          if (!gameCompleted.value && !showQuestionModal.value) {
            showContinueChoice.value = true
            isFirstAttemptInTurn.value = false
          }
        }, 1000)
      }
    }
  }

  const handleWrongAnswer = () => {
    if (!showQuestionModal.value) return

    attempts.value++
    if (currentPlayer.value === 1) player1Attempts.value++
    else player2Attempts.value++

    showQuestionModal.value = false
    currentQuestion.value = null
    pendingCardIndex.value = null

    switchPlayer()
  }

  const handleCloseModal = () => {
    if (!showQuestionModal.value) return
    showQuestionModal.value = false
    currentQuestion.value = null
    pendingCardIndex.value = null
    currentTurnAttempts.value = Math.max(0, currentTurnAttempts.value - 1)
    isProcessingClick.value = false
  }

  const resetTurnState = () => {
    currentTurnAttempts.value = 0
    showContinueChoice.value = false
    isFirstAttemptInTurn.value = true
    isProcessingClick.value = false
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

  const init = () => {
    loadQuestions()
  }

  return {
    // state
    cards,
    openedCards,
    matchedPairs,
    gameStarted,
    namesSet,
    gameCompleted,
    score,
    attempts,
    timer,
    isCardDisabled,

    showQuestionModal,
    currentQuestion,
    pendingCardIndex,

    currentPlayer,
    player1Score,
    player2Score,
    player1Attempts,
    player2Attempts,
    player1Name,
    player2Name,
    winner,

    currentTurnAttempts,
    showContinueChoice,
    isFirstAttemptInTurn,
    isProcessingClick,

    // getters
    cardRows,

    // actions
    init,
    startGame,
    resetGame,
    resetToNameInput,
    handlePlayerNames,
    handleResetFromModal,
    startTimer,
    stopTimer,
    formatTime,
    handleCardClick,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleCloseModal,
    resetTurnState,
    switchPlayer,
    handleContinueTurn,
    handleEndTurn,
  }
})
