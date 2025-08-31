<script setup>
// Import fungsi Vue dan komponen yang diperlukan
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

// === VARIABEL REAKTIF UNTUK MENGELOLA STATE GAME ===

// Array berisi semua kartu dalam permainan (14 kartu total: 7 pasang)
const cards = ref([])

// Array berisi indeks kartu yang sudah dibuka (tetap terbuka)
const openedCards = ref([])

// Jumlah pasangan kartu yang sudah berhasil dicocokkan (target: 7 pasang)
const matchedPairs = ref(0)

// Status apakah permainan sudah dimulai atau belum
const gameStarted = ref(false)

// Status apakah nama pemain sudah diatur
const namesSet = ref(false)

// Status apakah permainan sudah selesai (semua pasang ditemukan)
const gameCompleted = ref(false)

// Skor pemain (bertambah +10 per pasang yang cocok, bonus berdasarkan efisiensi)
const score = ref(0)

// Jumlah percobaan yang telah dilakukan pemain
const attempts = ref(0)

// Waktu yang telah berlalu dalam detik sejak game dimulai
const timer = ref(0)

// Reference untuk interval timer (digunakan untuk menghentikan timer)
const timerInterval = ref(null)

// Flag untuk menonaktifkan klik kartu sementara (saat mengecek kecocokan)
const isCardDisabled = ref(false)

// === VARIABEL UNTUK QUESTION MODAL ===

// Status apakah modal pertanyaan sedang ditampilkan
const showQuestionModal = ref(false)

// Data pertanyaan yang sedang ditampilkan
const currentQuestion = ref(null)

// Posisi kartu yang sedang akan dibuka (menunggu jawaban benar)
const pendingCardIndex = ref(null)

// Composable untuk mengelola pertanyaan
const { questions, loadQuestions, getQuestionById } = useQuestions()

// === VARIABEL MULTIPLAYER ===

// Pemain yang sedang bermain (1 atau 2)
const currentPlayer = ref(1)

// Skor untuk Player 1
const player1Score = ref(0)

// Skor untuk Player 2
const player2Score = ref(0)

// Jumlah percobaan Player 1
const player1Attempts = ref(0)

// Jumlah percobaan Player 2
const player2Attempts = ref(0)

// Nama pemain (bisa dikustomisasi)
const player1Name = ref('Player 1')
const player2Name = ref('Player 2')

// Status pemenang (null jika belum ada pemenang)
const winner = ref(null)

// === VARIABEL UNTUK ATURAN TURN BARU ===

// Jumlah kesempatan yang tersisa untuk pemain saat ini (maksimal 2)
const currentTurnAttempts = ref(0)

// Status apakah sedang menunggu pilihan setelah jawaban benar pertama
const showContinueChoice = ref(false)

// Flag untuk menandai apakah ini adalah attempt pertama dalam turn
const isFirstAttemptInTurn = ref(true)

// === FUNGSI-FUNGSI UTAMA UNTUK MENGELOLA PERMAINAN ===

/**
 * Fungsi untuk menginisialisasi/mempersiapkan permainan baru
 * Membuat 14 kartu (7 pasang angka 1-7) dan mengacak posisinya
 * Mereset semua variabel game ke kondisi awal
 */
const initializeGame = () => {
  // Buat array berisi 7 pasang angka (1-7)
  const numbers = []
  for (let i = 1; i <= 7; i++) {
    numbers.push(i, i) // Tambahkan setiap angka dua kali untuk membuat pasangan
  }

  // Acak urutan kartu menggunakan algoritma Fisher-Yates
  shuffleArray(numbers)

  // Buat objek kartu dengan properti yang diperlukan
  cards.value = numbers.map((number) => ({
    number, // Angka yang ditampilkan di kartu
    isFlipped: false, // Status apakah kartu sedang terbuka
    isMatched: false, // Status apakah kartu sudah dicocokkan
  }))

  // Reset variabel game utama
  openedCards.value = [] // Kosongkan array kartu terbuka yang sedang dibuka
  matchedPairs.value = 0 // Reset jumlah pasangan yang ditemukan
  score.value = 0 // Reset skor ke 0
  attempts.value = 0 // Reset jumlah percobaan
  timer.value = 0 // Reset timer ke 0
  gameCompleted.value = false // Set status game belum selesai
  isCardDisabled.value = false // Aktifkan kembali klik kartu

  // Reset variabel multiplayer
  currentPlayer.value = 1 // Mulai dari Player 1
  player1Score.value = 0 // Reset skor Player 1
  player2Score.value = 0 // Reset skor Player 2
  player1Attempts.value = 0 // Reset percobaan Player 1
  player2Attempts.value = 0 // Reset percobaan Player 2
  winner.value = null // Reset pemenang

  // Reset variabel turn baru
  currentTurnAttempts.value = 0
  showContinueChoice.value = false
  isFirstAttemptInTurn.value = true
}

/**
 * Fungsi untuk mengecek apakah kartu baru cocok dengan kartu yang sudah terbuka
 * @param {number} newCardIndex - Indeks kartu yang baru dibuka
 * @returns {number|null} - Indeks kartu yang cocok atau null jika tidak ada
 */
const findMatchingCard = (newCardIndex) => {
  const newCardNumber = cards.value[newCardIndex].number

  return openedCards.value.find((openIndex) => {
    const openCard = cards.value[openIndex]
    return openCard.number === newCardNumber && !openCard.isMatched
  })
}

/**
 * Fungsi untuk mengacak urutan elemen dalam array
 * Menggunakan algoritma Fisher-Yates untuk pengacakan yang merata
 * @param {Array} array - Array yang akan diacak urutannya
 */
const shuffleArray = (array) => {
  // Loop dari elemen terakhir ke elemen kedua
  for (let i = array.length - 1; i > 0; i--) {
    // Pilih indeks acak dari 0 sampai i
    const j = Math.floor(Math.random() * (i + 1))
    // Tukar posisi elemen i dengan elemen j
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Fungsi untuk memulai permainan baru
 * Jika game sudah selesai, akan mereset terlebih dahulu
 * Kemudian menginisialisasi game dan memulai timer
 */
const startGame = () => {
  // Jika game sudah selesai, reset dulu sebelum mulai lagi
  if (gameCompleted.value) {
    resetGame()
  }

  // Siapkan kartu dan reset variabel game
  initializeGame()

  // Tandai bahwa game sudah dimulai
  gameStarted.value = true

  // Mulai menghitung waktu
  startTimer()
}

/**
 * Fungsi untuk mereset permainan ke kondisi awal
 * Menghentikan timer dan menginisialisasi ulang semua variabel
 */
const resetGame = () => {
  gameStarted.value = false // Tandai game belum dimulai
  gameCompleted.value = false // Tandai game belum selesai
  stopTimer() // Hentikan timer
  initializeGame() // Reset semua variabel ke kondisi awal
}

/**
 * Fungsi untuk mereset ke input nama pemain
 */
const resetToNameInput = () => {
  resetGame()
  namesSet.value = false
}

/**
 * Fungsi untuk menangani input nama pemain
 */
const handlePlayerNames = (playerData) => {
  player1Name.value = playerData.player1Name
  player2Name.value = playerData.player2Name
  namesSet.value = true
}

/**
 * Fungsi untuk menangani reset dari modal
 */
const handleResetFromModal = () => {
  resetGame()
}

/**
 * Fungsi untuk memulai timer/stopwatch
 * Timer akan bertambah 1 setiap detik
 */
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    timer.value++ // Tambah 1 detik setiap interval
  }, 1000) // Interval 1000ms = 1 detik
}

/**
 * Fungsi untuk menghentikan timer
 * Membersihkan interval dan mereset reference
 */
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value) // Hentikan interval
    timerInterval.value = null // Reset reference
  }
}

/**
 * Fungsi untuk memformat waktu dari detik ke format MM:SS
 * @param {number} seconds - Waktu dalam detik
 * @returns {string} Waktu dalam format "MM:SS"
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60) // Hitung menit
  const secs = seconds % 60 // Hitung sisa detik

  // Format dengan padding 0 di depan jika perlu (contoh: 01:05)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Fungsi yang dipanggil ketika pemain mengklik sebuah kartu
 * Menampilkan modal pertanyaan sebelum membuka kartu
 * @param {number} cardIndex - Indeks kartu yang diklik (0-13)
 */
const handleCardClick = (cardIndex) => {
  // Validasi: cek apakah kartu bisa diklik
  if (
    isCardDisabled.value || // Kartu sedang dinonaktifkan (saat mengecek match)
    cards.value[cardIndex].isFlipped || // Kartu sudah terbuka
    cards.value[cardIndex].isMatched || // Kartu sudah dicocokkan
    showQuestionModal.value || // Modal pertanyaan sedang ditampilkan
    showContinueChoice.value || // Sedang menunggu pilihan continue
    currentTurnAttempts.value >= 2 // Sudah menggunakan 2 kesempatan
  ) {
    return // Keluar dari fungsi jika tidak valid
  }

  // Increment attempt counter
  currentTurnAttempts.value++

  // Simpan indeks kartu yang akan dibuka
  pendingCardIndex.value = cardIndex

  // Ambil pertanyaan berdasarkan nomor kartu (1-14)
  const cardPosition = cardIndex + 1
  currentQuestion.value = getQuestionById(cardPosition)

  // Tampilkan modal pertanyaan
  showQuestionModal.value = true

  console.log(`🎯 Player ${currentPlayer.value} attempt ${currentTurnAttempts.value}/2`)
}

/**
 * Fungsi yang dipanggil ketika jawaban benar dari game master
 * Membuka kartu dan cek apakah cocok dengan kartu yang sudah terbuka
 * @param {number} cardPosition - Posisi kartu (1-14)
 */
const handleCorrectAnswer = (cardPosition) => {
  const cardIndex = pendingCardIndex.value
  const currentPlayerBeforeMatch = currentPlayer.value

  // Tambah percobaan untuk pemain yang menjawab benar
  attempts.value++
  if (currentPlayerBeforeMatch === 1) {
    player1Attempts.value++
  } else {
    player2Attempts.value++
  }

  // Tutup modal
  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null

  // Buka kartu yang diklik
  cards.value[cardIndex].isFlipped = true

  console.log('🎯 Card opened:', cardIndex + 1, 'Number:', cards.value[cardIndex].number)
  console.log(
    '🗃️ Previously opened cards:',
    openedCards.value.map((idx) => ({ pos: idx + 1, num: cards.value[idx].number })),
  )

  // Cek apakah kartu ini cocok dengan kartu yang sudah terbuka sebelumnya
  const matchingCardIndex = openedCards.value.find(
    (openIndex) =>
      cards.value[openIndex].number === cards.value[cardIndex].number &&
      !cards.value[openIndex].isMatched,
  )

  // Tambahkan kartu baru ke opened cards terlebih dahulu
  openedCards.value.push(cardIndex)

  if (matchingCardIndex !== undefined) {
    console.log('✅ MATCH FOUND! Card', cardIndex + 1, 'matches with card', matchingCardIndex + 1)

    // COCOK! Tandai kedua kartu sebagai matched
    cards.value[cardIndex].isMatched = true
    cards.value[matchingCardIndex].isMatched = true

    // Update statistik game
    matchedPairs.value++
    score.value += 1

    // Berikan poin ke pemain yang menemukan pasangan
    if (currentPlayerBeforeMatch === 1) {
      player1Score.value += 1
      console.log('👤 Player 1 score increased to:', player1Score.value)
    } else {
      player2Score.value += 1
      console.log('👤 Player 2 score increased to:', player2Score.value)
    }

    console.log('📊 Updated scores:', { p1: player1Score.value, p2: player2Score.value })

    // Cek apakah semua pasangan sudah ditemukan (7 pasang)
    if (matchedPairs.value === 7) {
      gameCompleted.value = true
      stopTimer()
      resetTurnState()

      // Tentukan pemenang berdasarkan skor
      if (player1Score.value > player2Score.value) {
        winner.value = 1
      } else if (player2Score.value > player1Score.value) {
        winner.value = 2
      } else {
        winner.value = 'tie'
      }
      console.log('🏁 Game completed!')
      return
    }

    // Cek apakah sudah menggunakan 2 kesempatan
    if (currentTurnAttempts.value >= 2) {
      console.log('🎯 Match found but 2 attempts used, switching player')
      switchPlayer()
    } else {
      // Masih ada kesempatan, berikan pilihan setelah delay
      console.log('🤔 Match found, showing choice after delay...')
      setTimeout(() => {
        showContinueChoice.value = true
        isFirstAttemptInTurn.value = false
      }, 1000)
    }
  } else {
    console.log('🔍 No match found')

    // Cek apakah sudah menggunakan 2 kesempatan
    if (currentTurnAttempts.value >= 2) {
      console.log('🔄 Second attempt used, switching player')
      switchPlayer()
    } else {
      // Masih ada kesempatan, berikan pilihan setelah delay
      console.log('🤔 First attempt successful, showing choice after delay...')
      setTimeout(() => {
        showContinueChoice.value = true
        isFirstAttemptInTurn.value = false
      }, 1000)
    }
  }
}

/**
 * Fungsi yang dipanggil ketika jawaban salah dari game master
 * Berganti pemain dan tutup modal
 */
const handleWrongAnswer = () => {
  // Tutup modal
  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null

  // Kurangi attempt counter karena gagal
  currentTurnAttempts.value--

  // Jika ini attempt pertama dan salah, langsung switch player
  if (isFirstAttemptInTurn.value) {
    console.log('❌ First attempt failed, switching player immediately')
    switchPlayer()
  } else {
    // Ini attempt kedua dan salah, juga switch player
    console.log('❌ Second attempt failed, switching player')
    switchPlayer()
  }
}

/**
 * Fungsi yang dipanggil ketika modal ditutup tanpa jawaban
 */
const handleCloseModal = () => {
  showQuestionModal.value = false
  currentQuestion.value = null
  pendingCardIndex.value = null

  // Kurangi attempt counter karena modal ditutup
  currentTurnAttempts.value--
}

/**
 * Fungsi untuk mereset state turn ke kondisi awal
 */
const resetTurnState = () => {
  currentTurnAttempts.value = 0
  showContinueChoice.value = false
  isFirstAttemptInTurn.value = true
  console.log('🔄 Turn state reset')
}

/**
 * Fungsi untuk beralih ke pemain berikutnya
 */
const switchPlayer = () => {
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
  resetTurnState()
  console.log(`🔄 Switched to Player ${currentPlayer.value}`)
}

/**
 * Fungsi yang dipanggil ketika pemain memilih untuk melanjutkan turn
 */
const handleContinueTurn = () => {
  showContinueChoice.value = false
  console.log('✅ Player chose to continue turn')
}

/**
 * Fungsi yang dipanggil ketika pemain memilih untuk mengakhiri turn
 */
const handleEndTurn = () => {
  showContinueChoice.value = false
  switchPlayer()
  console.log('🏁 Player chose to end turn')
}

// === LIFECYCLE HOOKS ===

// === LIFECYCLE HOOKS ===

/**
 * Hook yang dipanggil setelah komponen di-mount
 * Memuat pertanyaan dari file
 */
onMounted(() => {
  loadQuestions()
})

/**
 * Hook yang dipanggil sebelum komponen di-unmount/dihancurkan
 * Membersihkan timer untuk mencegah memory leak
 */
onBeforeUnmount(() => {
  stopTimer() // Hentikan timer sebelum komponen dihancurkan
})
</script>

<template>
  <!-- === LOGO === -->
  <!-- Logo RAC di pojok kiri atas dengan posisi fixed (tetap saat scroll) -->
  <div class="fixed -top-9 left-12 z-50">
    <img
      src="/src/assets/images/rac-logo.png"
      alt="RAC Logo"
      class="w-90 sm:h-72 object-contain logo-pulse"
    />
    <!-- 
      Kelas CSS:
      - fixed: Posisi tetap di layar
      - -top-9 left-12: Posisi di pojok kiri atas
      - z-50: Layer tinggi agar selalu di atas
      - w-90 sm:h-72: Ukuran responsif (besar di mobile, lebih besar di desktop)
      - object-contain: Menjaga proporsi gambar
      - logo-pulse: Animasi zoom in-out
    -->
  </div>

  <!-- === MENU KONTROL POJOK KANAN ATAS === -->
  <div class="fixed top-4 right-4 z-40">
    <GameControls
      :gameStarted="gameStarted"
      :gameCompleted="gameCompleted"
      @start-game="startGame"
      @reset-game="resetToNameInput"
    />
  </div>

  <!-- === CONTAINER UTAMA GAME === -->
  <!-- Container responsif dengan padding dan alignment tengah -->
  <div class="max-w-6xl mx-auto p-2 sm:p-4 text-center">
    <!-- === HEADER GAME === -->
    <!-- Bagian judul dan statistik game -->
    <div class="mb-4 sm:mb-6">
      <!-- Judul Game -->
      <h1
        class="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg mt-2 sm:mt-3"
      >
        Stage 2 Final
      </h1>

      <!-- === PANEL STATISTIK GLOBAL === -->
      <GameStats :timer="timer" :formatTime="formatTime" />
    </div>

    <!-- === LAYOUT GAME DENGAN PANEL PEMAIN === -->
    <!-- Layout dengan panel pemain di kiri dan kanan game board -->
    <div
      v-if="gameStarted"
      class="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 lg:gap-6 xl:gap-8"
    >
      <!-- Panel Player 1 - Kiri (Desktop) / Atas (Mobile) -->
      <div class="order-1 lg:order-1">
        <PlayerPanel
          :playerName="player1Name"
          :score="player1Score"
          :attempts="player1Attempts"
          :isActive="currentPlayer === 1"
          :currentTurnAttempts="currentPlayer === 1 ? currentTurnAttempts : 0"
        />
      </div>

      <!-- Grid Kartu Permainan - Tengah -->
      <div class="order-3 lg:order-2">
        <div
          class="grid grid-cols-4 gap-4 sm:gap-6 max-w-lg sm:max-w-2xl lg:max-w-3xl p-6 sm:p-8 game-grid rounded-xl shadow-xl"
        >
          <!-- 
            Loop untuk menampilkan setiap kartu
            Setiap kartu menerima props:
            - number: Angka yang ditampilkan
            - position: Posisi kartu (1-14)
            - isFlipped: Status terbuka/tertutup
            - isMatched: Status sudah dicocokkan
            - isDisabled: Status nonaktif
            Event: @card-click untuk menangani klik kartu
          -->
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

      <!-- Panel Player 2 - Kanan (Desktop) / Bawah (Mobile) -->
      <div class="order-2 lg:order-3">
        <PlayerPanel
          :playerName="player2Name"
          :score="player2Score"
          :attempts="player2Attempts"
          :isActive="currentPlayer === 2"
          :currentTurnAttempts="currentPlayer === 2 ? currentTurnAttempts : 0"
        />
      </div>
    </div>

    <!-- === PESAN GAME SELESAI === -->
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

    <!-- === INPUT NAMA PEMAIN === -->
    <PlayerNameInput v-if="!namesSet" @start-game="handlePlayerNames" />

    <!-- === INSTRUKSI PERMAINAN === -->
    <GameInstructions v-if="namesSet && !gameStarted" />

    <!-- === MODAL PERTANYAAN === -->
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

    <!-- === MODAL PILIHAN LANJUT TURN === -->
    <TurnChoiceModal
      v-if="showContinueChoice"
      :playerName="currentPlayer === 1 ? player1Name : player2Name"
      :currentTurnAttempts="currentTurnAttempts"
      @continue-turn="handleContinueTurn"
      @end-turn="handleEndTurn"
    />
  </div>
</template>

<style scoped>
/* === STYLING CSS UNTUK KOMPONEN GAMEBOARD === */
/* 
 * Styling untuk grid kartu permainan
 * Memberikan efek visual yang menarik dengan gradient dan shadow
 */
.game-grid {
  /* Gradient background dari putih ke hijau muda */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 255, 240, 0.85) 100%);

  /* Border hijau transparan */
  border: 2px solid rgba(76, 175, 80, 0.3);

  /* Efek blur pada background untuk glass morphism */
  backdrop-filter: blur(10px);

  /* Multiple shadow untuk depth dan dimensi */
  box-shadow:
    0 6px 24px rgba(76, 175, 80, 0.12),
    /* Shadow utama hijau */ 0 3px 12px rgba(0, 0, 0, 0.08),
    /* Shadow hitam untuk depth */ inset 0 1px 0 rgba(255, 255, 255, 0.2); /* Inner shadow untuk highlight */
}

/* === RESPONSIVE DESIGN - MEDIA QUERIES === */

/* 
 * Mobile devices (max-width: 480px)
 * Optimasi untuk layar kecil dengan spacing yang lebih rapat
 */
@media (max-width: 480px) {
  .game-grid {
    padding: 1rem; /* Padding 16px untuk mobile */
    border-width: 1px; /* Border lebih tipis untuk mobile */
    gap: 0.5rem; /* Gap 8px antar kartu */
    max-width: 380px; /* Lebar maksimal grid untuk mobile */

    /* Shadow yang lebih ringan untuk mobile */
    box-shadow:
      0 3px 12px rgba(76, 175, 80, 0.1),
      0 1px 6px rgba(0, 0, 0, 0.06);
  }

  /* Container utama dengan padding yang sesuai */
  .max-w-4xl {
    padding: 1rem;
  }

  /* Margin vertikal yang proporsional untuk mobile */
  .mb-4 {
    margin-bottom: 1rem;
  }

  .mt-4 {
    margin-top: 1rem;
  }
}

/* 
 * Tablet devices (481px - 768px)
 * Ukuran menengah dengan spacing yang seimbang
 */
@media (min-width: 481px) and (max-width: 768px) {
  .game-grid {
    max-width: 450px; /* Lebar maksimal untuk tablet */
    gap: 0.75rem; /* Gap 12px untuk tablet */
    padding: 1.25rem; /* Padding 20px untuk tablet */
  }
}

/* 
 * Desktop devices (min-width: 769px)
 * Ukuran penuh dengan efek visual maksimal
 */
@media (min-width: 769px) {
  .game-grid {
    border-width: 2px; /* Border penuh untuk desktop */
    backdrop-filter: blur(12px); /* Blur effect yang lebih kuat */
    max-width: 500px; /* Lebar maksimal untuk desktop */
  }
}

/* === OPTIMASI LAYOUT === */

/* Mencegah scroll horizontal yang tidak diinginkan */
body {
  overflow-x: hidden;
}

/* Pastikan container tidak melebihi viewport width */
.max-w-4xl {
  max-width: min(100vw - 1rem, 56rem);
}

/* === ANIMASI CSS === */

/* 
 * Keyframes untuk animasi zoom logo
 * Membuat efek pulsing dengan scale transform
 */
@keyframes logoZoom {
  0% {
    transform: scale(1); /* Ukuran normal */
  }
  50% {
    transform: scale(1.2); /* Membesar 20% */
  }
  100% {
    transform: scale(1); /* Kembali ke ukuran normal */
  }
}

/* 
 * Kelas untuk menerapkan animasi pulse pada logo
 * Durasi 2 detik, easing smooth, loop tak terbatas
 */
.logo-pulse {
  animation: logoZoom 2s ease-in-out infinite;
}
</style>
