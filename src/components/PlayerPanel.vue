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
  }
})
</script>

<template>
  <div
    :class="[
      'px-4 py-3 rounded-lg shadow-lg transition-all duration-300 min-w-[160px] max-w-[200px]',
      isActive
        ? 'bg-green-500 text-white'
        : 'bg-white bg-opacity-95 text-gray-800',
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
    </div>
  </div>
</template>
