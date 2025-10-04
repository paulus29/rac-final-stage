<template>
  <Transition name="modal" appear>
    <div
      v-if="isVisible && !isMinimized"
      class="fixed inset-0 z-[85] flex items-center justify-center p-4"
    >
      <!-- Overlay (click disabled - tidak bisa close modal dengan klik backdrop) -->
      <div class="absolute inset-0"></div>

      <div
        class="relative w-full max-w-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-600 rounded-xl p-5 shadow-2xl overflow-hidden"
      >
        <!-- Header -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-3">
            <div class="bg-amber-600 text-white px-3 py-1 rounded-lg font-bold text-sm">Hadiah</div>
            <div class="text-amber-800 font-semibold">Untuk: {{ currentPlayerName }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="isMinimized = true"
              class="text-gray-600 hover:text-gray-800 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-amber-200"
              title="Minimize"
            >
              ▁
            </button>
          </div>
        </div>

        <p class="text-gray-700 mb-3">
          Pilih hadiah karena menjawab <span class="font-semibold">benar</span>:
        </p>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <div class="flex gap-3 justify-center">
            <button
              @click="chooseShield"
              :disabled="isShieldMax"
              :title="isShieldMax ? 'Shield sudah maksimum (2)' : ''"
              class="min-w-[160px] px-4 py-3 rounded-lg font-bold text-white shadow-md bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🛡️ Ambil Shield + Maju 1 Langkah
            </button>

            <button
              @click="toggleShoot"
              class="min-w-[160px] px-4 py-3 rounded-lg font-bold text-white shadow-md bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800"
            >
              🎯 Serang Kelompok Lain
            </button>

            <button
              @click="chooseAdvance"
              class="min-w-[160px] px-4 py-3 rounded-lg font-bold text-white shadow-md bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              ➡️ Maju 4 Langkah
            </button>
          </div>

          <!-- Shoot target selector -->
          <div
            v-if="showShoot"
            class="mt-1 bg-white rounded-lg p-3 border border-amber-300 shadow-sm"
          >
            <p class="text-amber-900 font-semibold mb-2">Pilih target:</p>
            <div class="grid grid-cols-1 gap-2">
              <button
                v-for="p in shootableOpponents"
                :key="p.id"
                @click="selectTarget(p.id)"
                :class="[
                  'px-3 py-2 rounded-lg border font-semibold text-left flex items-center gap-2',
                  targetId === p.id
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white hover:bg-amber-50 border-amber-200 text-gray-800',
                ]"
              >
                <img :src="getPlayerImage(p.id)" :alt="p.name" class="w-6 h-6" />
                {{ p.name }}
                <span v-if="p.shield > 0" class="text-xs ml-auto">🛡️ x{{ p.shield }}</span>
              </button>
            </div>
            <div class="flex justify-center mt-3">
              <button
                @click="confirmShoot"
                :disabled="!targetId"
                class="min-w-[160px] px-5 py-2.5 rounded-lg font-semibold text-white shadow-md bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 hover:from-fuchsia-700 hover:to-fuchsia-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Konfirmasi Serang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isVisible && isMinimized" class="fixed bottom-4 left-4 z-[86]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-amber-400 shadow-md text-amber-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>🎁 Hadiah:</span>
      <span class="font-bold">{{ currentPlayerName }}</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white">Buka</span>
    </button>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import player1Img from '@/assets/images/player-1.png'
import player2Img from '@/assets/images/player-2.png'
import player3Img from '@/assets/images/player-3.png'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  players: { type: Array, required: true },
  currentPlayerId: { type: Number, default: null },
})

const emit = defineEmits(['close', 'choose'])

// Player image mapping
const playerImages = {
  1: player1Img,
  2: player2Img,
  3: player3Img,
}

const getPlayerImage = (playerId) => playerImages[playerId] || player1Img

const currentPlayer = computed(() => props.players.find((p) => p.id === props.currentPlayerId))
const currentPlayerName = computed(() => currentPlayer.value?.name || '-')
const isShieldMax = computed(() => (currentPlayer.value?.shield || 0) >= 2)

const showShoot = ref(false)
const targetId = ref(null)
const isMinimized = ref(false)

const shootableOpponents = computed(() =>
  props.players.filter((p) => p.id !== props.currentPlayerId && !p.finished),
)

const chooseShield = () => {
  if (isShieldMax.value) return
  emit('choose', { action: 'shield' })
}

const chooseAdvance = () => {
  emit('choose', { action: 'advance' })
}

const toggleShoot = () => {
  showShoot.value = !showShoot.value
}

const selectTarget = (id) => {
  targetId.value = id
}

const confirmShoot = () => {
  if (!targetId.value) return
  emit('choose', { action: 'shoot', targetId: targetId.value })
}

// Reset state when modal opens/closes to ensure shoot selector is hidden by default
watch(
  () => props.isVisible,
  () => {
    // Pastikan setiap kali visibility berubah (terutama saat dibuka),
    // modal tidak dalam keadaan minimized dan selector tembak tersembunyi.
    isMinimized.value = false
    showShoot.value = false
    targetId.value = null
  },
)
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 0.25s ease-in;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-6px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(6px);
}
</style>
