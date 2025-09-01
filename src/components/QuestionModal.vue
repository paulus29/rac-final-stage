<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

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

// State untuk Clue
const revealedCluesCount = ref(0)
const totalClues = computed(() =>
  Array.isArray(props.questionData.clues) ? props.questionData.clues.length : 0,
)
const revealedClues = computed(() =>
  (props.questionData.clues || []).slice(0, revealedCluesCount.value),
)
const canRevealMore = computed(() => revealedCluesCount.value < totalClues.value)

const revealNextClue = () => {
  if (canRevealMore.value) revealedCluesCount.value++
}

const revealAllClues = () => {
  revealedCluesCount.value = totalClues.value
}

// Status untuk menampilkan feedback setelah game master memberikan jawaban
const showFeedback = ref(false)
const isCorrect = ref(false)
const feedbackMessage = ref('')

// Timer state - 30 detik untuk menjawab pertanyaan
const timeLeft = ref(30)
const timerInterval = ref(null)
const isWarning = ref(false)
const isTimerActive = ref(true)
const isTimeOut = ref(false) // Status untuk menampilkan notifikasi waktu habis

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

// Fungsi ketika waktu habis
const handleTimeout = () => {
  stopTimer()
  isTimeOut.value = true
  feedbackMessage.value = '⏰ Waktu Habis!'
  showFeedback.value = true

  // Tidak melakukan apa-apa ketika waktu habis
  // Hanya menampilkan notifikasi, modal tetap terbuka
}

const handleGameMasterAnswer = (correct) => {
  stopTimer() // Hentikan timer ketika jawaban diberikan
  isCorrect.value = correct
  showFeedback.value = true

  if (correct) {
    feedbackMessage.value = '✅ Jawaban Benar!'
    setTimeout(() => {
      emit('answer-correct', props.cardPosition)
    }, 1500)
  } else {
    feedbackMessage.value = '❌ Jawaban Salah!'
    setTimeout(() => {
      emit('answer-wrong')
    }, 1500)
  }
}

const handleClose = () => {
  stopTimer() // Hentikan timer ketika modal ditutup
  emit('close-modal')
}

// Lifecycle hooks
onMounted(() => {
  // Reset jumlah clue yang ditampilkan saat modal dibuka
  revealedCluesCount.value = 0
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <!-- Modal Overlay Background dengan animasi -->
  <Transition name="modal" appear>
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
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
          <button
            @click="handleClose"
            class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            title="Tutup"
          >
            ×
          </button>
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
        </div>

        <!-- Clue Section -->
        <div v-if="!showFeedback && questionData.clues && questionData.clues.length" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-amber-900 text-lg sm:text-xl font-bold">💡 Clue</h3>
            <span class="text-xs font-semibold bg-amber-600 text-white px-2.5 py-1 rounded-full">
              {{ revealedCluesCount }} / {{ totalClues }}
            </span>
          </div>

          <div class="bg-white rounded-lg border border-amber-300 shadow-sm p-4">
            <ul v-if="revealedClues.length > 0" class="space-y-2">
              <li
                v-for="(clue, idx) in revealedClues"
                :key="idx"
                class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
              >
                <span class="text-amber-700 font-bold">#{{ idx + 1 }}</span>
                <span class="text-amber-900">{{ clue }}</span>
              </li>
            </ul>
            <div v-else class="text-sm text-amber-700 italic">Belum ada clue ditampilkan.</div>

            <div class="mt-4 flex flex-wrap gap-3 justify-center">
              <button
                @click="revealNextClue"
                :disabled="!canRevealMore"
                class="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                💡 Tampilkan Clue
              </button>
              <button
                @click="revealAllClues"
                :disabled="revealedCluesCount === totalClues || totalClues === 0"
                class="px-4 py-2.5 bg-amber-100 text-amber-800 rounded-lg font-semibold hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
              >
                🔎 Tampilkan Semua
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
        </div>

        <!-- Game Master Controls -->
        <div v-if="!showFeedback || isTimeOut" class="border-t border-amber-200 pt-4">
          <p class="text-sm text-gray-600 text-center mb-4">Apakah jawaban pemain benar?</p>
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
