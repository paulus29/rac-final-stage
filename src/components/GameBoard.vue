<script setup>
import { ref, onBeforeUnmount } from 'vue'
import Card from './Card.vue'

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
  <div class="max-w-4xl mx-auto p-4 sm:p-6 text-center">
    <div class="mb-8 sm:mb-12">
      <h1
        class="text-2xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 drop-shadow-lg mt-4 sm:mt-6"
      >
        Number Matching Game
      </h1>
      <div class="mt-3 sm:mt-4 flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap">
        <div
          class="bg-white bg-opacity-95 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-gray-800 shadow-lg text-sm sm:text-base min-w-[100px] sm:min-w-[120px]"
        >
          <span>Skor: {{ score }}</span>
        </div>
        <div
          class="bg-white bg-opacity-95 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-gray-800 shadow-lg text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
        >
          <span>Percobaan: {{ attempts }}</span>
        </div>
        <div
          class="bg-white bg-opacity-95 px-3 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-gray-800 shadow-lg text-sm sm:text-base min-w-[100px] sm:min-w-[120px]"
        >
          <span>Waktu: {{ formatTime(timer) }}</span>
        </div>
      </div>
      <div class="flex justify-center gap-4 sm:gap-6 flex-wrap">
        <button
          @click="startGame"
          :disabled="gameStarted && !gameCompleted"
          class="px-4 sm:px-8 py-2 sm:py-3 border-none rounded-lg font-bold transition-all duration-300 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-sm sm:text-base min-w-[120px] sm:min-w-[140px]"
        >
          {{ gameStarted ? (gameCompleted ? 'Main Lagi' : 'Game Berjalan') : 'Mulai Game' }}
        </button>
        <button
          @click="resetGame"
          class="px-4 sm:px-8 py-2 sm:py-3 border-none rounded-lg font-bold transition-all duration-300 bg-red-500 text-white hover:bg-red-600 shadow-lg text-sm sm:text-base min-w-[80px] sm:min-w-[100px]"
        >
          Reset
        </button>
      </div>
    </div>

    <div
      class="grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-lg mx-auto p-4 sm:p-6 game-grid rounded-xl shadow-xl"
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
      class="bg-green-100 bg-opacity-95 border-2 border-green-500 rounded-xl p-4 sm:p-6 mt-8 sm:mt-12 shadow-xl"
    >
      <h2 class="text-green-600 text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        🎉 Selamat! Game Selesai! 🎉
      </h2>
      <div class="space-y-2 sm:space-y-3 text-base sm:text-lg">
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
      class="bg-blue-50 bg-opacity-95 border-2 border-blue-500 rounded-xl p-4 sm:p-6 mt-8 sm:mt-12 text-left shadow-xl"
    >
      <h3 class="text-blue-600 text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        Cara Bermain:
      </h3>
      <ul class="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3 text-gray-800 text-sm sm:text-base">
        <li class="leading-relaxed">Klik dua kartu untuk melihat angkanya</li>
        <li class="leading-relaxed">Jika angka sama, kartu akan tetap terbuka</li>
        <li class="leading-relaxed">Jika berbeda, kartu akan tertutup kembali</li>
        <li class="leading-relaxed">Temukan semua 7 pasang untuk menang!</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Optimized spacing and proportions */
.game-grid {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 255, 240, 0.85) 100%);
  border: 2px solid rgba(76, 175, 80, 0.3);
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(76, 175, 80, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Responsive spacing adjustments */
@media (max-width: 480px) {
  .grid {
    max-width: 280px;
    gap: 0.375rem; /* 6px - tighter spacing on mobile */
  }

  .game-grid {
    padding: 0.75rem; /* 12px */
    border-width: 1px;
    box-shadow:
      0 4px 16px rgba(76, 175, 80, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08);
  }

  /* Tighter spacing for mobile status indicators */
  .max-w-4xl {
    padding: 0.75rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .grid {
    max-width: 320px;
    gap: 0.5rem; /* 8px - medium spacing for tablets */
  }
}

@media (min-width: 769px) {
  .game-grid {
    border-width: 2px;
    backdrop-filter: blur(12px);
  }
}

/* Button spacing optimization */
.flex.justify-center.gap-4 button {
  margin: 0.25rem;
}

@media (max-width: 480px) {
  .flex.justify-center.gap-4 button {
    margin: 0.125rem;
    min-width: 100px;
  }
}

/* Status indicators spacing */
.flex.justify-center.gap-3 > div {
  margin: 0.125rem;
}

@media (min-width: 640px) {
  .flex.justify-center.gap-3 > div {
    margin: 0.25rem;
  }
}
</style>
