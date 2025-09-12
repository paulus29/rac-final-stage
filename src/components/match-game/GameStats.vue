<script setup>
defineProps({
  timer: {
    type: Number,
    required: true
  },
  formatTime: {
    type: Function,
    required: true
  }
})
</script>

<template>
  <div class="mt-2 sm:mt-3 mb-3 sm:mb-4">
    <div class="flex justify-center gap-2 sm:gap-3 flex-wrap">
      <div class="bg-gradient-to-r from-amber-100 to-green-100 bg-opacity-95 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-bold text-amber-900 shadow-lg text-xs sm:text-sm border border-amber-300">
        <span>Waktu: {{ formatTime(timer) }}</span>
      </div>
    </div>
  </div>
</template>
