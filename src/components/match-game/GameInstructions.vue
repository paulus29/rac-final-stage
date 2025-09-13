<template>
  <!-- Modal Overlay -->
  <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
    <!-- Modal Content -->
    <div
      class="bg-gradient-to-br from-amber-50 to-green-50 border-2 border-amber-600 rounded-xl p-4 sm:p-6 text-left shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <h3 class="text-amber-800 text-xl sm:text-2xl font-bold mb-4 text-center">Aturan Bermain</h3>

      <ul class="list-disc pl-4 sm:pl-6 space-y-2 sm:space-y-3 text-amber-900 text-sm sm:text-base">
        <li class="leading-relaxed">Permainan dimainkan bergantian oleh 2 kelompok.</li>
        <li class="leading-relaxed">Terdapat 14 kartu (7 pasang angka yang sama).</li>
        <li class="leading-relaxed">
          Setiap kelompok HANYA memiliki <strong>2 kesempatan</strong> (attempt) per giliran.
        </li>
        <li class="leading-relaxed">
          Setelah <strong>2 kesempatan</strong> digunakan, giliran
          <strong>otomatis berpindah</strong> ke kelompok lain,
          <strong>meskipun menemukan pasangan</strong>.
        </li>
        <li class="leading-relaxed">
          Jika jawaban benar pada kesempatan pertama, Kelompok diberikan pilihan untuk menggunakan
          kesempatan kedua atau melempar ke kelompok lain.
        </li>
        <li class="leading-relaxed">
          Jika jawaban <strong>salah pada kesempatan pertama</strong>, giliran langsung berpindah ke
          kelompok lain.
        </li>
        <li class="leading-relaxed">
          Setiap pasangan yang ditemukan menambah skor <strong>+1</strong> untuk kelompok yang
          menemukan.
        </li>
        <li class="leading-relaxed">
          Permainan berakhir saat <strong>7 pasang</strong> telah ditemukan. Kelompok dengan skor
          tertinggi menang.
        </li>
      </ul>

      <!-- Tombol Mulai Permainan -->
      <div class="flex justify-center mt-6">
        <button
          @click="$emit('start-game')"
          class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          🎮 Mulai Permainan
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['start-game'])
</script>
