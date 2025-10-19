<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center p-4"
    style="background-image: url('./src/assets/images/background-rac-1.png')"
  >
    <div class="max-w-4xl w-full">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-6xl font-bold text-white mb-4 drop-shadow-lg">Final Stage RAC</h1>
      </div>

      <!-- Game Selection Cards -->
      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Match Game Card -->
        <RouterLink
          to="/stage-2"
          class="group bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
        >
          <div class="text-center">
            <div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
              🃏
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">Stage 2: Match Game</h3>
            <div
              class="bg-emerald-500 text-white px-6 py-3 rounded-full font-semibold group-hover:bg-emerald-600 transition-colors duration-300 inline-block"
            >
              Mainkan Sekarang
            </div>
          </div>
        </RouterLink>

        <!-- Snakes & Ladders Card -->
        <RouterLink
          to="/stage-3"
          class="group bg-white/20 backdrop-blur-md rounded-3xl p-8 border border-white/30 hover:bg-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
        >
          <div class="text-center">
            <div class="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
              🐍
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">Stage 3: Ular Tangga</h3>
            <div
              class="bg-purple-500 text-white px-6 py-3 rounded-full font-semibold group-hover:bg-purple-600 transition-colors duration-300 inline-block"
            >
              Mainkan Sekarang
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useSoundEffects } from '@/composables/useSoundEffects'

// Pastikan semua background music berhenti saat di menu utama
const { stopBackgroundMusic, stopMatchGameBackgroundMusic } = useSoundEffects()

onMounted(() => {
  // Stop semua background music saat kembali ke home
  stopBackgroundMusic()
  stopMatchGameBackgroundMusic()
})
</script>
