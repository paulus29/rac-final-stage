<script setup>
import { onMounted, ref } from 'vue'

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
  player1Points: {
    type: Number,
    required: true,
  },
  player2Points: {
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

const isMinimized = ref(false)
</script>

<template>
  <!-- Modal Overlay Background dengan animasi -->
  <Transition name="modal" appear>
    <div v-if="!isMinimized" class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <!-- Modal Content dengan animasi scale -->
      <div
        class="bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
      >
        <!-- Header actions -->
        <div class="flex justify-end mb-2">
          <button
            @click="isMinimized = true"
            class="text-emerald-800 hover:text-emerald-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-emerald-300"
            title="Minimize"
          >▁</button>
        </div>
        <h2 class="text-amber-800 text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
          🎉 Game Selesai! 🎉
        </h2>

        <div class="mb-3 sm:mb-4">
          <div v-if="winner === 1" class="text-xl sm:text-2xl font-bold text-amber-700 mb-2">
            🏆 {{ player1Name }} Menang! 🏆
          </div>
          <div v-else-if="winner === 2" class="text-xl sm:text-2xl font-bold text-green-700 mb-2">
            🏆 {{ player2Name }} Menang! 🏆
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div class="bg-amber-50 p-2 sm:p-3 rounded-lg border border-amber-300">
            <div class="font-bold text-amber-800 text-sm sm:text-base">{{ player1Name }}</div>
            <div class="text-xs sm:text-sm text-amber-700">
              <div>
                Poin: <span class="font-bold">{{ player1Points }}</span>
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
                Poin: <span class="font-bold">{{ player2Points }}</span>
              </div>
              <div>
                Percobaan: <span class="font-bold">{{ player2Attempts }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-1 sm:space-y-2 text-sm sm:text-base">
          <p class="text-amber-900 font-semibold">
            Total Percobaan:
            <span class="text-green-700">{{ player1Attempts + player2Attempts }}</span>
          </p>

          <p class="text-amber-900 font-semibold">
            Waktu: <span class="text-green-700">{{ formatTime(timer) }}</span>
          </p>
        </div>

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
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isMinimized" class="fixed bottom-4 left-4 z-[60]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-emerald-400 shadow-md text-emerald-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>🎉 Game Selesai</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white">Buka</span>
    </button>
  </div>
</template>

<style>
/* Animasi modal dengan efek fade dan scale */
.modal-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.3s ease-in;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(-30px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

/* Animasi background overlay */
.modal-enter-from .fixed {
  background-color: rgba(0, 0, 0, 0);
}

.modal-enter-active .fixed {
  transition: background-color 0.4s ease;
  background-color: rgba(0, 0, 0, 0.1);
}

/* Animasi confetti */
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
