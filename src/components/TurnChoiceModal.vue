<script setup>
const props = defineProps({
  playerName: {
    type: String,
    required: true
  },
  currentTurnAttempts: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['continue-turn', 'end-turn'])

const handleContinueTurn = () => {
  emit('continue-turn')
}

const handleEndTurn = () => {
  emit('end-turn')
}
</script>

<template>
  <!-- Modal Overlay Background - Transparent to show gameboard -->
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <!-- Modal Content -->
    <div
      class="bg-gradient-to-br from-amber-50 to-orange-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-4 sm:p-6 shadow-2xl max-w-xl w-full backdrop-blur-sm"
    >
      <!-- Header dengan pemain dan status -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <div class="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
            Strategi
          </div>
          <div class="text-amber-800 font-semibold">Giliran: {{ playerName }}</div>
        </div>
      </div>

      <!-- Pesan Utama -->
      <div class="mb-6">
        <h3 class="text-amber-900 text-lg sm:text-xl font-bold mb-4 text-center">🎯 Pilihan Strategi</h3>
        <div class="bg-white p-6 rounded-lg border border-amber-300 shadow-sm">
          <p class="text-gray-800 text-lg font-medium text-center leading-relaxed mb-3">
            Anda berhasil menjawab pertanyaan dengan benar!
          </p>
          <p class="text-amber-700 text-sm text-center font-semibold">
            Kesempatan: {{ currentTurnAttempts }}/2
          </p>
        </div>
      </div>

      <!-- Pilihan Aksi -->
      <div class="border-t border-amber-200 pt-4">
        <p class="text-sm text-gray-600 text-center mb-4">
          {{ currentTurnAttempts >= 2 ? 'Kesempatan habis! Giliran harus diakhiri.' : 'Pilih strategi Anda:' }}
        </p>
        <div class="flex gap-4 justify-center">
          <button
            v-if="currentTurnAttempts < 2"
            @click="handleContinueTurn"
            class="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            🎮 Pilih Kotak Lain
          </button>
          <button
            @click="handleEndTurn"
            class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg flex items-center gap-2"
          >
            🏁 Akhiri Giliran
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fade animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
