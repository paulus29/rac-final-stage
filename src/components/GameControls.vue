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
      class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
    >
      {{ gameStarted ? (gameCompleted ? 'Main Lagi' : 'Game Berjalan') : 'Mulai Game' }}
    </button>

    <!-- Tombol Reset -->
    <button
      @click="$emit('reset-game')"
      class="px-3 sm:px-6 py-1.5 sm:py-2 border-none rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-lg text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]"
    >
      Reset
    </button>
  </div>
</template>
