<script setup>
import { ref, computed } from 'vue'

const player1Name = ref('')
const player2Name = ref('')

// Validation computed properties
const isPlayer1Valid = computed(() => player1Name.value.trim().length > 0)
const isPlayer2Valid = computed(() => player2Name.value.trim().length > 0)
const areNamesUnique = computed(() => 
  player1Name.value.trim().toLowerCase() !== player2Name.value.trim().toLowerCase()
)
const isFormValid = computed(() => 
  isPlayer1Valid.value && isPlayer2Valid.value && areNamesUnique.value
)

const emit = defineEmits(['start-game'])

const startGame = () => {
  if (isFormValid.value) {
    emit('start-game', {
      player1Name: player1Name.value.trim(),
      player2Name: player2Name.value.trim()
    })
  }
}
</script>

<template>
  <!-- Modal Overlay Background -->
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <!-- Modal Content -->
    <div class="bg-blue-50 bg-opacity-95 border-2 border-blue-500 rounded-xl p-6 shadow-2xl max-w-md w-full backdrop-filter backdrop-blur-lg">
      <!-- Title -->
      <h2 class="text-blue-600 text-2xl font-bold mb-6 text-center">
        🎮 Setup Pemain 🎮
      </h2>

      <!-- Player 1 Input -->
      <div class="mb-4">
        <label class="block text-blue-800 font-semibold mb-2">
          Nama Player 1:
        </label>
        <input
          v-model="player1Name"
          type="text"
          placeholder="Masukkan nama Player 1"
          class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          :class="{ 
            'border-red-400 bg-red-50': player1Name.length > 0 && !isPlayer1Valid,
            'border-green-400 bg-green-50': isPlayer1Valid 
          }"
          maxlength="20"
        />
        <p v-if="player1Name.length > 0 && !isPlayer1Valid" class="text-red-500 text-sm mt-1">
          Nama Player 1 tidak boleh kosong
        </p>
      </div>

      <!-- Player 2 Input -->
      <div class="mb-4">
        <label class="block text-blue-800 font-semibold mb-2">
          Nama Player 2:
        </label>
        <input
          v-model="player2Name"
          type="text"
          placeholder="Masukkan nama Player 2"
          class="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          :class="{ 
            'border-red-400 bg-red-50': player2Name.length > 0 && !isPlayer2Valid,
            'border-green-400 bg-green-50': isPlayer2Valid 
          }"
          maxlength="20"
        />
        <p v-if="player2Name.length > 0 && !isPlayer2Valid" class="text-red-500 text-sm mt-1">
          Nama Player 2 tidak boleh kosong
        </p>
      </div>

      <!-- Name Uniqueness Validation -->
      <div v-if="isPlayer1Valid && isPlayer2Valid && !areNamesUnique" class="mb-4">
        <p class="text-red-500 text-sm text-center bg-red-100 p-2 rounded">
          ⚠️ Nama kedua pemain tidak boleh sama!
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="isFormValid" class="mb-4">
        <p class="text-green-600 text-sm text-center bg-green-100 p-2 rounded">
          ✅ Siap untuk memulai permainan!
        </p>
      </div>

      <!-- Start Button -->
      <div class="flex justify-center">
        <button
          @click="startGame"
          :disabled="!isFormValid"
          class="px-8 py-3 rounded-lg font-bold text-white transition-all duration-300 shadow-lg"
          :class="isFormValid 
            ? 'bg-green-500 hover:bg-green-600 cursor-pointer' 
            : 'bg-gray-400 cursor-not-allowed'"
        >
          🚀 Mulai Permainan
        </button>
      </div>

      <!-- Instructions -->
      <div class="mt-6 text-center">
        <p class="text-blue-600 text-sm">
          Masukkan nama untuk kedua pemain sebelum memulai permainan memory matching!
        </p>
      </div>
    </div>
  </div>
</template>
