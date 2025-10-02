<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMatchGameStore } from '@/stores/matchGame'

const props = defineProps({
  questionData: {
    type: Object,
    required: true,
    default: () => ({
      question: '',
      clues: [],
    }),
  },
  cardPosition: {
    type: Number,
    required: true,
  },
  currentPlayer: {
    type: Number,
    required: true,
  },
  playerName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['answer-correct', 'answer-wrong', 'close-modal'])

// Store untuk clue huruf hangman
const mg = useMatchGameStore()
const cardPoints = computed(() => mg.getCardPoints(props.cardPosition))

// Hangman: tampilkan jawaban dalam bentuk placeholder dengan _ dan huruf terungkap
const revealedIndices = computed(() => mg.getRevealedIndices(props.cardPosition))
const answerText = computed(() => (props.questionData?.answer || '').toString())
const displayChars = computed(() => {
  const ans = answerText.value
  const idxs = revealedIndices.value || []
  return ans.split('').map((ch, i) => {
    if (ch === ' ') return ' '
    if (/[A-Za-z0-9]/.test(ch)) {
      return idxs.includes(i) ? ch.toUpperCase() : '_'
    }
    return ch
  })
})
const canRevealLetter = computed(() => (revealedIndices.value?.length || 0) < 2)
const onRevealLetter = () => {
  if (canRevealLetter.value) mg.revealClue()
}

// Status untuk menampilkan feedback setelah game master memberikan jawaban
const showFeedback = ref(false)
const isCorrect = ref(false)
const feedbackMessage = ref('')
// Tampilkan jawaban benar pada salah ke-3
const showCorrectAnswer = ref(false)
const wrongCountBefore = computed(() => mg.getWrongCountForPosition(props.cardPosition))

// Timer state - 30 detik untuk menjawab pertanyaan
const timeLeft = ref(30)
const timerInterval = ref(null)
const isWarning = ref(false)
const isTimerActive = ref(true)
const isTimeOut = ref(false) // Status untuk menampilkan notifikasi waktu habis
// Minimize state
const isMinimized = ref(false)

// Fungsi untuk memulai timer countdown
const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }

  timerInterval.value = setInterval(() => {
    if (timeLeft.value > 0 && isTimerActive.value) {
      timeLeft.value--

      // Warning ketika 5 detik terakhir
      if (timeLeft.value <= 5 && timeLeft.value > 0) {
        isWarning.value = true
      }

      // Auto timeout ketika waktu habis
      if (timeLeft.value === 0) {
        handleTimeout()
      }
    }
  }, 1000)
}

// Fungsi untuk menghentikan timer
const stopTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  isTimerActive.value = false
}

// Fungsi ketika waktu habis: jangan melakukan apa-apa selain menghentikan timer
const handleTimeout = () => {
  stopTimer()
}

const handleGameMasterAnswer = (correct) => {
  stopTimer() // Hentikan timer ketika jawaban diberikan
  isCorrect.value = correct
  showFeedback.value = true

  if (correct) {
    feedbackMessage.value = '✅ Jawaban Benar!'
    showCorrectAnswer.value = true // Tampilkan jawaban benar
    setTimeout(() => {
      emit('answer-correct', props.cardPosition)
    }, 2000) // Tambah waktu untuk melihat jawaban
  } else {
    const willBeThirdWrong = (wrongCountBefore.value + 1) >= 3
    if (willBeThirdWrong) {
      feedbackMessage.value = '❌ Jawaban Salah!'
      showCorrectAnswer.value = true
      // Beri waktu untuk membaca jawaban yang benar, baru emit wrong agar store mengganti soal
      setTimeout(() => {
        emit('answer-wrong')
      }, 2500)
    } else {
      feedbackMessage.value = '❌ Jawaban Salah!'
      setTimeout(() => {
        emit('answer-wrong')
      }, 1500)
    }
  }
}

const handleClose = () => {
  stopTimer() // Hentikan timer ketika modal ditutup
  emit('close-modal')
}

// Lifecycle hooks
onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <!-- Modal Overlay Background dengan animasi -->
  <Transition name="modal" appear>
    <div v-if="!isMinimized" class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <!-- Modal Content dengan animasi scale -->
      <div
        class="bg-gradient-to-br from-amber-50 to-orange-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl max-w-xl w-full backdrop-blur-sm transform transition-all duration-300"
      >
        <!-- Header dengan nomor kartu dan pemain -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <div class="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
              Kartu #{{ cardPosition }}
            </div>
            <div class="text-amber-800 font-semibold">Giliran: {{ playerName }}</div>
          </div>
          <div class="flex items-center gap-2">
            <!-- Minimize (kiri) -->
            <button
              @click="isMinimized = true"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Minimize"
            >
              ▁
            </button>
            <!-- Close (kanan) -->
            <button
              @click="handleClose"
              class="text-amber-800 hover:text-amber-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-300"
              title="Tutup"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        

        <!-- Timer Display -->
        <div v-if="!showFeedback && !isTimeOut" class="mb-4">
          <div class="flex items-center justify-center gap-3 mb-2">
            <div
              class="text-2xl font-bold transition-all duration-300"
              :class="{
                'text-red-600 animate-pulse': isWarning,
                'text-amber-800': !isWarning,
              }"
            >
              ⏰ {{ timeLeft }}s
            </div>
          </div>

          <!-- Progress Bar -->
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

          <!-- Warning Message -->
          <div v-if="isWarning" class="text-center mt-2">
            <span class="text-red-600 font-bold text-sm animate-bounce">
              ⚠️ Waktu hampir habis!
            </span>
          </div>
        </div>

        <!-- Pertanyaan -->
        <div class="mb-6">
          <h3 class="text-amber-900 text-lg sm:text-xl font-bold mb-4 text-center">
            📝 Pertanyaan
          </h3>
          <div class="bg-white p-6 rounded-lg border border-amber-300 shadow-sm">
            <p class="text-gray-800 text-lg sm:text-xl font-medium text-center leading-relaxed">
              {{ questionData.question }}
            </p>
          </div>
          <!-- Card Points Display (moved below the question) -->
          <div class="mt-3 flex justify-center">
            <div
              class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300 text-sm font-semibold shadow-sm"
              title="Poin kartu saat ini"
            >
              <span class="text-base">🎯</span>
              <span>Poin Kartu:</span>
              <span class="tabular-nums font-bold">{{ cardPoints }}</span>
            </div>
          </div>
        </div>

        <!-- Jawaban (Hangman) + Clue Huruf -->
        <div v-if="!showFeedback" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-amber-900 text-lg sm:text-xl font-bold">🔤 Jawaban</h3>
            <span class="text-xs font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-full">
              {{ revealedIndices?.length || 0 }} / 2
            </span>
          </div>

          <div class="bg-white rounded-lg border border-amber-300 shadow-sm p-5">
            <div
              class="flex flex-wrap justify-center gap-2 font-mono text-xl sm:text-2xl tracking-widest text-amber-900"
            >
              <span v-for="(ch, i) in displayChars" :key="i" class="min-w-5 text-center">
                {{ ch === ' ' ? '\u00A0' : ch }}
              </span>
            </div>

            <div class="mt-4 flex justify-center">
              <button
                @click="onRevealLetter"
                :disabled="!canRevealLetter"
                class="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                💡 Tampilkan Clue
              </button>
            </div>
          </div>
        </div>

        <!-- Feedback Section (shows after game master decision or timeout) -->
        <div v-if="showFeedback" class="mb-6">
          <div
            class="p-4 rounded-lg text-center font-bold text-lg animate-pulse"
            :class="{
              'bg-green-100 text-green-800 border border-green-300': isCorrect && !isTimeOut,
              'bg-red-100 text-red-800 border border-red-300': !isCorrect && !isTimeOut,
              'bg-orange-100 text-orange-800 border border-orange-300': isTimeOut,
            }"
          >
            {{ feedbackMessage }}
          </div>
          <!-- Correct Answer Reveal on 3rd wrong -->
          <div v-if="showCorrectAnswer" class="mt-4">
            <div class="text-center text-amber-900 font-semibold mb-2">Jawaban yang benar:</div>
            <div
              class="bg-white p-4 rounded-lg border border-amber-300 shadow-sm text-center font-mono text-xl sm:text-2xl tracking-wider text-amber-900"
            >
              {{ answerText }}
            </div>
          </div>
        </div>

        <!-- Game Master Controls -->
        <div v-if="!showFeedback || isTimeOut" class="border-t border-amber-200 pt-4">
          <p class="text-sm text-gray-600 text-center mb-4">Apakah jawaban kelompok benar?</p>
          <div class="flex gap-4 justify-center">
            <button
              @click="handleGameMasterAnswer(true)"
              class="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              ✅ Benar
            </button>
            <button
              @click="handleGameMasterAnswer(false)"
              class="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              ❌ Salah
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isMinimized" class="fixed bottom-4 left-4 z-[60]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-amber-400 shadow-md text-amber-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>📝 Pertanyaan</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">Buka</span>
    </button>
  </div>
</template>

<style scoped>
/* Animasi modal dengan efek fade dan scale */
.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.3s ease-in;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
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
  transition: background-color 0.3s ease;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
