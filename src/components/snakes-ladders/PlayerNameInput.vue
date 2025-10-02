<script setup>
import { ref, computed } from 'vue'
import player1Img from '@/assets/images/player-1.png'
import player2Img from '@/assets/images/player-2.png'
import player3Img from '@/assets/images/player-3.png'

const emit = defineEmits(['start-game'])

// Dev flag untuk dipakai di template (hindari import.meta di template)
const isDev = import.meta.env.DEV

// Input names
const name1 = ref('')
const name2 = ref('')
const name3 = ref('')

// Validation
const isValid1 = computed(() => name1.value.trim().length > 0)
const isValid2 = computed(() => name2.value.trim().length > 0)
const isValid3 = computed(() => name3.value.trim().length > 0)
const uniqueAll = computed(() => {
  const normalized = [name1.value, name2.value, name3.value].map((n) =>
    (n || '').trim().toLowerCase().replace(/\s+/g, ' '),
  )
  if (normalized.some((n) => n.length === 0)) return false
  return new Set(normalized).size === 3
})
const isFormValid = computed(
  () => isValid1.value && isValid2.value && isValid3.value && uniqueAll.value,
)

// Minimize removed

const startGame = () => {
  if (!isFormValid.value) {
    console.log('[SL PlayerNameInput] Start blocked:', {
      isValid1: isValid1.value,
      isValid2: isValid2.value,
      isValid3: isValid3.value,
      uniqueAll: uniqueAll.value,
      n1: name1.value,
      n2: name2.value,
      n3: name3.value,
    })
    return
  }
  emit('start-game', {
    player1Name: name1.value.trim(),
    player2Name: name2.value.trim(),
    player3Name: name3.value.trim(),
  })
}
</script>

<template>
  <Transition name="modal" appear>
    <div
      class="fixed inset-0 flex items-center justify-center z-[999] p-4 pointer-events-auto"
      @click.stop
      @mousedown.stop
    >
      <div
        class="relative bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 border-2 border-amber-600 rounded-2xl p-6 shadow-2xl max-w-md w-full backdrop-filter backdrop-blur-lg transform transition-all duration-300 pointer-events-auto"
      >
        <h2 class="text-amber-800 text-2xl font-extrabold mb-6 text-center">Stage 3 Final</h2>

        <form @submit.prevent="startGame">
          <!-- Player 1 -->
          <div class="mb-4">
            <label class="block text-amber-900 font-semibold mb-2 flex items-center gap-2">
              <img :src="player1Img" alt="Player 1" class="w-6 h-6" />
              Nama Kelompok 1
            </label>
            <input
              v-model="name1"
              type="text"
              placeholder="Masukkan nama Kelompok 1"
              class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors bg-white"
              :class="{
                'border-red-400 bg-red-50': name1.length > 0 && !isValid1,
                'border-green-500 bg-green-50': isValid1,
              }"
              maxlength="20"
              @keyup.enter="startGame"
            />
            <p v-if="name1.length > 0 && !isValid1" class="text-red-600 text-sm mt-1">
              Nama Kelompok 1 tidak boleh kosong
            </p>
          </div>

          <!-- Player 2 -->
          <div class="mb-4">
            <label class="block text-amber-900 font-semibold mb-2 flex items-center gap-2">
              <img :src="player2Img" alt="Player 2" class="w-6 h-6" />
              Nama Kelompok 2
            </label>
            <input
              v-model="name2"
              type="text"
              placeholder="Masukkan nama Kelompok 2"
              class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors bg-white"
              :class="{
                'border-red-400 bg-red-50': name2.length > 0 && !isValid2,
                'border-green-500 bg-green-50': isValid2,
              }"
              maxlength="20"
              @keyup.enter="startGame"
            />
            <p v-if="name2.length > 0 && !isValid2" class="text-red-600 text-sm mt-1">
              Nama Kelompok 2 tidak boleh kosong
            </p>
          </div>

          <!-- Player 3 -->
          <div class="mb-4">
            <label class="block text-amber-900 font-semibold mb-2 flex items-center gap-2">
              <img :src="player3Img" alt="Player 3" class="w-6 h-6" />
              Nama Kelompok 3
            </label>
            <input
              v-model="name3"
              type="text"
              placeholder="Masukkan nama Kelompok 3"
              class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors bg-white"
              :class="{
                'border-red-400 bg-red-50': name3.length > 0 && !isValid3,
                'border-green-500 bg-green-50': isValid3,
              }"
              maxlength="20"
              @keyup.enter="startGame"
            />
            <p v-if="name3.length > 0 && !isValid3" class="text-red-600 text-sm mt-1">
              Nama Kelompok 3 tidak boleh kosong
            </p>
          </div>

          <!-- Unique check -->
          <div v-if="isValid1 && isValid2 && isValid3 && !uniqueAll" class="mb-4">
            <p
              class="text-red-600 text-sm text-center bg-red-100 p-2 rounded border border-red-200"
            >
              ⚠️ Nama kelompok harus berbeda semua
            </p>
          </div>

          <!-- Start button -->
          <div class="flex justify-center">
            <button
              type="submit"
              @click.stop
              class="relative z-[200] px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 shadow-lg pointer-events-auto"
              :class="
                isFormValid
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              "
            >
              🚀 Mulai Permainan
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 0.3s ease-in;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(-30px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>
