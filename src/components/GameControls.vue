<script setup>
defineProps({
  gameStarted: {
    type: Boolean,
    required: true
  },
  gameCompleted: {
    type: Boolean,
    required: true
  }
})

defineEmits(['start-game', 'reset-game'])
</script>

<template>
  <div class="flex justify-center gap-2 sm:gap-3 flex-wrap">
    <!-- Tombol Mulai Game / Main Lagi -->
    <button
      @click="$emit('start-game')"
      :disabled="gameStarted && !gameCompleted"
      class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
    >
      {{ gameStarted ? (gameCompleted ? 'Main Lagi' : 'Game Berjalan') : 'Mulai Game' }}
    </button>

    <!-- Tombol Reset -->
    <button
      @click="$emit('reset-game')"
      class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-red-500 text-white hover:bg-red-600 shadow-lg text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]"
    >
      Reset
    </button>
  </div>
</template>
