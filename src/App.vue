<template>
  <div id="app" class="relative min-h-screen">
    <!-- Logo RAC di pojok kiri atas (disembunyikan di game ular tangga) -->
    <div v-if="!isSnakesLaddersPage" class="fixed -top-25 left-4 z-50">
      <img
        src="@/assets/images/rac-logo.png"
        alt="RAC Logo"
        class="w-72 h-72 md:w-96 md:h-96 lg:w-[432px] lg:h-[432px] object-contain drop-shadow-lg hover:scale-105 transition-transform duration-200"
      />
    </div>

    <RouterView />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const isSnakesLaddersPage = computed(() => {
  return route.path === '/stage-3'
})
</script>

<style>
/* Ensure the logo doesn't interfere with page content */
#app {
  padding-top: 0;
}
</style>
