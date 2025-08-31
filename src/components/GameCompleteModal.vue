<script setup>
import { onMounted } from 'vue'

defineProps({
  winner: {
    type: [Number, String],
    required: true,
  },
  player1Name: {
    type: String,
    required: true,
  },
  player2Name: {
    type: String,
    required: true,
  },
  player1Score: {
    type: Number,
    required: true,
  },
  player2Score: {
    type: Number,
    required: true,
  },
  player1Attempts: {
    type: Number,
    required: true,
  },
  player2Attempts: {
    type: Number,
    required: true,
  },
  totalAttempts: {
    type: Number,
    required: true,
  },
  timer: {
    type: Number,
    required: true,
  },
  formatTime: {
    type: Function,
    required: true,
  },
})

defineEmits(['reset-game'])

// Confetti animation function
const createConfetti = () => {
  const colors = ['#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']
  const confettiCount = 150

  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div')
      confetti.className = 'confetti-piece'
      confetti.style.position = 'fixed'
      confetti.style.left = Math.random() * 100 + 'vw'
      confetti.style.top = '-20px'
      confetti.style.width = Math.random() * 8 + 6 + 'px'
      confetti.style.height = Math.random() * 8 + 6 + 'px'
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0'
      confetti.style.zIndex = '999'
      confetti.style.pointerEvents = 'none'

      const fallDuration = Math.random() * 3 + 2
      confetti.style.animation = `confetti-fall ${fallDuration}s linear`

      document.body.appendChild(confetti)

      setTimeout(() => {
        if (confetti && confetti.parentNode) {
          confetti.parentNode.removeChild(confetti)
        }
      }, fallDuration * 1000)
    }, i * 50)
  }
}

onMounted(() => {
  createConfetti()
})
</script>

<template>
  <!-- Modal Overlay Background - Transparent to show gameboard -->
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <!-- Modal Content -->
    <div
      class="bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
    >
      <!-- Judul Selamat -->
      <h2 class="text-amber-800 text-xl sm:text-2xl font-bold mb-2 sm:mb-3">🎉 Game Selesai! 🎉</h2>

      <!-- Pengumuman Pemenang -->
      <div class="mb-3 sm:mb-4">
        <div v-if="winner === 1" class="text-xl sm:text-2xl font-bold text-amber-700 mb-2">
          🏆 {{ player1Name }} Menang! 🏆
        </div>
        <div v-else-if="winner === 2" class="text-xl sm:text-2xl font-bold text-green-700 mb-2">
          🏆 {{ player2Name }} Menang! 🏆
        </div>
      </div>

      <!-- Skor Akhir Kedua Pemain -->
      <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div class="bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-300">
          <div class="font-bold text-amber-800 text-sm sm:text-base">{{ player1Name }}</div>
          <div class="text-xs sm:text-sm text-amber-700">
            <div>
              Skor: <span class="font-bold">{{ player1Score }}</span>
            </div>
            <div>
              Percobaan: <span class="font-bold">{{ player1Attempts }}</span>
            </div>
          </div>
        </div>
        <div class="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-300">
          <div class="font-bold text-green-800 text-sm sm:text-base">{{ player2Name }}</div>
          <div class="text-xs sm:text-sm text-green-700">
            <div>
              Skor: <span class="font-bold">{{ player2Score }}</span>
            </div>
            <div>
              Percobaan: <span class="font-bold">{{ player2Attempts }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistik Akhir Game -->
      <div class="space-y-1 sm:space-y-2 text-sm sm:text-base">
        <!-- Total Percobaan yang Dilakukan -->
        <p class="text-amber-900 font-semibold">
          Total Percobaan: <span class="text-green-700">{{ totalAttempts }}</span>
        </p>

        <!-- Waktu yang Dibutuhkan -->
        <p class="text-amber-900 font-semibold">
          Waktu: <span class="text-green-700">{{ formatTime(timer) }}</span>
        </p>
      </div>

      <!-- Reset Button -->
      <div class="flex justify-center mt-4">
        <button
          @click="$emit('reset-game')"
          class="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg"
        >
          🔄 Main Lagi
        </button>
      </div>
    </div>
  </div>
</template>

<style>
@keyframes confetti-fall {
  0% {
    transform: translateY(-20px) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg) scale(0.5);
    opacity: 0;
  }
}

.confetti-piece {
  animation-fill-mode: forwards;
}
</style>
