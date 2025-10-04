import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useQuestionDeck } from '@/composables/useQuestionDeck'

/**
 * Store Pinia untuk game Ular Tangga (Snakes & Ladders) dengan sistem tantangan.
 * Berisi:
 * - State pemain, papan, marker tantangan ("?" opsional, "!" wajib), dan checkpoint per baris.
 * - Integrasi deck pertanyaan pilihan ganda.
 * - Logika pemetaan pertanyaan permanen per sel, tracking opsi salah, dan rotasi soal.
 * - Mekanisme checkpoint satu-kali per pemain saat melintasi awal baris.
 * - State persistence menggunakan localStorage.
 */

const STORAGE_KEY = 'snakesLadders_gameState'

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
   * dengan GARANSI:
   * 1. Minimal 2 marker per baris (1 optional + 1 forced minimum)
   * 2. Distribusi merata antara "?" dan "!" per baris
   */
  const generateMarkers = () => {
    const size = boardSize.value
    const total = size * size
    const skip = new Set([1, total, ...(checkpointCells.value || [])]) // Skip start, finish, checkpoint
    const map = {}
    
    // STEP 1: GARANSI - Setiap baris mendapat minimal 1 optional "?" dan 1 forced "!"
    for (let row = 0; row < size; row++) {
      const rowStart = row * size + 1
      const rowEnd = rowStart + size - 1
      
      // Collect eligible cells di baris ini
      const rowEligible = []
      for (let cell = rowStart; cell <= rowEnd; cell++) {
        if (!skip.has(cell)) rowEligible.push(cell)
      }
      
      if (rowEligible.length >= 2) {
        // Shuffle dan ambil 2 sel pertama: 1 untuk optional, 1 untuk forced
        const shuffledRow = shuffle(rowEligible)
        map[shuffledRow[0]] = 'optional'
        map[shuffledRow[1]] = 'forced'
        console.log(`[SnakesLadders] Row ${row + 1} guaranteed markers: cell ${shuffledRow[0]} (?) and ${shuffledRow[1]} (!)`)
      } else if (rowEligible.length === 1) {
        // Jika hanya 1 sel eligible, tetap beri marker (alternatif antara ? dan !)
        const type = row % 2 === 0 ? 'optional' : 'forced'
        map[rowEligible[0]] = type
        console.log(`[SnakesLadders] Row ${row + 1} only 1 eligible cell: ${rowEligible[0]} (${type === 'optional' ? '?' : '!'})`)
      }
    }
    
    // STEP 2: TAMBAHAN - Tambahkan marker random ke sel yang belum diisi (~1/4 dari sel eligible yang tersisa)
    const usedCells = new Set(Object.keys(map).map(k => parseInt(k, 10)))
    const remainingEligible = []
    for (let n = 2; n <= total - 1; n++) {
      if (!skip.has(n) && !usedCells.has(n)) {
        remainingEligible.push(n)
      }
    }
    
    const additionalCount = Math.floor(remainingEligible.length / 4)
    const additionalChosen = shuffle(remainingEligible).slice(0, additionalCount)
    
    // Bagi tambahan marker secara merata antara optional dan forced
    additionalChosen.forEach((cell, idx) => {
      map[cell] = idx % 2 === 0 ? 'optional' : 'forced'
    })
    
    // Hitung statistik
    const optionalCount = Object.values(map).filter(t => t === 'optional').length
    const forcedCount = Object.values(map).filter(t => t === 'forced').length
    const totalMarkers = Object.keys(map).length
    
    console.log('[SnakesLadders] Markers generated:', {
      guaranteedPerRow: 2,
      additional: additionalChosen.length,
      total: totalMarkers,
      optional: optionalCount,
      forced: forcedCount,
      ratio: `${optionalCount}:${forcedCount}`,
    })
    
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
   * Auto-detect: Skip generate jika sudah ada data dari localStorage.
   */
  const init = async () => {
    // Set default selected player & prepare deck/markers
    if (!selectedPlayerId.value) {
      selectedPlayerId.value = players.value[0]?.id ?? null
    }
    
    // Auto-detect: Jika markers dan cellQuestions sudah ada (dari restore), skip generate
    const hasRestoredData = 
      Object.keys(markers.value).length > 0 && 
      checkpointCells.value.length > 0 &&
      Object.keys(cellQuestions.value).length > 0
    
    if (!hasRestoredData) {
      // Generate baru jika belum ada data
      generateCheckpoints()
      generateMarkers()
    }
    
    await deck.load()
    
    // Assign questions hanya jika belum ada mapping yang valid
    if (!hasRestoredData) {
      assignQuestionsToAllMarkers()
    }
    
    // init visited jika belum ada
    if (!visitedCheckpoints.value || Object.keys(visitedCheckpoints.value).length === 0) {
      visitedCheckpoints.value = {}
    }
    
    console.log('[SnakesLadders] init() completed, hasRestoredData:', hasRestoredData)
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
   * MEMASTIKAN TIDAK ADA PERTANYAAN YANG DUPLIKAT dalam 1 board.
   * Setiap sel mendapat pertanyaan yang unik (berbeda baris dari file).
   */
  const assignQuestionsToAllMarkers = () => {
    const challengeCells = getAllChallengeCells()
    if (challengeCells.length === 0) return
    if (!deck.deck || !Array.isArray(deck.deck.value)) return
    
    // Shuffle deck untuk random distribution
    const shuffledDeck = shuffle([...deck.deck.value])
    const challengeSet = new Set(challengeCells)

    // Bersihkan entry yang tidak lagi termasuk sel tantangan
    for (const key of Object.keys(cellQuestions.value)) {
      const numericKey = parseInt(key, 10)
      if (!challengeSet.has(numericKey)) delete cellQuestions.value[key]
    }

    // Track pertanyaan yang sudah digunakan (termasuk yang sudah ada)
    const usedQuestionIds = new Set()
    
    // Collect question IDs yang sudah di-assign sebelumnya (dari restore)
    for (const cell of challengeCells) {
      if (cellQuestions.value[cell] && cellQuestions.value[cell].q) {
        usedQuestionIds.add(cellQuestions.value[cell].q.id)
      }
    }

    // Assign pertanyaan ke sel yang belum punya pertanyaan
    let questionIndex = 0
    for (const cell of challengeCells) {
      // Skip jika sel sudah punya pertanyaan (dari restore)
      if (cellQuestions.value[cell] && cellQuestions.value[cell].q) {
        continue
      }
      
      // Cari pertanyaan yang belum digunakan
      let chosen = null
      for (let i = questionIndex; i < shuffledDeck.length; i++) {
        const q = shuffledDeck[i]
        if (!usedQuestionIds.has(q.id)) {
          chosen = q
          questionIndex = i + 1
          break
        }
      }
      
      // Jika tidak ada pertanyaan unique tersisa, wrap around dan cari lagi
      if (!chosen) {
        for (let i = 0; i < questionIndex; i++) {
          const q = shuffledDeck[i]
          if (!usedQuestionIds.has(q.id)) {
            chosen = q
            break
          }
        }
      }
      
      // Fallback: jika masih null (jumlah sel > jumlah pertanyaan), gunakan pertanyaan pertama yang available
      if (!chosen && shuffledDeck.length > 0) {
        chosen = shuffledDeck[questionIndex % shuffledDeck.length]
        console.warn('[SnakesLadders] Not enough unique questions! Reusing question ID:', chosen.id)
      }
      
      if (chosen) {
        cellQuestions.value[cell] = {
          q: chosen,
          wrongOptions: [],
          wrongAttempts: 0,
          asked: false,
        }
        usedQuestionIds.add(chosen.id)
      }
    }
    
    console.log('[SnakesLadders] Questions assigned:', {
      totalCells: challengeCells.length,
      uniqueQuestions: usedQuestionIds.size,
      availableQuestions: shuffledDeck.length,
    })
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
   * Mengganti pertanyaan untuk sebuah sel dengan prioritas:
   * 1. Belum ditanyakan secara global (usedQuestionIds)
   * 2. Tidak sedang digunakan di sel lain dalam board yang sama (unique per board)
   * 3. Bukan pertanyaan saat ini di sel ini
   */
  const reassignCellQuestion = (cell) => {
    if (!deck.deck || !Array.isArray(deck.deck.value)) return
    const all = shuffle([...deck.deck.value])
    const globalUsed = getUsedSet()
    const currentId = cellQuestions.value[cell]?.q?.id
    
    // Collect IDs pertanyaan yang sedang digunakan di sel lain dalam board ini
    const usedInBoard = new Set()
    for (const [cellNum, entry] of Object.entries(cellQuestions.value)) {
      if (parseInt(cellNum, 10) !== cell && entry && entry.q) {
        usedInBoard.add(entry.q.id)
      }
    }
    
    // Priority 1: Belum ditanyakan global DAN tidak ada di board
    let chosen = all.find((q) => !globalUsed.has(q.id) && !usedInBoard.has(q.id))
    
    // Priority 2: Tidak ada di board (boleh yang sudah ditanyakan global)
    if (!chosen) {
      chosen = all.find((q) => !usedInBoard.has(q.id) && q.id !== currentId)
    }
    
    // Priority 3: Beda dari pertanyaan saat ini (allow duplicate di board jika terpaksa)
    if (!chosen) {
      chosen = all.find((q) => q.id !== currentId)
    }
    
    // Fallback: gunakan pertanyaan pertama
    if (!chosen) {
      chosen = all[0]
      console.warn('[SnakesLadders] No unique question available for cell', cell, '- reusing question')
    }
    
    cellQuestions.value[cell] = {
      q: chosen,
      wrongOptions: [],
      wrongAttempts: 0,
      asked: false,
    }
    
    console.log('[SnakesLadders] Cell', cell, 'reassigned to question ID:', chosen.id)
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
  const confirmReset = async () => {
    players.value.forEach((player) => {
      player.position = 1
      player.finished = false
      player.rank = null
      player.shield = 0
      player.name = player.id === 1 ? 'Kelompok 1' : player.id === 2 ? 'Kelompok 2' : 'Kelompok 3'
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
    
    // Generate posisi marker dan checkpoint baru (random)
    generateCheckpoints()
    generateMarkers()
    
    // Reset mapping & usage tracking
    cellQuestions.value = {}
    usedQuestionIds.value = []
    activeChallengeCell.value = null
    activeChallengeSource.value = null
    challengeDisabledOptions.value = []
    visitedCheckpoints.value = {}
    
    // PENTING: Reload deck pertanyaan dari file untuk ambil pertanyaan terbaru
    await deck.load()
    console.log('[SnakesLadders] Deck reloaded:', deck.deck.value?.length, 'questions')
    
    // Assign pertanyaan baru ke semua markers (random assignment)
    assignQuestionsToAllMarkers()
    
    // Clear localStorage saat reset
    clearStorage()
    
    console.log('[SnakesLadders] Game reset complete - new markers, checkpoints, and questions assigned')
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
   * Penilaian hasil jawaban:
   * - CHECKPOINT: Langsung ganti soal jika salah (tidak perlu 2x)
   * - MARKER (? atau !): Ganti soal setelah 2x salah
   * - Semua: Ganti soal saat benar
   */
  const onJudgeResult = ({ isCorrect, selectedIndex = null }) => {
    const cell = activeChallengeCell.value
    if (!cell) return
    const entry = cellQuestions.value[cell]
    if (!entry) return
    const source = activeChallengeSource.value
    
    if (!isCorrect && selectedIndex != null) {
      // Tandai opsi salah untuk disable di kesempatan berikutnya
      if (!entry.wrongOptions.includes(selectedIndex)) entry.wrongOptions.push(selectedIndex)
      
      // CHECKPOINT: Langsung ganti soal saat salah
      if (source === 'checkpoint') {
        console.log('[SnakesLadders] Checkpoint wrong answer - immediately reassigning question for cell', cell)
        reassignCellQuestion(cell)
      } else {
        // MARKER: Hitung percobaan salah, ganti setelah 2x salah
        entry.wrongAttempts = (entry.wrongAttempts || 0) + 1
        if (entry.wrongAttempts >= 2) {
          console.log('[SnakesLadders] Marker 2x wrong - reassigning question for cell', cell)
          reassignCellQuestion(cell)
        }
      }
    }
    
    if (isCorrect) {
      // Ganti pertanyaan untuk sel ini dengan yang belum pernah ditanyakan
      console.log('[SnakesLadders] Correct answer - reassigning question for cell', cell)
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

  // Load state dari localStorage saat store diinisialisasi
  const loadState = async () => {
    const saved = loadFromStorage()
    if (saved) {
      // Restore core game state
      if (saved.players) players.value = saved.players
      if (saved.selectedPlayerId !== undefined) selectedPlayerId.value = saved.selectedPlayerId
      if (saved.steps) steps.value = saved.steps
      if (saved.boardSize) boardSize.value = saved.boardSize
      if (saved.showNameInput !== undefined) showNameInput.value = saved.showNameInput
      if (saved.nextRank) nextRank.value = saved.nextRank
      if (saved.showFinalModal !== undefined) showFinalModal.value = saved.showFinalModal
      
      // IMPORTANT: Restore markers dan checkpoints SEBELUM load deck
      if (saved.markers) markers.value = saved.markers
      if (saved.checkpointCells) checkpointCells.value = saved.checkpointCells
      if (saved.cellQuestions) cellQuestions.value = saved.cellQuestions
      if (saved.usedQuestionIds) usedQuestionIds.value = saved.usedQuestionIds
      if (saved.visitedCheckpoints) visitedCheckpoints.value = saved.visitedCheckpoints
      
      // Load deck jika game sudah dimulai (showNameInput = false)
      if (saved.showNameInput === false) {
        await deck.load()
      }
      
      console.log('[SnakesLadders] State loaded from localStorage:', {
        markers: Object.keys(markers.value).length,
        checkpoints: checkpointCells.value.length,
        cellQuestions: Object.keys(cellQuestions.value).length,
      })
      
      return true // Indicate that state was loaded
    }
    return false // No saved state
  }

  // Auto-save state ke localStorage setiap ada perubahan penting
  const setupAutoSave = () => {
    // Watch semua state penting dan save ke localStorage
    watch(
      [
        players,
        selectedPlayerId,
        steps,
        boardSize,
        showNameInput,
        nextRank,
        showFinalModal,
        markers,
        checkpointCells,
        cellQuestions,
        usedQuestionIds,
        visitedCheckpoints,
      ],
      () => {
        const stateToSave = {
          players: players.value,
          selectedPlayerId: selectedPlayerId.value,
          steps: steps.value,
          boardSize: boardSize.value,
          showNameInput: showNameInput.value,
          nextRank: nextRank.value,
          showFinalModal: showFinalModal.value,
          markers: markers.value,
          checkpointCells: checkpointCells.value,
          cellQuestions: cellQuestions.value,
          usedQuestionIds: usedQuestionIds.value,
          visitedCheckpoints: visitedCheckpoints.value,
        }
        saveToStorage(stateToSave)
      },
      { deep: true }
    )
  }

  // Load state saat store pertama kali dibuat
  loadState()
  // Setup auto-save
  setupAutoSave()

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
