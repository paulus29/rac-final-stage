<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 max-w-md w-full mx-4 animate-bounce-in"
    >
      <!-- Icon -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-4">⚠️</div>
        <h3 class="text-2xl font-bold text-white mb-2">Konfirmasi Reset</h3>
        <p class="text-white/80 text-lg">
          Apakah Anda yakin ingin reset game? Semua progress akan hilang!
        </p>
      </div>

      <!-- Buttons -->
      <div class="grid grid-cols-2 gap-4">
        <button
          @click="$emit('cancel')"
          class="bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
        >
          ❌ Tidak
        </button>
        <button
          @click="$emit('confirm')"
          class="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
        >
          ✅ Ya, Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isVisible: { type: Boolean, default: false }
})

defineEmits(['close', 'cancel', 'confirm'])
</script>

<style scoped>
.animate-bounce-in {
  animation: bounceIn 0.3s ease-out;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  70% {
    transform: scale(0.9);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
