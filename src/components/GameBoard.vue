<script setup>
// Import fungsi Vue dan komponen yang diperlukan
import { ref, onBeforeUnmount } from 'vue'
import Card from './GameCard.vue'

// === VARIABEL REAKTIF UNTUK MENGELOLA STATE GAME ===

// Array berisi semua kartu dalam permainan (14 kartu total: 7 pasang)
const cards = ref([])

// Array berisi indeks kartu yang sedang dibuka (maksimal 2 kartu)
const flippedCards = ref([])

// Jumlah pasangan kartu yang sudah berhasil dicocokkan (target: 7 pasang)
const matchedPairs = ref(0)

// Status apakah permainan sudah dimulai atau belum
const gameStarted = ref(false)

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
    number,           // Angka yang ditampilkan di kartu
    isFlipped: false, // Status apakah kartu sedang terbuka
    isMatched: false, // Status apakah kartu sudah dicocokkan
  }))

  // Reset semua variabel game ke kondisi awal
  flippedCards.value = []        // Kosongkan kartu yang sedang dibuka
  matchedPairs.value = 0         // Reset jumlah pasangan yang ditemukan
  score.value = 0                // Reset skor ke 0
  attempts.value = 0             // Reset jumlah percobaan
  timer.value = 0                // Reset timer ke 0
  gameCompleted.value = false    // Set status game belum selesai
  isCardDisabled.value = false   // Aktifkan kembali klik kartu
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
  gameStarted.value = false    // Tandai game belum dimulai
  gameCompleted.value = false  // Tandai game belum selesai
  stopTimer()                  // Hentikan timer
  initializeGame()             // Reset semua variabel ke kondisi awal
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
    timerInterval.value = null         // Reset reference
  }
}

/**
 * Fungsi untuk memformat waktu dari detik ke format MM:SS
 * @param {number} seconds - Waktu dalam detik
 * @returns {string} Waktu dalam format "MM:SS"
 */
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)  // Hitung menit
  const secs = seconds % 60              // Hitung sisa detik
  
  // Format dengan padding 0 di depan jika perlu (contoh: 01:05)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Fungsi yang dipanggil ketika pemain mengklik sebuah kartu
 * Mengelola logika pembukaan kartu dan validasi klik
 * @param {number} cardIndex - Indeks kartu yang diklik (0-13)
 */
const handleCardClick = (cardIndex) => {
  // Validasi: cek apakah kartu bisa diklik
  if (
    isCardDisabled.value ||                    // Kartu sedang dinonaktifkan (saat mengecek match)
    cards.value[cardIndex].isFlipped ||        // Kartu sudah terbuka
    cards.value[cardIndex].isMatched           // Kartu sudah dicocokkan
  ) {
    return // Keluar dari fungsi jika tidak valid
  }

  // Buka kartu yang diklik
  cards.value[cardIndex].isFlipped = true
  
  // Tambahkan indeks kartu ke array kartu yang sedang terbuka
  flippedCards.value.push(cardIndex)

  // Jika sudah ada 2 kartu terbuka, saatnya mengecek kecocokan
  if (flippedCards.value.length === 2) {
    attempts.value++           // Tambah jumlah percobaan
    isCardDisabled.value = true // Nonaktifkan klik kartu sementara

    // Beri delay 1 detik agar pemain bisa melihat kedua kartu
    setTimeout(() => {
      checkMatch() // Cek apakah kedua kartu cocok
    }, 1000)
  }
}

/**
 * Fungsi untuk mengecek apakah dua kartu yang terbuka cocok
 * Mengelola logika scoring, pencocokan, dan penyelesaian game
 */
const checkMatch = () => {
  // Ambil indeks kedua kartu yang sedang terbuka
  const [firstIndex, secondIndex] = flippedCards.value
  
  // Ambil objek kartu berdasarkan indeks
  const firstCard = cards.value[firstIndex]
  const secondCard = cards.value[secondIndex]

  // Cek apakah angka pada kedua kartu sama
  if (firstCard.number === secondCard.number) {
    // COCOK! Tandai kedua kartu sebagai matched
    firstCard.isMatched = true
    secondCard.isMatched = true
    
    // Update statistik game
    matchedPairs.value++  // Tambah jumlah pasangan yang ditemukan
    score.value += 10     // Tambah skor dasar 10 poin

    // Cek apakah semua pasangan sudah ditemukan (7 pasang)
    if (matchedPairs.value === 7) {
      gameCompleted.value = true // Tandai game selesai
      stopTimer()                // Hentikan timer
      
      // Berikan bonus skor berdasarkan efisiensi (semakin sedikit percobaan, semakin tinggi bonus)
      score.value += Math.max(0, 100 - attempts.value)
    }
  } else {
    // TIDAK COCOK! Tutup kembali kedua kartu
    firstCard.isFlipped = false
    secondCard.isFlipped = false
  }

  // Reset untuk giliran berikutnya
  flippedCards.value = []        // Kosongkan array kartu yang terbuka
  isCardDisabled.value = false   // Aktifkan kembali klik kartu
}

// === LIFECYCLE HOOKS ===

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

  <!-- === CONTAINER UTAMA GAME === -->
  <!-- Container responsif dengan padding dan alignment tengah -->
  <div class="max-w-4xl mx-auto p-2 sm:p-4 text-center">
    
    <!-- === HEADER GAME === -->
    <!-- Bagian judul dan statistik game -->
    <div class="mb-4 sm:mb-6">
      
      <!-- Judul Game -->
      <h1
        class="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg mt-2 sm:mt-3"
      >
        Stage 2 Final
      </h1>
      
      <!-- === PANEL STATISTIK === -->
      <!-- Menampilkan skor, percobaan, dan waktu dalam bentuk badge -->
      <div class="mt-2 sm:mt-3 flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
        
        <!-- Badge Skor -->
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]"
        >
          <span>Skor: {{ score }}</span>
        </div>
        
        <!-- Badge Percobaan -->
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[90px] sm:min-w-[110px]"
        >
          <span>Percobaan: {{ attempts }}</span>
        </div>
        
        <!-- Badge Timer -->
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]"
        >
          <span>Waktu: {{ formatTime(timer) }}</span>
        </div>
      </div>
      
      <!-- === PANEL KONTROL GAME === -->
      <!-- Tombol untuk memulai dan mereset permainan -->
      <div class="flex justify-center gap-2 sm:gap-3 flex-wrap">
        
        <!-- Tombol Mulai Game / Main Lagi -->
        <button
          @click="startGame"
          :disabled="gameStarted && !gameCompleted"
          class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
        >
          <!-- Teks tombol berubah sesuai status game -->
          {{ gameStarted ? (gameCompleted ? 'Main Lagi' : 'Game Berjalan') : 'Mulai Game' }}
        </button>
        
        <!-- Tombol Reset -->
        <button
          @click="resetGame"
          class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-red-500 text-white hover:bg-red-600 shadow-lg text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]"
        >
          Reset
        </button>
      </div>
    </div>

    <!-- === GRID KARTU PERMAINAN === -->
    <!-- 
      Grid 4x4 yang menampilkan 14 kartu (7 pasang)
      Hanya ditampilkan ketika game sudah dimulai
    -->
    <div
      class="grid grid-cols-4 gap-3 sm:gap-4 max-w-md sm:max-w-xl mx-auto p-5 sm:p-6 game-grid rounded-xl shadow-xl"
      v-if="gameStarted"
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

    <!-- === PESAN GAME SELESAI === -->
    <!-- Panel yang muncul ketika pemain berhasil menyelesaikan permainan -->
    <div
      v-if="gameCompleted"
      class="bg-green-100 bg-opacity-95 border-2 border-green-500 rounded-xl p-3 sm:p-4 mt-4 sm:mt-6 shadow-xl"
    >
      <!-- Judul Selamat -->
      <h2 class="text-green-600 text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
        🎉 Selamat! Game Selesai! 🎉
      </h2>
      
      <!-- Statistik Akhir Game -->
      <div class="space-y-1 sm:space-y-2 text-sm sm:text-base">
        <!-- Skor Akhir (termasuk bonus) -->
        <p class="text-gray-800 font-semibold">
          Skor Akhir: <span class="text-green-600">{{ score }}</span>
        </p>
        
        <!-- Total Percobaan yang Dilakukan -->
        <p class="text-gray-800 font-semibold">
          Total Percobaan: <span class="text-green-600">{{ attempts }}</span>
        </p>
        
        <!-- Waktu yang Dibutuhkan -->
        <p class="text-gray-800 font-semibold">
          Waktu: <span class="text-green-600">{{ formatTime(timer) }}</span>
        </p>
      </div>
    </div>

    <!-- === INSTRUKSI PERMAINAN === -->
    <!-- Panel yang muncul sebelum game dimulai, berisi cara bermain -->
    <div
      v-if="!gameStarted"
      class="bg-blue-50 bg-opacity-95 border-2 border-blue-500 rounded-xl p-3 sm:p-4 mt-4 sm:mt-6 text-left shadow-xl"
    >
      <!-- Judul Instruksi -->
      <h3 class="text-blue-600 text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-center">
        Cara Bermain:
      </h3>
      
      <!-- Daftar Aturan Permainan -->
      <ul class="list-disc pl-3 sm:pl-4 space-y-1 sm:space-y-2 text-gray-800 text-xs sm:text-sm">
        <li class="leading-relaxed">Klik dua kartu untuk melihat angkanya</li>
        <li class="leading-relaxed">Jika angka sama, kartu akan tetap terbuka</li>
        <li class="leading-relaxed">Jika berbeda, kartu akan tertutup kembali</li>
        <li class="leading-relaxed">Temukan semua 7 pasang untuk menang!</li>
      </ul>
    </div>
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
    0 6px 24px rgba(76, 175, 80, 0.12),    /* Shadow utama hijau */
    0 3px 12px rgba(0, 0, 0, 0.08),         /* Shadow hitam untuk depth */
    inset 0 1px 0 rgba(255, 255, 255, 0.2); /* Inner shadow untuk highlight */
}

/* === RESPONSIVE DESIGN - MEDIA QUERIES === */

/* 
 * Mobile devices (max-width: 480px)
 * Optimasi untuk layar kecil dengan spacing yang lebih rapat
 */
@media (max-width: 480px) {
  .game-grid {
    padding: 1rem;           /* Padding 16px untuk mobile */
    border-width: 1px;       /* Border lebih tipis untuk mobile */
    gap: 0.5rem;             /* Gap 8px antar kartu */
    max-width: 380px;        /* Lebar maksimal grid untuk mobile */
    
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
    max-width: 450px;        /* Lebar maksimal untuk tablet */
    gap: 0.75rem;            /* Gap 12px untuk tablet */
    padding: 1.25rem;        /* Padding 20px untuk tablet */
  }
}

/* 
 * Desktop devices (min-width: 769px)
 * Ukuran penuh dengan efek visual maksimal
 */
@media (min-width: 769px) {
  .game-grid {
    border-width: 2px;           /* Border penuh untuk desktop */
    backdrop-filter: blur(12px); /* Blur effect yang lebih kuat */
    max-width: 500px;            /* Lebar maksimal untuk desktop */
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
    transform: scale(1);     /* Ukuran normal */
  }
  50% {
    transform: scale(1.2);   /* Membesar 20% */
  }
  100% {
    transform: scale(1);     /* Kembali ke ukuran normal */
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
