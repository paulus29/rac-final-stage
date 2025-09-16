import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useQuestionDeck } from '@/composables/useQuestionDeck'

export const useSnakesLaddersStore = defineStore('snakesLadders', () => {
  // Core game state
  const players = ref([
    {
      id: 1,
      name: 'Kelompok 1',
      icon: '🔴',
      color: 'red',
      position: 1,
      finished: false,
      rank: null,
      shield: 0,
    },
    {
      id: 2,
      name: 'Kelompok 2',
      icon: '🟢',
      color: 'green',
      position: 1,
      finished: false,
      rank: null,
      shield: 0,
    },
    {
      id: 3,
      name: 'Kelompok 3',
      icon: '🔵',
      color: 'blue',
      position: 1,
      finished: false,
      rank: null,
      shield: 0,
    },
  ])

  const selectedPlayerId = ref(null)
  const steps = ref(1)
  // Catatan: grid saat ini 7x7 sesuai kode asal
  const boardSize = ref(7)

  const isAnimating = ref(false)

  // Modal/UI game-state
  const showResetModal = ref(false)
  const showNameInput = ref(true)

  // Ranking & finish state
  const nextRank = ref(1)
  const showFinishModal = ref(false)
  const finishPlayerName = ref('')
  const finishPlayerRank = ref(1)
  const showFinalModal = ref(false)

  // Challenge system state
  // markers: { [cellNumber]: 'optional' | 'forced' }
  const markers = ref({})
  const showChallengeModal = ref(false)
  const challengeType = ref('optional')
  const challengeQuestion = ref(null)
  const landedPlayerId = ref(null)
  const selectedAnswererId = ref(null)

  // Reward state
  const showRewardModal = ref(false)
  const rewardPlayerId = ref(null)

  // Question deck
  const deck = useQuestionDeck()

  // Persistent mapping: cell -> { q: QuestionObj, wrongOptions: number[], asked: boolean }
  const cellQuestions = ref({})
  // Disabled options for current challenge (derived from cellQuestions)
  const challengeDisabledOptions = ref([])
  // Track which cell is currently challenging
  const activeChallengeCell = ref(null)
  // Global list of question IDs that have been asked (any cell)
  const usedQuestionIds = ref([])

  // Getters
  const selectedPlayerName = computed(() => {
    const player = players.value.find((p) => p.id === selectedPlayerId.value)
    return player ? player.name : ''
  })

  const maxCell = computed(() => boardSize.value * boardSize.value)

  // Utils
  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  // Actions
  const generateMarkers = () => {
    const total = boardSize.value * boardSize.value
    const eligible = []
    for (let n = 2; n <= total - 1; n++) eligible.push(n)
    // Gunakan rasio 1/3 dari sel yang memenuhi syarat (tanpa start & finish)
    const count = Math.floor(eligible.length / 3)
    const chosen = shuffle(eligible).slice(0, count)
    const map = {}
    const half = Math.floor(chosen.length / 2)
    const optionalCells = chosen.slice(0, half)
    const forcedCells = chosen.slice(half)
    optionalCells.forEach((cell) => (map[cell] = 'optional'))
    forcedCells.forEach((cell) => (map[cell] = 'forced'))
    markers.value = map
  }

  const init = async () => {
    // Set default selected player & prepare deck/markers
    selectedPlayerId.value = players.value[0]?.id ?? null
    generateMarkers()
    await deck.load()
    assignQuestionsToAllMarkers()
  }

  const getUsedSet = () => new Set(usedQuestionIds.value)

  const assignQuestionsToAllMarkers = () => {
    const markerCells = Object.keys(markers.value).map((k) => parseInt(k, 10))
    if (!deck.deck || !Array.isArray(deck.deck.value)) return
    const all = deck.deck.value
    const assigned = new Set()
    let cursor = 0
    for (const cell of markerCells) {
      // Pick next question not yet assigned in this pass to maximize uniqueness
      let chosen = null
      for (let tries = 0; tries < all.length; tries++) {
        const q = all[(cursor + tries) % all.length]
        if (!assigned.has(q.id)) {
          chosen = q
          cursor = (cursor + tries + 1) % all.length
          break
        }
      }
      if (!chosen) {
        // Fallback: reuse
        chosen = all[cursor]
        cursor = (cursor + 1) % all.length
      }
      cellQuestions.value[cell] = {
        q: chosen,
        wrongOptions: [],
        wrongAttempts: 0,
        asked: false,
      }
      assigned.add(chosen.id)
    }
  }

  const ensureCellHasQuestion = (cell) => {
    if (!cellQuestions.value[cell]) {
      assignQuestionsToAllMarkers()
    }
  }

  const markQuestionAskedForCell = (cell) => {
    const entry = cellQuestions.value[cell]
    if (!entry) return
    if (!entry.asked) {
      entry.asked = true
      if (!usedQuestionIds.value.includes(entry.q.id)) usedQuestionIds.value.push(entry.q.id)
    }
  }

  const reassignCellQuestion = (cell) => {
    if (!deck.deck || !Array.isArray(deck.deck.value)) return
    const all = deck.deck.value
    const used = getUsedSet()
    // Prefer a question not yet asked globally
    let chosen = all.find((q) => !used.has(q.id))
    if (!chosen) {
      // Fallback: pick any (avoid current one if possible)
      const currentId = cellQuestions.value[cell]?.q?.id
      chosen = all.find((q) => q.id !== currentId) || all[0]
    }
    cellQuestions.value[cell] = {
      q: chosen,
      wrongOptions: [],
      wrongAttempts: 0,
      asked: false,
    }
  }

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

  const resetGame = () => {
    showResetModal.value = true
  }

  const confirmReset = () => {
    players.value.forEach((player) => {
      player.position = 1
      player.finished = false
      player.rank = null
      player.shield = 0
    })
    selectedPlayerId.value = null
    steps.value = 1
    showResetModal.value = false
    nextRank.value = 1
    showFinishModal.value = false
    showFinalModal.value = false
    // Kembali ke input nama pemain
    showNameInput.value = true
    // Bersihkan state tantangan & reward agar tidak tersisa overlay
    showChallengeModal.value = false
    challengeType.value = 'optional'
    challengeQuestion.value = null
    landedPlayerId.value = null
    selectedAnswererId.value = null
    showRewardModal.value = false
    generateMarkers()
    // Reset mapping & usage tracking
    cellQuestions.value = {}
    usedQuestionIds.value = []
    activeChallengeCell.value = null
    challengeDisabledOptions.value = []
    assignQuestionsToAllMarkers()
  }

  const startGameSetNames = ({ player1Name, player2Name, player3Name }) => {
    if (import.meta.env.DEV) {
      console.log('[SL Store] startGameSetNames', {
        player1Name,
        player2Name,
        player3Name,
      })
    }
    if (players.value[0]) players.value[0].name = player1Name
    if (players.value[1]) players.value[1].name = player2Name
    if (players.value[2]) players.value[2].name = player3Name
    showNameInput.value = false
    selectedPlayerId.value = players.value[0]?.id ?? null
  }

  const getNextActivePlayerId = (fromId) => {
    if (!players.value || players.value.length === 0) return null
    const unfinished = players.value.filter((p) => !p.finished)
    if (unfinished.length === 0) return null
    let startIndex = players.value.findIndex((p) => p.id === fromId)
    if (startIndex === -1) startIndex = 0
    const total = players.value.length
    for (let step = 1; step <= total; step++) {
      const nextIndex = (startIndex + step) % total
      const cand = players.value[nextIndex]
      if (!cand.finished) return cand.id
    }
    return unfinished[0].id
  }

  const maybeTriggerChallenge = async (playerIndex) => {
    if (players.value[playerIndex]?.finished) return
    const cell = players.value[playerIndex]?.position
    const type = markers.value[cell]
    if (!type) return

    landedPlayerId.value = players.value[playerIndex].id
    challengeType.value = type
    selectedAnswererId.value = type === 'forced' ? landedPlayerId.value : null
    activeChallengeCell.value = cell
    ensureCellHasQuestion(cell)
    // Ambil pertanyaan yang sudah dipetakan untuk sel ini
    const entry = cellQuestions.value[cell]
    if (entry && entry.q) {
      challengeQuestion.value = entry.q
      challengeDisabledOptions.value = [...(entry.wrongOptions || [])]
    } else {
      // Fallback minimal jika tidak ada entry karena alasan tertentu
      challengeQuestion.value = {
        id: 0,
        question: 'Pertanyaan tidak tersedia. Coba lagi.',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctIndex: 0,
      }
      challengeDisabledOptions.value = []
    }
    showChallengeModal.value = true
  }

  const closeChallenge = () => {
    showChallengeModal.value = false
    // Jika tantangan ditutup (mis. memilih tidak membuka pada sel '!'), ganti giliran
    if (landedPlayerId.value != null) {
      selectedPlayerId.value = getNextActivePlayerId(landedPlayerId.value)
    }
    // Bersihkan state aktif tantangan
    landedPlayerId.value = null
    selectedAnswererId.value = null
    activeChallengeCell.value = null
    challengeDisabledOptions.value = []
  }

  const onChallengeDecide = (answererId) => {
    selectedAnswererId.value = answererId
    // Tandai pertanyaan pada sel aktif sebagai sudah pernah ditanyakan saat penjawab diputuskan
    if (activeChallengeCell.value != null) {
      markQuestionAskedForCell(activeChallengeCell.value)
    }
  }

  // Update state per hasil jawaban (mark wrong options, or reassign question on correct)
  const onJudgeResult = ({ isCorrect, selectedIndex = null }) => {
    const cell = activeChallengeCell.value
    if (!cell) return
    const entry = cellQuestions.value[cell]
    if (!entry) return
    if (!isCorrect && selectedIndex != null) {
      if (!entry.wrongOptions.includes(selectedIndex)) entry.wrongOptions.push(selectedIndex)
      // Hitung percobaan salah untuk soal pada sel ini
      entry.wrongAttempts = (entry.wrongAttempts || 0) + 1
      if (entry.wrongAttempts >= 2) {
        // Setelah 2 kali salah, ganti soal untuk sel ini
        reassignCellQuestion(cell)
      }
    }
    if (isCorrect) {
      // Ganti pertanyaan untuk sel ini dengan yang belum pernah ditanyakan
      reassignCellQuestion(cell)
    }
  }

  return {
    // state
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
    showChallengeModal,
    challengeType,
    challengeQuestion,
    challengeDisabledOptions,
    landedPlayerId,
    selectedAnswererId,

    showRewardModal,
    rewardPlayerId,

    // getters
    selectedPlayerName,
    maxCell,

    // actions
    init,
    generateMarkers,
    selectPlayer,
    incrementSteps,
    decrementSteps,
    setSteps,
    resetGame,
    confirmReset,
    startGameSetNames,
    getNextActivePlayerId,
    maybeTriggerChallenge,
    closeChallenge,
    onChallengeDecide,
    onJudgeResult,
  }
})
