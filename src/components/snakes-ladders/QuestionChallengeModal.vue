<template>
  <Transition name="modal" appear>
    <div
      v-if="isVisible && !isMinimized"
      class="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <!-- Overlay tanpa blur -->
      <div class="absolute inset-0" @click="handleBackdrop"></div>

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
            <!-- Minimize (left) -->
            <button
              @click="isMinimized = true"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Minimize"
            >
              ▁
            </button>
            <!-- Close (X) button on the right -->
            <button
              v-if="canDismiss"
              @click="handleClose"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Tutup"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Step 1 (optional only): pilih penjawab -->
        <div v-if="type === 'optional' && !decided" class="space-y-4">
          <p class="text-gray-700">Ambil tantangan atau lempar ke lawan?</p>

          <!-- Pilih lawan (opsional untuk lempar) -->
          <div class="bg-white rounded-lg p-3 border border-amber-300 shadow-sm">
            <p class="text-amber-900 font-semibold mb-2">Pilih lawan (untuk lempar):</p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="p in opponents"
                :key="p.id"
                @click="selectOpponent(p.id)"
                :class="[
                  'px-3 py-2 rounded-lg border font-semibold text-left flex items-center gap-2',
                  selectedAnswererId === p.id
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white hover:bg-amber-50 border-amber-200 text-gray-800',
                ]"
              >
                <img :src="getPlayerImage(p.id)" :alt="p.name" class="w-6 h-6" />
                {{ p.name }}
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
            >
              Ambil
            </button>

            <button
              @click="confirmDecide"
              :disabled="!selectedAnswererId"
              class="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Lempar
            </button>
          </div>
        </div>

        <!-- Step 1 (forced only): konfirmasi buka (baik marker '!' maupun checkpoint) -->
        <div v-else-if="type === 'forced' && !decided" class="space-y-4">
          <p class="text-gray-700 text-center">
            {{ source === 'checkpoint' ? 'Checkpoint! Buka pertanyaan sekarang?' : 'Buka pertanyaan sekarang?' }}
          </p>
          <div class="pt-1 flex gap-3 justify-center">
            <button
              @click="confirmOpenForced"
              class="min-w-[120px] px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-rose-700 shadow-md"
            >
              Buka Soal
            </button>
          </div>
        </div>

        <!-- Step 2: pertanyaan + timer + pilihan ganda -->
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
          <div v-else class="mb-2 text-center">
            <span class="text-red-600 font-semibold">⏰ Waktu habis</span>
          </div>

          <!-- Info penjawab -->
          <div class="flex items-center justify-between text-sm">
            <div class="text-gray-600 flex items-center gap-2">
              Penjawab:
              <img v-if="answererImage" :src="answererImage" :alt="answererLabel" class="w-5 h-5" />
              <span class="font-semibold">{{ answererLabel }}</span>
            </div>
          </div>

          <!-- Pertanyaan -->
          <div class="bg-white p-5 rounded-lg border border-amber-300 shadow-sm">
            <p class="text-gray-800 text-lg sm:text-xl font-medium text-center leading-relaxed">
              {{ question && question.question ? question.question : 'Memuat pertanyaan...' }}
            </p>
          </div>

          <!-- Pilihan Ganda A/B/C/D -->
          <div class="border-t border-amber-200 pt-3">
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="(opt, idx) in question?.options || []"
                :key="idx"
                :disabled="isOptionLocked || isDisabled(idx)"
                @click="chooseOption(idx)"
                :class="[
                  'px-4 py-3 rounded-lg border font-semibold text-left transition-all',
                  isOptionLocked
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    : isDisabled(idx)
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                      : 'bg-white hover:bg-amber-50 border-amber-200 text-gray-800',
                ]"
              >
                <span class="inline-flex items-center gap-2">
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-md font-bold text-white bg-amber-600"
                    >{{ letterLabel(idx) }}</span
                  >
                  <span class="flex-1">{{ opt }}</span>
                </span>
              </button>
            </div>
            <!-- Feedback benar/salah -->
            <div v-if="resultStatus" class="mt-3 text-center" aria-live="polite">
              <span
                v-if="resultStatus === 'correct'"
                class="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold"
                >✅ Jawaban benar!</span
              >
              <span
                v-else-if="resultStatus === 'incorrect'"
                class="inline-block px-3 py-1 rounded-md bg-rose-100 text-rose-700 font-semibold"
                >❌ Jawaban salah</span
              >
            </div>
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
import player1Img from '@/assets/images/player-1.png'
import player2Img from '@/assets/images/player-2.png'
import player3Img from '@/assets/images/player-3.png'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  type: { type: String, default: 'optional' }, // 'optional' | 'forced'
  players: { type: Array, required: true },
  currentPlayerId: { type: Number, default: null },
  // question object: { id, question, options: string[], correctIndex: number }
  question: { type: Object, default: null },
  // indices of options that should be disabled due to previous wrong answers on this cell
  disabledOptions: { type: Array, default: () => [] },
  source: { type: String, default: 'marker' },
})

const emit = defineEmits(['close', 'decide', 'judge'])

// Player image mapping
const playerImages = {
  1: player1Img,
  2: player2Img,
  3: player3Img,
}

const getPlayerImage = (playerId) => playerImages[playerId] || player1Img

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
const isOptionLocked = ref(false)
const resultStatus = ref('') // '', 'correct', 'incorrect'

// Izinkan modal ditutup (X/backdrop) untuk semua sumber, termasuk checkpoint
const canDismiss = computed(() => true)

// Hanya lawan yang belum selesai yang dapat dilempar tantangan
const opponents = computed(() =>
  props.players.filter((p) => p.id !== props.currentPlayerId && !p.finished),
)
const currentPlayerName = computed(
  () => props.players.find((p) => p.id === props.currentPlayerId)?.name || '-',
)

const answererLabel = computed(() => {
  const p = props.players.find((x) => x.id === selectedAnswererId.value)
  return p ? p.name : '-'
})

const answererImage = computed(() => {
  const p = props.players.find((x) => x.id === selectedAnswererId.value)
  return p ? getPlayerImage(p.id) : null
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
  // Jangan auto-penalti dan tetap izinkan menjawab setelah waktu habis.
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
      isOptionLocked.value = false
      resultStatus.value = ''
    } else {
      // Open
      resetTimer()
      selectedAnswererId.value = props.type === 'forced' ? props.currentPlayerId : null
      // Untuk sel '!' (forced), mulai pada step konfirmasi (belum decided)
      decided.value = props.type === 'forced' ? false : false
      // Timer akan dimulai saat pengguna memilih 'Buka' pada forced, atau setelah decide pada optional
      // Jika optional dan tidak ada lawan tersedia, auto pilih diri sendiri
      if (props.type === 'optional' && !decided.value && opponents.value.length === 0) {
        selectedAnswererId.value = props.currentPlayerId
        decided.value = true
        emit('decide', selectedAnswererId.value)
        resetTimer()
        startTimer()
      }
      isOptionLocked.value = false
      resultStatus.value = ''
    }
  },
  { immediate: true },
)

const handleClose = () => {
  stopTimer()
  emit('close')
}

const handleBackdrop = () => {
  if (!canDismiss.value) return
  handleClose()
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

// Konfirmasi buka pada sel '!' (forced)
const confirmOpenForced = () => {
  // Penjawab selalu pemain yang mendarat
  selectedAnswererId.value = props.currentPlayerId
  decided.value = true
  emit('decide', selectedAnswererId.value)
  resetTimer()
  startTimer()
}

// Pilih opsi A/B/C/D
const letterLabel = (idx) => ['A', 'B', 'C', 'D'][idx] || '?'

const chooseOption = (idx) => {
  if (!selectedAnswererId.value || isOptionLocked.value || isDisabled(idx)) return
  isOptionLocked.value = true
  stopTimer()
  const isCorrect =
    props.question && typeof props.question.correctIndex === 'number'
      ? idx === props.question.correctIndex
      : false
  resultStatus.value = isCorrect ? 'correct' : 'incorrect'
  // Emit penilaian; parent akan menutup modal. Tidak menandai jawaban benar saat salah.
  emit('judge', { answererId: selectedAnswererId.value, isCorrect, selectedIndex: idx })
}

const isDisabled = (idx) =>
  Array.isArray(props.disabledOptions) && props.disabledOptions.includes(idx)

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
