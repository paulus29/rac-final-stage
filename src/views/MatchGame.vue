<template>
  <div class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" style="background-image: url('./src/assets/images/background-rac-1.png')">
    <GameBoard />
  </div>
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useSoundEffects } from '@/composables/useSoundEffects'
import GameBoard from '../components/match-game/GameBoard.vue'

// Pastikan background music berhenti saat view di-unmount (navigasi ke halaman lain)
const { stopMatchGameBackgroundMusic } = useSoundEffects()

onBeforeUnmount(() => {
  stopMatchGameBackgroundMusic()
})
</script>
