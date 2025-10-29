import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuestions } from '@/composables/useQuestions'
import { useSoundEffects } from '@/composables/useSoundEffects'

const STORAGE_KEY = 'matchGame_gameState'

// Helper functions untuk localStorage
const saveToStorage = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save game state:', error)
  }
}

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
}

const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear game state:', error)
  }
}

export const useMatchGameStore = defineStore('matchGame', () => {
  // Sound effects
  const {
    playOpenCard,
    playMatchCard,
    playFinishGame,
    playMatchGameBackgroundMusic,
    stopMatchGameBackgroundMusic,
    fadeOutMatchGameBackgroundMusic,
    fadeInMatchGameBackgroundMusic,
  } = useSoundEffects()

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
  const isPaused = ref(false)

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
  const { questions, loadQuestions, getQuestionById } = useQuestions()

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
  const nextQuestionId = ref(1)
  // Cumulative set of used question IDs (persisted). Do not decrement when swapped out
  const usedQuestionIds = ref([])

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
    return st ? st.wrong || 0 : 0
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

  const getAllUsedQuestionIds = () => {
    const used = new Set()
    const totalCards = cards.value.length
    for (let pos = 1; pos <= totalCards; pos++) {
      const st = cardQuestionState.value[pos]
      if (st && st.questionId) used.add(st.questionId)
      else used.add(pos)
    }
    return used
  }

  const addUsedQuestionId = (id) => {
    if (typeof id !== 'number') return
    if (!usedQuestionIds.value.includes(id)) usedQuestionIds.value.push(id)
  }

  const assignNextSequentialQuestionForCard = (position) => {
    ensureCardQuestionState(position)
    const st = cardQuestionState.value[position]
    if (!st) return

    if (!nextQuestionId.value || nextQuestionId.value <= cards.value.length) {
      nextQuestionId.value = cards.value.length + 1
    }

    const total = questions.value?.length || 0
    const used = getAllUsedQuestionIds()
    if (st.questionId) used.add(st.questionId)

    let assignedId = null
    if (total > 0) {
      for (let id = nextQuestionId.value; id <= total; id++) {
        if (!used.has(id)) {
          assignedId = id
          break
        }
      }
      if (assignedId == null) {
        for (let id = 1; id <= total; id++) {
          if (!used.has(id)) {
            assignedId = id
            break
          }
        }
      }
    }

    if (assignedId != null) {
      st.questionId = assignedId
      nextQuestionId.value = assignedId + 1
      addUsedQuestionId(assignedId)
    }
    st.revealed = []
    st.wrong = 0
    cardPoints.value[position] = 100
  }

  const swapQuestionForCard = (position) => {
    assignNextSequentialQuestionForCard(position)
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
  const usedQuestionCount = computed(() => usedQuestionIds.value.length)
  const totalQuestions = computed(() => questions.value?.length || 0)

  // Helpers
  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  const initializeGame = () => {
    // Generate letters A-G (7 pairs)
    // const letters = []
    // for (let i = 0; i < 7; i++) {
    //   const letter = String.fromCharCode(65 + i) // A=65, B=66, ..., G=71
    //   letters.push(letter, letter)
    // }
    // shuffleArray(letters)
    const letters = ['C', 'A', 'E', 'G', 'B', 'F', 'D', 'E', 'A', 'C', 'F', 'B', 'D', 'G']
    cards.value = letters.map((letter) => ({ letter, isFlipped: false, isMatched: false }))
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
    isPaused.value = false

    // Reset card question state untuk reload pertanyaan
    cardQuestionState.value = {}
    // Reset cumulative used list
    usedQuestionIds.value = []
    // Pre-assign 14 pertanyaan awal: pos -> id (fallback ke pos jika id tidak ada)
    const totalQ = totalQuestions.value
    const totalCards = cards.value.length
    for (let pos = 1; pos <= totalCards; pos++) {
      const fallbackId = pos
      const q = getQuestionById(pos)
      const qid = typeof q?.id === 'number' ? q.id : fallbackId
      cardQuestionState.value[pos] = { questionId: qid, revealed: [], wrong: 0 }
      addUsedQuestionId(qid)
    }

    // Init poin per kartu: set 100 untuk setiap posisi kartu
    cardPoints.value = {}
    for (let pos = 1; pos <= cards.value.length; pos++) {
      cardPoints.value[pos] = 100
    }
    // Mulai pointer setelah id terbesar yang telah digunakan atau setelah jumlah kartu
    const maxUsed = usedQuestionIds.value.length
      ? Math.max(...usedQuestionIds.value)
      : cards.value.length
    nextQuestionId.value = Math.max(cards.value.length + 1, maxUsed + 1)
  }

  const startTimer = () => {
    if (timerId) return
    timerId = setInterval(() => {
      if (!isPaused.value) {
        timer.value += 1
      }
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
    // Stop background music saat reset
    stopMatchGameBackgroundMusic()
    // Clear localStorage saat reset
    clearStorage()
    // Reload pertanyaan dari file
    loadQuestions()
  }

  const handlePlayerNames = ({ player1Name: p1, player2Name: p2 }) => {
    player1Name.value = p1
    player2Name.value = p2
    namesSet.value = true
    startGame()
    // Play background music saat game dimulai
    playMatchGameBackgroundMusic()
  }

  const handleResetFromModal = () => {
    resetGame()
    // Stop background music saat reset dari modal
    stopMatchGameBackgroundMusic()
    // Clear localStorage saat reset dari modal
    clearStorage()
    // Reload pertanyaan dari file
    loadQuestions()
  }

  const handleCardClick = (cardIndex) => {
    if (
      isProcessingClick.value ||
      isCardDisabled.value ||
      isPaused.value ||
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

    // Play sound: kartu berhasil dibuka
    playOpenCard()

    // Cleanup per-card state when matched
    if (cardQuestionState.value[cardPosition]) delete cardQuestionState.value[cardPosition]

    const matchingCardIndex = openedCards.value.find(
      (openIndex) =>
        cards.value[openIndex].letter === cards.value[cardIndex].letter &&
        !cards.value[openIndex].isMatched,
    )

    openedCards.value.push(cardIndex)

    if (matchingCardIndex !== undefined) {
      cards.value[cardIndex].isMatched = true
      cards.value[matchingCardIndex].isMatched = true
      matchedPairs.value++

      // Play sound: 2 kartu match
      playMatchCard()

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

        // Fade out background music, play finish sound, lalu fade in
        fadeOutMatchGameBackgroundMusic(500).then(() => {
          // Play sound: game selesai
          playFinishGame()
          // Tunggu finish sound selesai (sekitar 2 detik), lalu fade in background
          setTimeout(() => fadeInMatchGameBackgroundMusic(), 2000)
        })

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

  const pauseGame = () => {
    if (gameCompleted.value || !gameStarted.value) return
    // Tutup modal pertanyaan jika sedang terbuka saat pause
    if (showQuestionModal.value) {
      handleCloseModal()
    }
    isPaused.value = true
  }

  const resumeGame = () => {
    if (gameCompleted.value || !gameStarted.value) return
    isPaused.value = false
  }

  const forceEndGame = () => {
    if (gameCompleted.value || !gameStarted.value) return

    // Tutup modal pertanyaan jika sedang terbuka
    if (showQuestionModal.value) {
      showQuestionModal.value = false
      currentQuestion.value = null
      pendingCardIndex.value = null
    }

    // Tutup modal pilihan turn jika sedang terbuka
    if (showContinueChoice.value) {
      showContinueChoice.value = false
    }

    // Set game sebagai selesai
    gameCompleted.value = true
    stopTimer()
    resetTurnState()

    // Tentukan pemenang berdasarkan state saat ini
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

    // Fade out background music, play finish sound, lalu fade in
    fadeOutMatchGameBackgroundMusic(500).then(() => {
      playFinishGame()
      setTimeout(() => fadeInMatchGameBackgroundMusic(), 2000)
    })
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
    const before = cardQuestionState.value[position]?.revealed?.length || 0
    revealRandomLetterForPosition(position)
    const after = cardQuestionState.value[position]?.revealed?.length || 0
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

  // Load state dari localStorage saat store diinisialisasi
  const loadState = () => {
    const saved = loadFromStorage()
    if (saved) {
      // Check if saved data uses old format (number) instead of new format (letter)
      if (saved.cards && saved.cards.length > 0 && saved.cards[0].number !== undefined) {
        console.log('[MatchGame] Old format detected, clearing storage')
        clearStorage()
        return false
      }

      // Restore core game state
      if (saved.cards) cards.value = saved.cards
      if (saved.openedCards) openedCards.value = saved.openedCards
      if (saved.matchedPairs !== undefined) matchedPairs.value = saved.matchedPairs
      if (saved.gameStarted !== undefined) gameStarted.value = saved.gameStarted
      if (saved.namesSet !== undefined) namesSet.value = saved.namesSet
      if (saved.gameCompleted !== undefined) gameCompleted.value = saved.gameCompleted
      if (saved.attempts !== undefined) attempts.value = saved.attempts
      if (saved.timer !== undefined) timer.value = saved.timer

      // Restore player state
      if (saved.currentPlayer !== undefined) currentPlayer.value = saved.currentPlayer
      if (saved.player1Points !== undefined) player1Points.value = saved.player1Points
      if (saved.player2Points !== undefined) player2Points.value = saved.player2Points
      if (saved.player1Matches !== undefined) player1Matches.value = saved.player1Matches
      if (saved.player2Matches !== undefined) player2Matches.value = saved.player2Matches
      if (saved.player1Attempts !== undefined) player1Attempts.value = saved.player1Attempts
      if (saved.player2Attempts !== undefined) player2Attempts.value = saved.player2Attempts
      if (saved.player1Name) player1Name.value = saved.player1Name
      if (saved.player2Name) player2Name.value = saved.player2Name
      if (saved.winner !== undefined) winner.value = saved.winner

      // Restore card points and question state
      if (saved.cardPoints) cardPoints.value = saved.cardPoints
      if (saved.cardQuestionState) cardQuestionState.value = saved.cardQuestionState
      if (saved.usedQuestionIds) {
        usedQuestionIds.value = saved.usedQuestionIds
      } else {
        // Rebuild used list from current mapping if missing (backward compat)
        try {
          usedQuestionIds.value = []
          const s = cardQuestionState.value || {}
          const set = new Set()
          for (const k in s) {
            const qid = s[k]?.questionId
            if (typeof qid === 'number') set.add(qid)
          }
          usedQuestionIds.value = Array.from(set)
        } catch (e) {}
      }

      if (saved.nextQuestionId !== undefined) {
        nextQuestionId.value = saved.nextQuestionId
      } else {
        let maxId = cards.value.length
        try {
          const entries = cardQuestionState.value || {}
          for (const k in entries) {
            const qid = entries[k]?.questionId
            if (typeof qid === 'number') {
              if (qid > maxId) maxId = qid
            }
          }
        } catch (e) {}
        nextQuestionId.value = maxId + 1
      }

      // Restore turn/kesempatan state
      if (saved.currentTurnAttempts !== undefined)
        currentTurnAttempts.value = saved.currentTurnAttempts
      if (saved.showContinueChoice !== undefined)
        showContinueChoice.value = saved.showContinueChoice
      if (saved.isFirstAttemptInTurn !== undefined)
        isFirstAttemptInTurn.value = saved.isFirstAttemptInTurn

      // Restore pause state
      if (saved.isPaused !== undefined) isPaused.value = saved.isPaused

      // Load pertanyaan jika game sudah dimulai (namesSet = true)
      if (saved.namesSet) {
        loadQuestions()
      }

      // Restart timer jika game sedang berlangsung (started tapi belum completed)
      if (saved.gameStarted && !saved.gameCompleted) {
        startTimer()
      }

      console.log('[MatchGame] State loaded from localStorage:', {
        cards: cards.value.length,
        matchedPairs: matchedPairs.value,
        gameStarted: gameStarted.value,
      })

      return true
    }
    return false
  }

  // Auto-save state ke localStorage setiap ada perubahan penting
  const setupAutoSave = () => {
    watch(
      [
        cards,
        openedCards,
        matchedPairs,
        gameStarted,
        namesSet,
        gameCompleted,
        attempts,
        timer,
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
        cardPoints,
        cardQuestionState,
        currentTurnAttempts,
        showContinueChoice,
        isFirstAttemptInTurn,
        nextQuestionId,
        isPaused,
      ],
      () => {
        const stateToSave = {
          cards: cards.value,
          openedCards: openedCards.value,
          matchedPairs: matchedPairs.value,
          gameStarted: gameStarted.value,
          namesSet: namesSet.value,
          gameCompleted: gameCompleted.value,
          attempts: attempts.value,
          timer: timer.value,
          currentPlayer: currentPlayer.value,
          player1Points: player1Points.value,
          player2Points: player2Points.value,
          player1Matches: player1Matches.value,
          player2Matches: player2Matches.value,
          player1Attempts: player1Attempts.value,
          player2Attempts: player2Attempts.value,
          player1Name: player1Name.value,
          player2Name: player2Name.value,
          winner: winner.value,
          cardPoints: cardPoints.value,
          cardQuestionState: cardQuestionState.value,
          currentTurnAttempts: currentTurnAttempts.value,
          showContinueChoice: showContinueChoice.value,
          isFirstAttemptInTurn: isFirstAttemptInTurn.value,
          nextQuestionId: nextQuestionId.value,
          isPaused: isPaused.value,
          usedQuestionIds: usedQuestionIds.value,
        }
        saveToStorage(stateToSave)
      },
      { deep: true },
    )
  }

  // Load state saat store pertama kali dibuat
  loadState()
  // Setup auto-save
  setupAutoSave()

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
    isPaused,

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
    usedQuestionCount,
    totalQuestions,

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
    pauseGame,
    resumeGame,
    forceEndGame,
  }
})
