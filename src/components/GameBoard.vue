<script setup>
import { ref, onBeforeUnmount } from 'vue'
import Card from './GameCard.vue'

// Reactive data
const cards = ref([])
const flippedCards = ref([])
const matchedPairs = ref(0)
const gameStarted = ref(false)
const gameCompleted = ref(false)
const score = ref(0)
const attempts = ref(0)
const timer = ref(0)
const timerInterval = ref(null)
const isCardDisabled = ref(false)
// Methods
const initializeGame = () => {
  // Buat 7 pasang angka (1-7)
  const numbers = []
  for (let i = 1; i <= 7; i++) {
    numbers.push(i, i) // Tambahkan setiap angka dua kali
  }

  // Acak urutan kartu
  shuffleArray(numbers)

  // Buat objek kartu
  cards.value = numbers.map((number) => ({
    number,
    isFlipped: false,
    isMatched: false,
  }))

  // Reset game state
  flippedCards.value = []
  matchedPairs.value = 0
  score.value = 0
  attempts.value = 0
  timer.value = 0
  gameCompleted.value = false
  isCardDisabled.value = false
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
  if (
    isCardDisabled.value ||
    cards.value[cardIndex].isFlipped ||
    cards.value[cardIndex].isMatched
  ) {
    return
  }

  // Flip kartu
  cards.value[cardIndex].isFlipped = true
  flippedCards.value.push(cardIndex)

  // Jika sudah ada 2 kartu terbuka
  if (flippedCards.value.length === 2) {
    attempts.value++
    isCardDisabled.value = true

    setTimeout(() => {
      checkMatch()
    }, 1000)
  }
}

const checkMatch = () => {
  const [firstIndex, secondIndex] = flippedCards.value
  const firstCard = cards.value[firstIndex]
  const secondCard = cards.value[secondIndex]

  if (firstCard.number === secondCard.number) {
    // Match found!
    firstCard.isMatched = true
    secondCard.isMatched = true
    matchedPairs.value++
    score.value += 10

    // Check if game is completed
    if (matchedPairs.value === 7) {
      gameCompleted.value = true
      stopTimer()
      score.value += Math.max(0, 100 - attempts.value) // Bonus untuk sedikit percobaan
    }
  } else {
    // No match, flip cards back
    firstCard.isFlipped = false
    secondCard.isFlipped = false
  }

  // Reset untuk turn berikutnya
  flippedCards.value = []
  isCardDisabled.value = false
}

// Lifecycle hook
onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <!-- Logo di pojok kiri atas dengan posisi fixed -->
  <div class="fixed -top-9 left-12 z-50">
    <img
      src="/src/assets/images/rac-logo.png"
      alt="RAC Logo"
      class="w-90 sm:h-72 object-contain logo-pulse "
    />
  </div>

  <div class="max-w-4xl mx-auto p-2 sm:p-4 text-center">
    <div class="mb-4 sm:mb-6">
      <h1
        class="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg mt-2 sm:mt-3"
      >
        Stage 2 Final
      </h1>
      <div class="mt-2 sm:mt-3 flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]"
        >
          <span>Skor: {{ score }}</span>
        </div>
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[90px] sm:min-w-[110px]"
        >
          <span>Percobaan: {{ attempts }}</span>
        </div>
        <div
          class="bg-white bg-opacity-95 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-gray-800 shadow-lg text-xs sm:text-sm min-w-[80px] sm:min-w-[100px]"
        >
          <span>Waktu: {{ formatTime(timer) }}</span>
        </div>
      </div>
      <div class="flex justify-center gap-2 sm:gap-3 flex-wrap">
        <button
          @click="startGame"
          :disabled="gameStarted && !gameCompleted"
          class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
        >
          {{ gameStarted ? (gameCompleted ? 'Main Lagi' : 'Game Berjalan') : 'Mulai Game' }}
        </button>
        <button
          @click="resetGame"
          class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-red-500 text-white hover:bg-red-600 shadow-lg text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]"
        >
          Reset
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-4 gap-3 sm:gap-4 max-w-md sm:max-w-xl mx-auto p-5 sm:p-6 game-grid rounded-xl shadow-xl"
      v-if="gameStarted"
    >
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

    <div
      v-if="gameCompleted"
      class="bg-green-100 bg-opacity-95 border-2 border-green-500 rounded-xl p-3 sm:p-4 mt-4 sm:mt-6 shadow-xl"
    >
      <h2 class="text-green-600 text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
        🎉 Selamat! Game Selesai! 🎉
      </h2>
      <div class="space-y-1 sm:space-y-2 text-sm sm:text-base">
        <p class="text-gray-800 font-semibold">
          Skor Akhir: <span class="text-green-600">{{ score }}</span>
        </p>
        <p class="text-gray-800 font-semibold">
          Total Percobaan: <span class="text-green-600">{{ attempts }}</span>
        </p>
        <p class="text-gray-800 font-semibold">
          Waktu: <span class="text-green-600">{{ formatTime(timer) }}</span>
        </p>
      </div>
    </div>

    <div
      v-if="!gameStarted"
      class="bg-blue-50 bg-opacity-95 border-2 border-blue-500 rounded-xl p-3 sm:p-4 mt-4 sm:mt-6 text-left shadow-xl"
    >
      <h3 class="text-blue-600 text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-center">
        Cara Bermain:
      </h3>
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
/* Optimized spacing and proportions - lebih rapat dan efisien */
.game-grid {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 255, 240, 0.85) 100%);
  border: 2px solid rgba(76, 175, 80, 0.3);
  backdrop-filter: blur(10px);
  box-shadow:
    0 6px 24px rgba(76, 175, 80, 0.12),
    0 3px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Responsive spacing adjustments - disesuaikan untuk kartu yang lebih besar lagi */
@media (max-width: 480px) {
  .game-grid {
    padding: 1rem; /* 16px - disesuaikan untuk kartu yang lebih besar */
    border-width: 1px;
    gap: 0.5rem; /* 8px - spacing yang lebih baik untuk mobile */
    max-width: 380px; /* disesuaikan untuk kartu 20x20 */
    box-shadow:
      0 3px 12px rgba(76, 175, 80, 0.1),
      0 1px 6px rgba(0, 0, 0, 0.06);
  }

  /* Container utama disesuaikan */
  .max-w-4xl {
    padding: 1rem;
  }

  /* Margin vertikal yang proporsional */
  .mb-4 {
    margin-bottom: 1rem;
  }

  .mt-4 {
    margin-top: 1rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .game-grid {
    max-width: 450px; /* disesuaikan untuk tablet dengan kartu lebih besar */
    gap: 0.75rem; /* 12px - spacing yang lebih baik untuk tablet */
    padding: 1.25rem;
  }
}

@media (min-width: 769px) {
  .game-grid {
    border-width: 2px;
    backdrop-filter: blur(12px);
    max-width: 500px; /* disesuaikan untuk desktop dengan kartu 24x24 */
  }
}

/* Optimasi spacing untuk mencegah scroll horizontal */
body {
  overflow-x: hidden;
}

/* Pastikan container tidak melebihi viewport */
.max-w-4xl {
  max-width: min(100vw - 1rem, 56rem);
}

/* Animasi zoom-in zoom-out untuk logo */
@keyframes logoZoom {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.logo-pulse {
  animation: logoZoom 2s ease-in-out infinite;
}
</style>
