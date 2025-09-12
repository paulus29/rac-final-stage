<script setup>
import { ref, computed } from 'vue'

const player1Name = ref('')
const player2Name = ref('')

const isPlayer1Valid = computed(() => player1Name.value.trim().length > 0)
const isPlayer2Valid = computed(() => player2Name.value.trim().length > 0)
const areNamesUnique = computed(
  () => player1Name.value.trim().toLowerCase() !== player2Name.value.trim().toLowerCase(),
)
const isFormValid = computed(
  () => isPlayer1Valid.value && isPlayer2Valid.value && areNamesUnique.value,
)

const emit = defineEmits(['start-game'])

const startGame = () => {
  if (isFormValid.value) {
    emit('start-game', {
      player1Name: player1Name.value.trim(),
      player2Name: player2Name.value.trim(),
    })
  }
}
</script>

<template>
  <!-- Modal Overlay Background dengan animasi -->
  <Transition name="modal" appear>
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <!-- Modal Content dengan animasi scale -->
      <div
        class="bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-6 shadow-2xl max-w-md w-full backdrop-filter backdrop-blur-lg transform transition-all duration-300"
      >
      <h2 class="text-amber-800 text-2xl font-bold mb-6 text-center">Stage 2 Final</h2>

      <div class="mb-4">
        <label class="block text-amber-900 font-semibold mb-2"> Nama Player 1: </label>
        <input
          v-model="player1Name"
          type="text"
          placeholder="Masukkan nama Player 1"
          class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors bg-white"
          :class="{
            'border-red-400 bg-red-50': player1Name.length > 0 && !isPlayer1Valid,
            'border-green-500 bg-green-50': isPlayer1Valid,
          }"
          maxlength="20"
        />
        <p v-if="player1Name.length > 0 && !isPlayer1Valid" class="text-red-600 text-sm mt-1">
          Nama Player 1 tidak boleh kosong
        </p>
      </div>

      <div class="mb-4">
        <label class="block text-amber-900 font-semibold mb-2"> Nama Player 2: </label>
        <input
          v-model="player2Name"
          type="text"
          placeholder="Masukkan nama Player 2"
          class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 transition-colors bg-white"
          :class="{
            'border-red-400 bg-red-50': player2Name.length > 0 && !isPlayer2Valid,
            'border-green-500 bg-green-50': isPlayer2Valid,
          }"
          maxlength="20"
        />
        <p v-if="player2Name.length > 0 && !isPlayer2Valid" class="text-red-600 text-sm mt-1">
          Nama Player 2 tidak boleh kosong
        </p>
      </div>

      <div v-if="isPlayer1Valid && isPlayer2Valid && !areNamesUnique" class="mb-4">
        <p class="text-red-600 text-sm text-center bg-red-100 p-2 rounded border border-red-200">
          ⚠️ Nama kedua pemain tidak boleh sama!
        </p>
      </div>

      <div v-if="isFormValid" class="mb-4">
        <p
          class="text-green-700 text-sm text-center bg-green-100 p-2 rounded border border-green-200"
        >
          ✅ Siap untuk memulai permainan!
        </p>
      </div>

      <div class="flex justify-center">
        <button
          @click="startGame"
          :disabled="!isFormValid"
          class="px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 shadow-lg"
          :class="
            isFormValid
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          "
        >
          🚀 Mulai Permainan
        </button>
      </div>
      </div>
    </div>
  </Transition>
</template>

<style>
/* Animasi modal dengan efek fade dan scale */
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

/* Animasi background overlay */
.modal-enter-from .fixed {
  background-color: rgba(0, 0, 0, 0);
}

.modal-enter-active .fixed {
  transition: background-color 0.4s ease;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
