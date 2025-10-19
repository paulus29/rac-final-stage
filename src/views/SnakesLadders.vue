<template>
  <SnakesLaddersBoard />
</template>

<script setup>
import { onBeforeUnmount } from 'vue'
import { useSoundEffects } from '@/composables/useSoundEffects'
import SnakesLaddersBoard from '../components/snakes-ladders/SnakesLaddersBoard.vue'

// Pastikan background music berhenti saat view di-unmount (navigasi ke halaman lain)
const { stopBackgroundMusic } = useSoundEffects()

onBeforeUnmount(() => {
  stopBackgroundMusic()
})
</script>
