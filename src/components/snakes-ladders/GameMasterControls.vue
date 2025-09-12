<template>
  <div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
    <h2 class="text-2xl font-bold text-white mb-4 text-center">🎮 Game Master</h2>

    <!-- Player Selection -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Pilih Pemain:</label>
      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="player in players"
          :key="player.id"
          @click="$emit('select-player', player.id)"
          :class="[
            'p-3 rounded-lg font-semibold transition-all duration-200 text-white',
            selectedPlayerId === player.id
              ? `bg-${player.color}-500 shadow-lg scale-105`
              : `bg-${player.color}-400/50 hover:bg-${player.color}-400/70`,
          ]"
        >
          {{ player.icon }} {{ player.name }}
          <span class="text-sm block opacity-80">Posisi: {{ player.position }}</span>
        </button>
      </div>
    </div>

    <!-- Step Controls -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Langkah:</label>
      <div class="flex items-center gap-2 mb-3">
        <button
          @click="$emit('decrement-steps')"
          :disabled="steps <= 1"
          class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white w-10 h-10 rounded-full font-bold transition-colors"
        >
          -
        </button>
        <div class="bg-white/90 text-gray-800 px-4 py-2 rounded-lg font-bold text-center min-w-16">
          {{ steps }}
        </div>
        <button
          @click="$emit('increment-steps')"
          :disabled="steps >= 6"
          class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white w-10 h-10 rounded-full font-bold transition-colors"
        >
          +
        </button>
      </div>
      <div class="grid grid-cols-3 gap-1 mb-4">
        <button
          v-for="n in 6"
          :key="n"
          @click="$emit('set-steps', n)"
          :class="[
            'py-2 rounded font-semibold transition-all',
            steps === n ? 'bg-amber-500 text-white' : 'bg-white/70 hover:bg-white/90 text-gray-800',
          ]"
        >
          {{ n }}
        </button>
      </div>
    </div>

    <!-- Move Buttons -->
    <div class="grid grid-cols-2 gap-3 mb-3">
      <button
        @click="$emit('move-player-forward')"
        :disabled="!selectedPlayerId"
        class="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬆️ Maju
      </button>
      <button
        @click="$emit('move-player-backward')"
        :disabled="!selectedPlayerId"
        class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬇️ Mundur
      </button>
    </div>

    <!-- Reset Button -->
    <button
      @click="$emit('reset-game')"
      class="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition-colors"
    >
      🔄 Reset Game
    </button>
  </div>
</template>

<script setup>
defineProps({
  players: { type: Array, required: true },
  selectedPlayerId: { type: Number, required: false, default: null },
  selectedPlayerName: { type: String, required: false, default: '' },
  steps: { type: Number, required: true },
})

defineEmits([
  'select-player',
  'increment-steps',
  'decrement-steps',
  'set-steps',
  'move-player-forward',
  'move-player-backward',
  'reset-game',
])
</script>
