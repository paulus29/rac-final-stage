<template>
  <div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
    <h2 class="text-2xl font-bold text-white mb-4 text-center">Game Control</h2>

    <!-- Player Selection -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Pilih Kelompok:</label>
      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="player in players"
          :key="player.id"
          @click="$emit('select-player', player.id)"
          :disabled="disabled || player.finished"
          :class="getPlayerBtnClass(player)"
          class="relative pr-16"
        >
          <div class="font-semibold">{{ player.icon }} {{ player.name }}</div>
          <span
            v-if="player.finished"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-600/90 text-white font-bold"
          >
            🏁 #{{ player.rank }}
          </span>
          <span
            v-else-if="player.shield > 0"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-3 py-1.5 rounded-md bg-emerald-500/90 text-white font-extrabold flex items-center gap-1"
          >
            <img :src="shieldLogo" alt="shield" class="w-5 h-5" />
            <span>x{{ player.shield }}</span>
          </span>
          <span v-if="player.finished" class="text-sm block opacity-80"
            >🏁 Selesai #{{ player.rank }}</span
          >
          <span v-else class="text-sm block opacity-80">Posisi: {{ player.position }}</span>
        </button>
      </div>
    </div>

    <!-- Step Controls -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Langkah:</label>
      <div class="grid grid-cols-3 gap-1 mb-4">
        <button
          v-for="n in 6"
          :key="n"
          @click="$emit('set-steps', n)"
          :disabled="disabled"
          :class="[
            'py-2 rounded font-semibold transition-all',
            steps === n
              ? 'bg-amber-500 text-white'
              : 'bg-white/70 hover:bg-white/90 text-gray-800 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed',
          ]"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <!-- Move Buttons -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <button
        @click="$emit('move-player-forward')"
        :disabled="!selectedPlayerId || disabled"
        class="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬆️ Maju
      </button>
      <button
        @click="$emit('move-player-backward')"
        :disabled="!selectedPlayerId || disabled"
        class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬇️ Mundur
      </button>
    </div>
    <!-- Timer -->
    <div class="mb-6">
      <div class="bg-white/15 backdrop-blur rounded-xl border border-white/25 shadow-inner p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2 text-white/90 font-semibold">
            <span>⏱️</span>
            <span>Timer</span>
            <span
              class="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
              :class="isRunning ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'"
            >
              {{ isRunning ? 'Running' : elapsed > 0 ? 'Paused' : 'Ready' }}
            </span>
          </div>
        </div>

        <div class="flex items-center justify-center mb-3">
          <div
            class="text-4xl sm:text-5xl font-extrabold text-white drop-shadow font-mono tracking-widest"
          >
            {{ formattedTime }}
          </div>
        </div>

        <div class="flex gap-3 justify-center">
          <button
            @click="isRunning ? pauseTimer() : startTimer()"
            :class="[
              'px-4 py-2 rounded-lg font-bold text-white shadow-md transition-colors',
              isRunning
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
            ]"
          >
            {{ isRunning ? 'Jeda' : elapsed > 0 ? 'Lanjut' : 'Mulai' }}
          </button>
          <button
            @click="resetTimer"
            :disabled="elapsed === 0 && !isRunning"
            class="px-4 py-2 rounded-lg font-bold text-white shadow-md bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import shieldLogo from '@/assets/images/shield-logo.png'
const props = defineProps({
  players: { type: Array, required: true },
  selectedPlayerId: { type: Number, required: false, default: null },
  selectedPlayerName: { type: String, required: false, default: '' },
  steps: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
})

defineEmits([
  'select-player',
  'increment-steps',
  'decrement-steps',
  'set-steps',
  'move-player-forward',
  'move-player-backward',
  'reset-game',
])

// Style konsisten untuk semua pemain; not-selected mirip tombol langkah
const getPlayerBtnClass = (player) => {
  const base =
    'w-full px-3 py-2 rounded font-semibold text-left focus:outline-none disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-transform duration-300'
  if (player.finished) {
    return `${base} bg-gray-200 text-gray-600 border border-gray-300`
  }
  if (props.selectedPlayerId === player.id) {
    // Selected: lebih halus agar tidak terlalu kontras (putih lembut dengan aksen amber)
    return `${base} bg-white/80 text-amber-900 shadow-md ring-1 ring-amber-300 border border-amber-200 selected-zoom`
  }
  // Not selected: mirip tombol langkah default
  return `${base} bg-white/60 hover:bg-white/80 text-gray-800`
}

// Timer state (stopwatch sederhana)
const elapsed = ref(0) // detik
const isRunning = ref(false)
let timerId = null

const formattedTime = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return `${mm}:${ss}`
})

const startTimer = () => {
  if (timerId) return
  isRunning.value = true
  timerId = setInterval(() => {
    elapsed.value += 1
  }, 1000)
}

const pauseTimer = () => {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
  isRunning.value = false
}

const resetTimer = () => {
  pauseTimer()
  elapsed.value = 0
}

onBeforeUnmount(() => pauseTimer())

// Expose ke parent agar bisa mengontrol timer dari luar
defineExpose({ startTimer, pauseTimer, resetTimer })
</script>

<style scoped>
/* Animasi zoom untuk tombol pemain yang terpilih */
.selected-zoom {
  transform: scale(1.05);
}

@media (prefers-reduced-motion: reduce) {
  .selected-zoom {
    transform: scale(1.03);
    transition: none;
  }
}
</style>
