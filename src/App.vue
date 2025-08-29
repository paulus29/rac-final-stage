<template>
  <div id="app">
    <header>
      <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />
      <h1>Vue App</h1>
    </header>

    <main>
      <!-- Konten utama aplikasi -->
    </main>
  </div>
</template>

<script setup>
// Script setup kosong
</script>

<style scoped>
#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

header {
  line-height: 1.5;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

main {
  margin-top: 2rem;
}
</style>
