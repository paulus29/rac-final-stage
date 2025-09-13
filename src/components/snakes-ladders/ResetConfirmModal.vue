<template>
  <div>
    <!-- Modal normal (tidak minimized) -->
    <div
      v-if="isVisible && !isMinimized"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90]"
      @click.self="$emit('close')"
    >
      <div
        class="relative bg-white/20 backdrop-blur-md rounded-2xl p-8 border border-white/30 max-w-md w-full mx-4 animate-bounce-in"
      >
        <!-- Header actions -->
        <div class="absolute top-3 right-3 flex items-center gap-2">
          <button
            @click="isMinimized = true"
            class="text-gray-700 hover:text-gray-900 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-white/40"
            title="Minimize"
          >▁</button>
        </div>

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

    <!-- Minimized pill -->
    <div v-if="isVisible && isMinimized" class="fixed bottom-4 left-4 z-[91]">
      <button
        @click="isMinimized = false"
        class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-amber-400 shadow-md text-amber-900 font-semibold flex items-center gap-2 hover:bg-white"
        title="Tampilkan kembali"
      >
        <span>⚠️ Konfirmasi Reset</span>
        <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">Buka</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
})

defineEmits(['close', 'cancel', 'confirm'])

const isMinimized = ref(false)

watch(
  () => props.isVisible,
  () => {
    // setiap kali modal dibuka/ditutup, reset state minimize
    isMinimized.value = false
  },
)
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
