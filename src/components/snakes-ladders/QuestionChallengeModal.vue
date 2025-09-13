<template>
  <Transition name="modal" appear>
    <div v-if="isVisible && !isMinimized" class="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <!-- Overlay tanpa blur -->
      <div class="absolute inset-0" @click="$emit('close')"></div>

      <!-- Konten modal bergaya match-game -->
      <div
        class="relative w-full max-w-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <div
              :class="[
                'text-white px-3 py-1 rounded-lg font-bold text-sm',
                type === 'optional' ? 'bg-amber-600' : 'bg-rose-600',
              ]"
            >
              {{ type === 'optional' ? 'Tantangan (?)' : 'Tantangan (!)' }}
            </div>
            <div class="text-amber-800 font-semibold">Giliran: {{ currentPlayerName }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="isMinimized = true"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Minimize"
            >▁</button>
          </div>
        </div>

        <!-- Step 1 (optional only): pilih penjawab -->
        <div v-if="type === 'optional' && !decided" class="space-y-4">
          <p class="text-gray-700">
            Kelompok yang mendarat dapat memilih menjawab sendiri atau melempar pertanyaan ke lawan.
          </p>

          <!-- Pilih lawan (opsional untuk lempar) -->
          <div class="bg-white rounded-lg p-3 border border-amber-300 shadow-sm">
            <p class="text-amber-900 font-semibold mb-2">Pilih lawan (untuk lempar):</p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="p in opponents"
                :key="p.id"
                @click="selectOpponent(p.id)"
                :class="[
                  'px-3 py-2 rounded-lg border font-semibold text-left',
                  selectedAnswererId === p.id
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white hover:bg-amber-50 border-amber-200 text-gray-800',
                ]"
              >
                {{ p.icon }} {{ p.name }}
              </button>
            </div>
            <p v-if="opponents.length === 0" class="mt-2 text-xs text-amber-700 italic">
              Tidak ada lawan tersedia (semua sudah finish). Kamu otomatis akan memilih Ambil.
            </p>
          </div>

          <!-- Aksi di bagian bawah, horizontal -->
          <div class="pt-1 flex gap-3 justify-center">
            <button
              @click="selectSelf"
              class="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 shadow-md"
            >Ambil</button>

            <button
              @click="confirmDecide"
              :disabled="!selectedAnswererId"
              class="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >Lempar</button>
          </div>
        </div>

        <!-- Step 2: pertanyaan + timer + penilaian -->
        <div v-else class="space-y-4">
          <!-- Timer -->
          <div v-if="!isTimeOut" class="mb-2">
            <div class="flex items-center justify-center gap-3 mb-2">
              <div
                class="text-2xl font-bold transition-all duration-300"
                :class="{ 'text-red-600 animate-pulse': isWarning, 'text-amber-800': !isWarning }"
              >
                ⏰ {{ timeLeft }}s
              </div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                class="h-full transition-all duration-1000 ease-linear"
                :class="{
                  'bg-red-500 animate-pulse': isWarning,
                  'bg-gradient-to-r from-green-500 to-amber-500': !isWarning,
                }"
                :style="{ width: (timeLeft / 30) * 100 + '%' }"
              ></div>
            </div>
            <div v-if="isWarning" class="text-center mt-2">
              <span class="text-red-600 font-bold text-sm animate-bounce"
                >⚠️ Waktu hampir habis!</span
              >
            </div>
          </div>

          <!-- Info penjawab -->
          <div class="flex items-center justify-between text-sm">
            <div class="text-gray-600">
              Penjawab: <span class="font-semibold">{{ answererLabel }}</span>
            </div>
            <div v-if="type === 'optional'" class="text-xs text-gray-500">
              (Dipilih pada tantangan "?")
            </div>
          </div>

          <!-- Pertanyaan -->
          <div class="bg-white p-5 rounded-lg border border-amber-300 shadow-sm">
            <p class="text-gray-800 text-lg sm:text-xl font-medium text-center leading-relaxed">
              {{ question }}
            </p>
          </div>

          <!-- Penilaian Game Master -->
          <div class="border-t border-amber-200 pt-3">
            <p class="text-sm text-gray-600 text-center mb-3">Apakah jawaban kelompok benar?</p>
            <div class="flex gap-4 justify-center">
              <button
                @click="handleJudge(true)"
                class="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                ✅ Benar
              </button>
              <button
                @click="handleJudge(false)"
                class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                ❌ Salah
              </button>
            </div>
            <p class="text-xs text-gray-500 text-center mt-2">
              Benar → maju 4 langkah. Salah → mundur 4 langkah.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isVisible && isMinimized" class="fixed bottom-4 left-4 z-[81]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-amber-400 shadow-md text-amber-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>❓ Tantangan</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">Buka</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  type: { type: String, default: 'optional' }, // 'optional' | 'forced'
  players: { type: Array, required: true },
  currentPlayerId: { type: Number, default: null },
  question: { type: String, default: '' },
})

const emit = defineEmits(['close', 'decide', 'judge'])

// State pemilihan penjawab
const decided = ref(false)
const selectedAnswererId = ref(null)
const isMinimized = ref(false)

// Timer state (mengadopsi pola match-game)
const timeLeft = ref(30)
const timerInterval = ref(null)
const isWarning = ref(false)
const isTimerActive = ref(true)
const isTimeOut = ref(false)

// Hanya lawan yang belum selesai yang dapat dilempar tantangan
const opponents = computed(() =>
  props.players.filter((p) => p.id !== props.currentPlayerId && !p.finished),
)
const currentPlayerName = computed(
  () => props.players.find((p) => p.id === props.currentPlayerId)?.name || '-',
)

const answererLabel = computed(() => {
  const p = props.players.find((x) => x.id === selectedAnswererId.value)
  return p ? `${p.icon} ${p.name}` : '-'
})

// Timer helpers
const startTimer = () => {
  stopTimer()
  isTimerActive.value = true
  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0 && isTimerActive.value) {
      timeLeft.value--
      if (timeLeft.value <= 5 && timeLeft.value > 0) {
        isWarning.value = true
      }
      if (timeLeft.value === 0) {
        handleTimeout()
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  isTimerActive.value = false
}

const resetTimer = () => {
  stopTimer()
  timeLeft.value = 30
  isWarning.value = false
  isTimeOut.value = false
  isTimerActive.value = true
}

const handleTimeout = () => {
  stopTimer()
  isTimeOut.value = true
  // Tetap biarkan game master memutuskan benar/salah setelah waktu habis
}

// Lifecycle: kelola open/close
watch(
  () => props.isVisible,
  (v) => {
    // reset minimized saat modal dibuka/ditutup
    isMinimized.value = false
    if (!v) {
      // Close/reset
      stopTimer()
      decided.value = false
      selectedAnswererId.value = props.type === 'forced' ? props.currentPlayerId : null
    } else {
      // Open
      resetTimer()
      selectedAnswererId.value = props.type === 'forced' ? props.currentPlayerId : null
      decided.value = props.type === 'forced'
      // Mulai timer segera jika forced, atau nanti setelah decide untuk optional
      if (decided.value) startTimer()
      // Jika optional dan tidak ada lawan tersedia, auto pilih diri sendiri
      if (props.type === 'optional' && !decided.value && opponents.value.length === 0) {
        selectedAnswererId.value = props.currentPlayerId
        decided.value = true
        emit('decide', selectedAnswererId.value)
        resetTimer()
        startTimer()
      }
    }
  },
  { immediate: true },
)

const handleClose = () => {
  stopTimer()
  emit('close')
}

const selectSelf = () => {
  selectedAnswererId.value = props.currentPlayerId
  decided.value = true
  emit('decide', selectedAnswererId.value)
  resetTimer()
  startTimer()
}

const selectOpponent = (id) => {
  selectedAnswererId.value = id
}

const confirmDecide = () => {
  if (!selectedAnswererId.value) return
  decided.value = true
  emit('decide', selectedAnswererId.value)
  resetTimer()
  startTimer()
}

const handleJudge = (isCorrect) => {
  if (!selectedAnswererId.value) return
  stopTimer()
  emit('judge', { answererId: selectedAnswererId.value, isCorrect })
}

onUnmounted(() => stopTimer())
</script>

<style scoped>
/* Animasi modal konsisten dengan match-game */
.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 0.3s ease-in;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
