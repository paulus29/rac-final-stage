<script setup>
defineProps({
  playerName: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  attempts: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  currentTurnAttempts: {
    type: Number,
    default: 0
  }
})
</script>

<template>
  <div
    :class="[
      'px-4 py-3 rounded-lg shadow-lg transition-all duration-300 min-w-[160px] max-w-[200px]',
      isActive
        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-2 border-green-500'
        : 'bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 text-amber-900 border-2 border-amber-300',
    ]"
  >
    <div class="font-bold text-base mb-2 text-center">{{ playerName }}</div>
    <div class="text-sm text-center space-y-1">
      <div>
        Skor: <span class="font-semibold">{{ score }}</span>
      </div>
      <div>
        Percobaan: <span class="font-semibold">{{ attempts }}</span>
      </div>
      <div v-if="isActive && currentTurnAttempts > 0" class="text-xs">
        Giliran: <span class="font-semibold">{{ currentTurnAttempts }}/2</span>
      </div>
    </div>
  </div>
</template>
