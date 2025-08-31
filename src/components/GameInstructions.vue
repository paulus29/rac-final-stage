<template>
  <div
    class="bg-gradient-to-br from-amber-50 to-green-50 bg-opacity-95 border-2 border-amber-600 rounded-xl p-3 sm:p-4 mt-4 sm:mt-6 text-left shadow-xl"
  >
    <h3 class="text-amber-800 text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-center">
      Aturan Bermain
    </h3>

    <ul class="list-disc pl-3 sm:pl-4 space-y-1 sm:space-y-2 text-amber-900 text-xs sm:text-sm">
      <li class="leading-relaxed">Permainan dimainkan bergantian oleh 2 pemain.</li>
      <li class="leading-relaxed">Terdapat 14 kartu (7 pasang angka yang sama).</li>
      <li class="leading-relaxed">
        Setiap pemain HANYA memiliki <strong>2 kesempatan</strong> (attempt) per giliran.
      </li>
      <li class="leading-relaxed">
        Setelah <strong>2 kesempatan</strong> digunakan, giliran
        <strong>otomatis berpindah</strong> ke pemain lain,
        <strong>meskipun menemukan pasangan</strong>.
      </li>
      <li class="leading-relaxed">
        Jika jawaban benar pada kesempatan pertama, Pemain diberikan pilihan untuk menggunakan
        kesempatan kedua atau melempar ke pemain lain.
      </li>
      <li class="leading-relaxed">
        Jika jawaban <strong>salah pada kesempatan pertama</strong>, giliran langsung berpindah ke
        pemain lain.
      </li>
      <li class="leading-relaxed">
        Setiap pasangan yang ditemukan menambah skor <strong>+1</strong> untuk pemain yang
        menemukan.
      </li>
      <li class="leading-relaxed">
        Permainan berakhir saat <strong>7 pasang</strong> telah ditemukan. Pemain dengan skor
        tertinggi menang.
      </li>
    </ul>
  </div>
</template>
