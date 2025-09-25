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
  const attempts = ref(0)
  const timer = ref(0)
  let timerId = null
  const isCardDisabled = ref(false)

  // Points system
  // Poin per kartu (key: position -> points), default 100 per kartu
  const cardPoints = ref({})
  // Event untuk animasi penambahan poin di UI
  const pointGainEvent = ref(null) // { playerId, amount, ts }

  // Question modal state
  const showQuestionModal = ref(false)
  const currentQuestion = ref(null)
  const pendingCardIndex = ref(null)

  // Questions deck (Q&A)
  const { loadQuestions, getQuestionById, getRandomQuestion } = useQuestions()

  // Players state
  const currentPlayer = ref(1)
  const player1Points = ref(0)
  const player2Points = ref(0)
  const player1Matches = ref(0)
  const player2Matches = ref(0)
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

  // Per-card question & clue state
  // Structure: { [position: number]: { questionId: number, revealed: number[], wrong: number } }
  const cardQuestionState = ref({})

  const ensureCardQuestionState = (position) => {
    if (!position) return
    if (!cardQuestionState.value[position]) {
      const q = getQuestionById(position)
      const qid = q?.id ?? 1
      cardQuestionState.value[position] = { questionId: qid, revealed: [], wrong: 0 }
    }
  }

  const getRevealedIndices = (position) => {
    const st = cardQuestionState.value[position]
    return st ? st.revealed : []
  }

  const getWrongCountForPosition = (position) => {
    const st = cardQuestionState.value[position]
    return st ? (st.wrong || 0) : 0
  }

  const revealRandomLetterForPosition = (position) => {
    ensureCardQuestionState(position)
    const st = cardQuestionState.value[position]
    if (!st) return []
    // Max 2 letters
    if (st.revealed.length >= 2) return st.revealed
    const q = getQuestionById(st.questionId)
    const ans = (q?.answer || '').toString()
    const candidates = []
    for (let i = 0; i < ans.length; i++) {
      const ch = ans[i]
      const isAlphaNum = /[A-Za-z0-9]/.test(ch)
      if (isAlphaNum && !st.revealed.includes(i)) candidates.push(i)
    }
    if (candidates.length === 0) return st.revealed
    const idx = candidates[Math.floor(Math.random() * candidates.length)]
    st.revealed.push(idx)
    return st.revealed
  }

  const swapQuestionForCard = (position) => {
    ensureCardQuestionState(position)
    const st = cardQuestionState.value[position]
    if (!st) return
    let next = getRandomQuestion()
    let guard = 0
    while (next && next.id === st.questionId && guard < 10) {
      next = getRandomQuestion()
      guard++
    }
    if (next && next.id) st.questionId = next.id
    st.revealed = []
    st.wrong = 0
  }

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
    attempts.value = 0
    timer.value = 0
    gameCompleted.value = false
    isCardDisabled.value = false
    currentPlayer.value = 1
    player1Points.value = 0
    player2Points.value = 0
    player1Matches.value = 0
    player2Matches.value = 0
    player1Attempts.value = 0
    player2Attempts.value = 0
    winner.value = null
    currentTurnAttempts.value = 0
    showContinueChoice.value = false
    isFirstAttemptInTurn.value = true
    isProcessingClick.value = false

    // Init poin per kartu: set 100 untuk setiap posisi kartu
    cardPoints.value = {}
    for (let pos = 1; pos <= cards.value.length; pos++) {
      cardPoints.value[pos] = 100
    }
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
    ensureCardQuestionState(cardPosition)
    const st = cardQuestionState.value[cardPosition]
    currentQuestion.value = getQuestionById(st.questionId)
    showQuestionModal.value = true

    setTimeout(() => {
      isProcessingClick.value = false
    }, 500)
  }

  const handleCorrectAnswer = () => {
    if (pendingCardIndex.value === null || !showQuestionModal.value) return

    const cardIndex = pendingCardIndex.value
    const currentPlayerBeforeMatch = currentPlayer.value
    const cardPosition = cardIndex + 1

    attempts.value++
    if (currentPlayerBeforeMatch === 1) {
      player1Attempts.value++
    } else {
      player2Attempts.value++
    }

    // Award poin kartu kepada pemain yang menjawab benar (tanpa emit event)
    const gainedFromCard = awardCardPointsToPlayerSilent(cardPosition, currentPlayerBeforeMatch)

    showQuestionModal.value = false
    currentQuestion.value = null
    pendingCardIndex.value = null
    cards.value[cardIndex].isFlipped = true
    // Cleanup per-card state when matched
    if (cardQuestionState.value[cardPosition]) delete cardQuestionState.value[cardPosition]

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

      // Catat match untuk pemain saat ini (untuk tie-breaker)
      if (currentPlayerBeforeMatch === 1) player1Matches.value++
      else player2Matches.value++

      // Bonus poin saat terjadi match
      const matchBonus = 100
      if (currentPlayerBeforeMatch === 1) player1Points.value += matchBonus
      else player2Points.value += matchBonus

      // Emit satu event total: poin kartu + bonus match
      const totalGain = (gainedFromCard || 0) + matchBonus
      if (totalGain > 0) registerPointGain(currentPlayerBeforeMatch, totalGain)

      if (matchedPairs.value === 7) {
        gameCompleted.value = true
        stopTimer()
        resetTurnState()
        // Winner by total points; tie-breaker by total matches
        if (player1Points.value > player2Points.value) {
          winner.value = 1
        } else if (player2Points.value > player1Points.value) {
          winner.value = 2
        } else {
          // tie on points -> compare matches
          if (player1Matches.value > player2Matches.value) winner.value = 1
          else if (player2Matches.value > player1Matches.value) winner.value = 2
          else winner.value = 'tie'
        }
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
      // Tidak match: emit event hanya dari poin kartu jika ada
      if (gainedFromCard > 0) registerPointGain(currentPlayerBeforeMatch, gainedFromCard)
    }
  }

  const handleWrongAnswer = () => {
    if (!showQuestionModal.value) return

    attempts.value++
    if (currentPlayer.value === 1) player1Attempts.value++
    else player2Attempts.value++

    const pos = (pendingCardIndex.value ?? -1) + 1
    if (pos > 0) {
      ensureCardQuestionState(pos)
      const st = cardQuestionState.value[pos]
      if (st) {
        st.wrong = (st.wrong || 0) + 1
        if (st.wrong >= 3) {
          swapQuestionForCard(pos)
        }
      }
    }

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

  // Reveal clue for the currently open card (one random letter, max 2)
  const revealClue = () => {
    if (pendingCardIndex.value === null) return
    const position = pendingCardIndex.value + 1
    // Kurangi poin hanya jika berhasil mengungkap huruf baru
    ensureCardQuestionState(position)
    const before = (cardQuestionState.value[position]?.revealed?.length) || 0
    revealRandomLetterForPosition(position)
    const after = (cardQuestionState.value[position]?.revealed?.length) || 0
    if (after > before) {
      reduceCardPoints(position, 20)
    }
  }

  // Points helpers
  const getCardPoints = (position) => {
    return cardPoints.value[position] ?? 0
  }

  const reduceCardPoints = (position, amount) => {
    if (cardPoints.value[position] == null) cardPoints.value[position] = 100
    cardPoints.value[position] = Math.max(0, (cardPoints.value[position] || 0) - amount)
  }

  const awardCardPointsToPlayer = (position, playerId) => {
    const pts = cardPoints.value[position] ?? 0
    if (pts > 0) {
      if (playerId === 1) player1Points.value += pts
      else player2Points.value += pts
      // Setelah diambil, poin kartu jadi 0
      cardPoints.value[position] = 0
      registerPointGain(playerId, pts)
    }
  }

  // Versi silent: tidak emit event; mengembalikan jumlah poin yang dipindahkan
  const awardCardPointsToPlayerSilent = (position, playerId) => {
    const pts = cardPoints.value[position] ?? 0
    if (pts > 0) {
      if (playerId === 1) player1Points.value += pts
      else player2Points.value += pts
      cardPoints.value[position] = 0
      return pts
    }
    return 0
  }

  // Emit event animasi poin
  const registerPointGain = (playerId, amount) => {
    pointGainEvent.value = { playerId, amount, ts: Date.now() }
  }

  return {
    // state
    cards,
    openedCards,
    matchedPairs,
    gameStarted,
    namesSet,
    gameCompleted,
    attempts,
    timer,
    isCardDisabled,

    showQuestionModal,
    currentQuestion,
    pendingCardIndex,

    currentPlayer,
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
    // points
    player1Points,
    player2Points,
    player1Matches,
    player2Matches,
    getCardPoints,
    pointGainEvent,
    
    getWrongCountForPosition,
    getRevealedIndices,
    revealClue,
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
