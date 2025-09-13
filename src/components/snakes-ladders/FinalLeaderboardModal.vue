<template>
  <Transition name="modal" appear>
    <div v-if="isVisible && !isMinimized" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/30" @click="$emit('close')"></div>

      <!-- Modal Card -->
      <div
        class="relative w-full max-w-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-600 rounded-2xl p-6 shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="px-3 py-1 rounded-lg text-white font-bold text-sm bg-amber-600">Final</div>
            <h3 class="text-xl sm:text-2xl font-extrabold text-amber-900">Leaderboard Juara</h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="isMinimized = true"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Minimize"
            >▁</button>
          </div>
        </div>

        <!-- Leaderboard - Podium -->
        <div class="relative z-10 bg-white rounded-xl border border-amber-200 p-5 shadow-inner">
          <div class="grid grid-cols-3 gap-4 items-end text-center">
            <!-- Runner-up (2nd) - left, lower than 1st -->
            <div v-if="podium[1]" class="flex flex-col items-center">
              <div class="mb-2 flex items-center gap-2 text-gray-700 font-semibold">
                <span class="text-xl">{{ podium[1].icon }}</span>
                <span>{{ podium[1].name }}</span>
              </div>
              <div class="w-full max-w-[120px]">
                <div
                  class="mx-auto w-10 h-10 grid place-items-center rounded-full text-white font-extrabold mb-1"
                  :class="rankBadgeClass(2)"
                >
                  2
                </div>
                <div
                  class="rounded-t-md bg-gradient-to-t from-slate-500 to-slate-300 h-20 shadow-md"
                ></div>
              </div>
            </div>

            <!-- Winner (1st) - center, highest -->
            <div v-if="podium[0]" class="flex flex-col items-center">
              <div class="mb-2 flex items-center gap-2 text-gray-800 font-extrabold">
                <span class="text-2xl">{{ podium[0].icon }}</span>
                <span class="text-lg">{{ podium[0].name }}</span>
              </div>
              <div class="w-full max-w-[140px]">
                <div
                  class="mx-auto w-12 h-12 grid place-items-center rounded-full text-white font-extrabold mb-1"
                  :class="rankBadgeClass(1)"
                >
                  1
                </div>
                <div
                  class="rounded-t-md bg-gradient-to-t from-yellow-500 to-amber-400 h-28 shadow-md"
                ></div>
              </div>
            </div>

            <!-- Third (3rd) - right, lowest -->
            <div v-if="podium[2]" class="flex flex-col items-center">
              <div class="mb-2 flex items-center gap-2 text-gray-700 font-semibold">
                <span class="text-xl">{{ podium[2].icon }}</span>
                <span>{{ podium[2].name }}</span>
              </div>
              <div class="w-full max-w-[120px]">
                <div
                  class="mx-auto w-10 h-10 grid place-items-center rounded-full text-white font-extrabold mb-1"
                  :class="rankBadgeClass(3)"
                >
                  3
                </div>
                <div
                  class="rounded-t-md bg-gradient-to-t from-amber-800 to-amber-700 h-16 shadow-md"
                ></div>
              </div>
            </div>
          </div>

          <!-- Others list (if any) -->
          <div v-if="others.length" class="mt-5">
            <div class="text-left text-sm text-gray-600 mb-2">Lainnya:</div>
            <ol class="space-y-2">
              <li
                v-for="row in others"
                :key="row.id"
                class="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-200"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-7 h-7 grid place-items-center rounded-full text-xs font-bold text-white"
                    :class="rankBadgeClass(row.rank)"
                  >
                    {{ row.rank ?? '-' }}
                  </div>
                  <div class="font-medium text-gray-800">
                    <span class="mr-1">{{ row.icon }}</span
                    >{{ row.name }}
                  </div>
                </div>
                <div class="text-xs text-gray-600">
                  <template v-if="row.finished">🏁 Selesai</template>
                  <template v-else>📍 Posisi: {{ row.position }}</template>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <!-- Actions -->
        <div class="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            @click="$emit('home')"
            class="px-5 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 shadow"
          >
            🏠 Menu Utama
          </button>
          <button
            @click="$emit('reset')"
            class="px-5 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow"
          >
            🔄 Main Lagi
          </button>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isVisible && isMinimized" class="fixed bottom-4 left-4 z-[91]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-amber-400 shadow-md text-amber-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>🏆 Leaderboard Final</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">Buka</span>
    </button>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  players: { type: Array, required: true },
})

const isMinimized = ref(false)

const rankBadgeClass = (rank) => {
  if (rank === 1) return 'bg-yellow-500'
  if (rank === 2) return 'bg-gray-400'
  if (rank === 3) return 'bg-amber-700'
  return 'bg-gray-300 text-gray-700'
}

// Leaderboard:
// - Urutkan pemain yang finished berdasarkan rank naik (1,2,3)
// - Pemain yang belum finish diurutkan setelahnya berdasarkan posisi menurun (lebih jauh lebih atas)
const leaderboard = computed(() => {
  const finished = props.players
    .filter((p) => p.finished)
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  const unfinished = props.players
    .filter((p) => !p.finished)
    .sort((a, b) => b.position - a.position)
  return [...finished, ...unfinished]
})

// Top 3 for podium layout
const podium = computed(() => leaderboard.value.slice(0, 3))
const others = computed(() => leaderboard.value.slice(3))

// Confetti ala match-game: DOM elements with CSS animation
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
        if (confetti && confetti.parentNode) confetti.parentNode.removeChild(confetti)
      }, fallDuration * 1000)
    }, i * 50)
  }
}

watch(
  () => props.isVisible,
  (v) => {
    // reset minimize setiap kali dibuka/ditutup
    isMinimized.value = false
    if (v) createConfetti()
  },
)
</script>

<style scoped>
.modal-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-leave-active { transition: all 0.25s ease-in; }
.modal-enter-from { opacity: 0; transform: scale(0.94) translateY(-8px); }
.modal-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }

/* Confetti animation (match-game style) */
@keyframes confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
  50% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
}
.confetti-piece { animation-fill-mode: forwards; }
</style>
