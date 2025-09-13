<template>
  <div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30">
    <h2 class="text-2xl font-bold text-white mb-4 text-center">Game Control</h2>

    <!-- Player Selection -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Pilih Pemain:</label>
      <div class="grid grid-cols-1 gap-2">
        <button
          v-for="player in players"
          :key="player.id"
          @click="$emit('select-player', player.id)"
          :disabled="disabled || player.finished"
          :class="getPlayerBtnClass(player)"
        >
          <div class="flex items-center justify-between">
            <div class="font-semibold">
              {{ player.icon }} {{ player.name }}
            </div>
            <span v-if="player.finished" class="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold">
              🏁 #{{ player.rank }}
            </span>
          </div>
          <span v-if="player.finished" class="text-sm block opacity-80">🏁 Selesai #{{ player.rank }}</span>
          <span v-else class="text-sm block opacity-80">Posisi: {{ player.position }}</span>
        </button>
      </div>
    </div>

    <!-- Step Controls -->
    <div class="mb-6">
      <label class="block text-white/90 font-semibold mb-2">Langkah:</label>
      <div class="grid grid-cols-3 gap-1 mb-4">
        <button
          v-for="n in 6"
          :key="n"
          @click="$emit('set-steps', n)"
          :disabled="disabled"
          :class="[
            'py-2 rounded font-semibold transition-all',
            steps === n
              ? 'bg-amber-500 text-white'
              : 'bg-white/70 hover:bg-white/90 text-gray-800 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed',
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
        :disabled="!selectedPlayerId || disabled"
        class="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬆️ Maju
      </button>
      <button
        @click="$emit('move-player-backward')"
        :disabled="!selectedPlayerId || disabled"
        class="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
      >
        ⬇️ Mundur
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  players: { type: Array, required: true },
  selectedPlayerId: { type: Number, required: false, default: null },
  selectedPlayerName: { type: String, required: false, default: '' },
  steps: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
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

// Style konsisten untuk semua pemain; not-selected mirip tombol langkah
const getPlayerBtnClass = (player) => {
  const base =
    'w-full px-3 py-2 rounded font-semibold transition-all duration-200 text-left focus:outline-none disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed'
  if (player.finished) {
    return `${base} bg-gray-200 text-gray-600 border border-gray-300`
  }
  if (props.selectedPlayerId === player.id) {
    // Selected: tema seragam (amber) seperti langkah terpilih
    return `${base} bg-amber-500 text-white shadow-lg ring-1 ring-white/40`
  }
  // Not selected: mirip tombol langkah default
  return `${base} bg-white/70 hover:bg-white/90 text-gray-800`
}
</script>
