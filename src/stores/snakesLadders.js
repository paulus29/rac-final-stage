import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useQuestionDeck } from '@/composables/useQuestionDeck'

/**
 * Store Pinia untuk game Ular Tangga (Snakes & Ladders) dengan sistem tantangan.
 * Berisi:
 * - State pemain, papan, marker tantangan ("?" opsional, "!" wajib), dan checkpoint per baris.
 * - Integrasi deck pertanyaan pilihan ganda.
 * - Logika pemetaan pertanyaan permanen per sel, tracking opsi salah, dan rotasi soal.
 * - Mekanisme checkpoint satu-kali per pemain saat melintasi awal baris.
 */
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
  const checkpointCells = ref([])
  const showChallengeModal = ref(false)
  const challengeType = ref('optional')
  const challengeQuestion = ref(null)
  const landedPlayerId = ref(null)
  const selectedAnswererId = ref(null)
  const activeChallengeSource = ref(null)

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
  // Checkpoint visited per playerId: { [playerId]: number[] }
  const visitedCheckpoints = ref({})

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
  /**
   * Menghasilkan peta marker "?" (optional) dan "!" (forced) secara acak
   * dengan rasio 1/3 dari sel eligible (tanpa start/finish dan tanpa checkpoint).
   */
  const generateMarkers = () => {
    const total = boardSize.value * boardSize.value
    const eligible = []
    for (let n = 2; n <= total - 1; n++) eligible.push(n)
    if (checkpointCells.value && checkpointCells.value.length) {
      const skip = new Set(checkpointCells.value)
      for (let i = eligible.length - 1; i >= 0; i--) {
        if (skip.has(eligible[i])) eligible.splice(i, 1)
      }
    }
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

  /**
   * Menentukan sel checkpoint di awal baris (mengikuti arah zigzag):
   * - Baris genap (dari bawah) → awal baris di kiri.
   * - Baris ganjil (dari bawah) → awal baris di kanan.
   * Selang-seling antar baris (ambil setengahnya) agar beban pertanyaan seimbang.
   */
  const generateCheckpoints = () => {
    const cells = []
    const size = boardSize.value
    if (size <= 2) {
      checkpointCells.value = []
      return
    }
    // Baris logis dihitung dari bawah (row 0 = start row, row size-1 = finish row)
    for (let logicalRow = 1; logicalRow < size - 1; logicalRow++) {
      // Selang-seling: ambil hanya baris ganjil (setengah dari total baris tengah)
      const includeRow = logicalRow % 2 === 1
      if (!includeRow) continue
      const isEvenLogical = logicalRow % 2 === 0
      const cellNumber = isEvenLogical
        ? logicalRow * size + 1 // awal baris di kiri untuk baris genap (arah kiri->kanan)
        : (logicalRow + 1) * size // awal baris di kanan untuk baris ganjil (arah kanan->kiri)
      cells.push(cellNumber)
    }
    checkpointCells.value = cells
  }

  /**
   * Inisialisasi game: set pemain aktif, generate checkpoint & marker,
   * memuat deck pertanyaan, dan memetakan soal ke semua sel tantangan.
   */
  const init = async () => {
    // Set default selected player & prepare deck/markers
    selectedPlayerId.value = players.value[0]?.id ?? null
    generateCheckpoints()
    generateMarkers()
    await deck.load()
    assignQuestionsToAllMarkers()
    // init visited
    visitedCheckpoints.value = {}
  }

  const getUsedSet = () => new Set(usedQuestionIds.value)

  /**
   * Mengambil gabungan seluruh sel yang dapat menantang: marker ("?"/"!") + checkpoint.
   */
  const getAllChallengeCells = () => {
    const union = new Set()
    Object.keys(markers.value).forEach((k) => union.add(parseInt(k, 10)))
    checkpointCells.value.forEach((cell) => union.add(cell))
    return Array.from(union.values())
  }

  /**
   * Memetakan pertanyaan ke semua sel tantangan (sekali di awal),
   * memaksimalkan keunikan sementara dan membersihkan entry yang tidak lagi valid.
   */
  const assignQuestionsToAllMarkers = () => {
    const challengeCells = getAllChallengeCells()
    if (challengeCells.length === 0) return
    if (!deck.deck || !Array.isArray(deck.deck.value)) return
    const all = deck.deck.value
    const assigned = new Set()
    let cursor = 0
    const challengeSet = new Set(challengeCells)

    // Bersihkan entry yang tidak lagi termasuk sel tantangan
    for (const key of Object.keys(cellQuestions.value)) {
      const numericKey = parseInt(key, 10)
      if (!challengeSet.has(numericKey)) delete cellQuestions.value[key]
    }

    for (const cell of challengeCells) {
      if (cellQuestions.value[cell]) continue
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

  /**
   * Menjamin sel memiliki entry pertanyaan. Jika belum, panggil pemetaan ulang.
   */
  const ensureCellHasQuestion = (cell) => {
    if (!cellQuestions.value[cell]) {
      assignQuestionsToAllMarkers()
    }
  }

  /**
   * Menandai bahwa soal pada sel ini sudah pernah ditanyakan (asked),
   * dan menambah id soal ke daftar global usedQuestionIds.
   */
  const markQuestionAskedForCell = (cell) => {
    const entry = cellQuestions.value[cell]
    if (!entry) return
    if (!entry.asked) {
      entry.asked = true
      if (!usedQuestionIds.value.includes(entry.q.id)) usedQuestionIds.value.push(entry.q.id)
    }
  }

  /**
   * Mengganti pertanyaan untuk sebuah sel dengan prioritas
   * ke soal yang belum pernah ditanyakan secara global.
   */
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

  /** Memilih pemain aktif pada panel Game Master. */
  const selectPlayer = (playerId) => {
    selectedPlayerId.value = playerId
  }

  /** Menambah jumlah langkah (maks 6). */
  const incrementSteps = () => {
    if (steps.value < 6) steps.value++
  }

  /** Mengurangi jumlah langkah (min 1). */
  const decrementSteps = () => {
    if (steps.value > 1) steps.value--
  }

  /** Set jumlah langkah secara langsung (dipakai oleh input number). */
  const setSteps = (value) => {
    steps.value = value
  }

  /** Menampilkan modal konfirmasi reset permainan. */
  const resetGame = () => {
    showResetModal.value = true
  }

  /** Melakukan reset penuh state permainan ke kondisi awal. */
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
    generateCheckpoints()
    generateMarkers()
    // Reset mapping & usage tracking
    cellQuestions.value = {}
    usedQuestionIds.value = []
    activeChallengeCell.value = null
    activeChallengeSource.value = null
    challengeDisabledOptions.value = []
    visitedCheckpoints.value = {}
    assignQuestionsToAllMarkers()
  }

  /** Set nama 3 pemain dan menutup modal input nama. */
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

  /**
   * Mengembalikan ID pemain berikutnya yang belum finish secara round-robin,
   * dimulai dari pemain setelah fromId.
   */
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

  /** Mengecek apakah suatu sel adalah checkpoint. */
  const isCheckpointCell = (cell) => checkpointCells.value.includes(cell)
  /** Mendapatkan array checkpoint yang sudah dikunjungi oleh pemain tertentu. */
  const getVisitedList = (playerId) => {
    if (!visitedCheckpoints.value[playerId]) visitedCheckpoints.value[playerId] = []
    return visitedCheckpoints.value[playerId]
  }
  /** Apakah pemain sudah pernah melewati checkpoint tertentu. */
  const hasVisitedCheckpoint = (playerId, cell) => getVisitedList(playerId).includes(cell)
  /** Menandai checkpoint sebagai sudah dikunjungi untuk pemain tertentu. */
  const markVisitedCheckpoint = (playerId, cell) => {
    const list = getVisitedList(playerId)
    if (!list.includes(cell)) list.push(cell)
  }

  /**
   * Mendeteksi checkpoint pertama yang dilintasi pada lintasan [from -> to].
   * Mengembalikan nomor sel checkpoint jika ditemukan dan belum visited, selain itu null.
   */
  const getCrossedCheckpointCell = (from, to, playerId) => {
    if (from === to) return null
    const dir = to > from ? 1 : -1
    for (let pos = from + dir; dir > 0 ? pos <= to : pos >= to; pos += dir) {
      if (isCheckpointCell(pos) && !hasVisitedCheckpoint(playerId, pos)) {
        return pos
      }
    }
    return null
  }

  /**
   * Memicu tantangan berdasarkan marker pada sel mendarat saat ini.
   * Mengabaikan checkpoint (ditangani terpisah). Return true jika tantangan terbuka.
   */
  const maybeTriggerChallenge = async (playerIndex) => {
    if (players.value[playerIndex]?.finished) return false
    const cell = players.value[playerIndex]?.position
    const type = markers.value[cell]
    if (!type) return false

    landedPlayerId.value = players.value[playerIndex].id
    challengeType.value = type
    activeChallengeSource.value = 'marker'
    const isForcedLike = type === 'forced'
    selectedAnswererId.value = isForcedLike ? landedPlayerId.value : null
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
    return true
  }

  /**
   * Memicu tantangan checkpoint (tipe forced) untuk pemain yang baru melintasinya.
   * Menandai checkpoint sebagai visited agar tidak terulang untuk pemain itu.
   */
  const triggerCheckpointChallenge = async (playerIndex, checkpointCell) => {
    if (players.value[playerIndex]?.finished) return false
    const playerId = players.value[playerIndex].id
    if (hasVisitedCheckpoint(playerId, checkpointCell)) return false

    landedPlayerId.value = playerId
    challengeType.value = 'forced'
    activeChallengeSource.value = 'checkpoint'
    selectedAnswererId.value = landedPlayerId.value
    activeChallengeCell.value = checkpointCell
    ensureCellHasQuestion(checkpointCell)
    const entry = cellQuestions.value[checkpointCell]
    if (entry && entry.q) {
      challengeQuestion.value = entry.q
      challengeDisabledOptions.value = [...(entry.wrongOptions || [])]
    } else {
      challengeQuestion.value = {
        id: 0,
        question: 'Pertanyaan tidak tersedia. Coba lagi.',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctIndex: 0,
      }
      challengeDisabledOptions.value = []
    }
    // tandai checkpoint telah dilewati untuk pemain ini
    markVisitedCheckpoint(playerId, checkpointCell)
    showChallengeModal.value = true
    return true
  }

  /** Menutup modal tantangan dan meneruskan giliran ke pemain berikutnya. */
  const closeChallenge = () => {
    showChallengeModal.value = false
    // Jika tantangan ditutup (mis. memilih tidak membuka pada sel '!'), ganti giliran
    if (landedPlayerId.value != null) {
      selectedPlayerId.value = getNextActivePlayerId(landedPlayerId.value)
    }
    // Bersihkan state aktif tantangan
    clearChallengeContext()
  }

  /** Dipanggil saat penjawab diputuskan (optional/forced). Menandai soal sebagai asked. */
  const onChallengeDecide = (answererId) => {
    selectedAnswererId.value = answererId
    // Tandai pertanyaan pada sel aktif sebagai sudah pernah ditanyakan saat penjawab diputuskan
    if (activeChallengeCell.value != null) {
      markQuestionAskedForCell(activeChallengeCell.value)
    }
  }

  // Update state per hasil jawaban (mark wrong options, or reassign question on correct)
  /**
   * Penilaian hasil jawaban: menandai opsi salah untuk sel (disable di kesempatan berikutnya),
   * melakukan rotasi soal setelah 2x salah pada sel itu, dan ganti soal saat benar.
   */
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

  /** Membersihkan seluruh context/jejak state tantangan yang sedang aktif. */
  const clearChallengeContext = () => {
    landedPlayerId.value = null
    selectedAnswererId.value = null
    activeChallengeCell.value = null
    activeChallengeSource.value = null
    challengeDisabledOptions.value = []
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

    // getters
    selectedPlayerName,
    maxCell,

    // actions
    init,
    generateMarkers,
    generateCheckpoints,
    selectPlayer,
    incrementSteps,
    decrementSteps,
    setSteps,
    resetGame,
    confirmReset,
    startGameSetNames,
    getNextActivePlayerId,
    maybeTriggerChallenge,
    getCrossedCheckpointCell,
    triggerCheckpointChallenge,
    markVisitedCheckpoint,
    closeChallenge,
    onChallengeDecide,
    onJudgeResult,
  }
})
