<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  questionData: {
    type: Object,
    required: true,
    default: () => ({
      question: '',
      optionA: '',
      optionB: '',
      correctAnswer: 'a'
    })
  },
  cardPosition: {
    type: Number,
    required: true
  },
  currentPlayer: {
    type: Number,
    required: true
  },
  playerName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['answer-correct', 'answer-wrong', 'close-modal'])

// Status untuk menampilkan feedback setelah game master memberikan jawaban
const showFeedback = ref(false)
const isCorrect = ref(false)
const feedbackMessage = ref('')

const handleGameMasterAnswer = (correct) => {
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
  emit('close-modal')
}
</script>

<template>
  <!-- Modal Overlay Background - Transparent to show gameboard -->
  <div class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
    <!-- Modal Content -->
    <div
      class="bg-gradient-to-br from-amber-50 to-orange-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl max-w-xl w-full backdrop-blur-sm"
    >
      <!-- Header dengan nomor kartu dan pemain -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <div class="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
            Kartu #{{ cardPosition }}
          </div>
          <div class="text-amber-800 font-semibold">
            Giliran: {{ playerName }}
          </div>
        </div>
        <button
          @click="handleClose"
          class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          title="Tutup"
        >
          ×
        </button>
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

      <!-- Feedback Section (shows after game master decision) -->
      <div v-if="showFeedback" class="mb-6">
        <div 
          class="p-4 rounded-lg text-center font-bold text-lg"
          :class="{
            'bg-green-100 text-green-800 border border-green-300': isCorrect,
            'bg-red-100 text-red-800 border border-red-300': !isCorrect
          }"
        >
          {{ feedbackMessage }}
        </div>
      </div>

      <!-- Game Master Controls -->
      <div v-if="!showFeedback" class="border-t border-amber-200 pt-4">
        <h4 class="text-amber-800 font-semibold mb-3 text-center">🎯 Game Master</h4>
        <p class="text-sm text-gray-600 text-center mb-4">
          Apakah jawaban pemain benar?
        </p>
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

      <!-- Instructions -->
      <div class="mt-4 text-xs text-gray-600 text-center bg-amber-50 p-2 rounded border border-amber-200">
        💡 Pemain membaca pertanyaan dan menjawab secara lisan. Game Master menentukan apakah jawaban benar atau salah.
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
