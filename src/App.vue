<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center p-5 relative"
    style="background-image: url('./src/assets/images/background-rac-1.png')"
  >
    <div class="relative z-10">
      <GameBoard />
    </div>
  </div>
</template>

<script>
import GameBoard from './components/GameBoard.vue'

export default {
  name: 'App',
  components: {
    GameBoard,
  },
}
</script>

<style></style>
