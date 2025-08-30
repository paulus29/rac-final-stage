<script setup>
// === KOMPONEN KARTU PERMAINAN ===
// Komponen individual untuk setiap kartu dalam game memory

// === DEFINISI PROPS ===
// Props yang diterima dari komponen parent (GameBoard)
const props = defineProps({
  // Angka yang ditampilkan di kartu (1-7)
  number: {
    type: Number,
    required: true,
  },

  // Posisi kartu dalam grid (1-14)
  position: {
    type: Number,
    required: true,
  },

  // Status apakah kartu sedang terbuka/dibalik
  isFlipped: {
    type: Boolean,
    default: false,
  },

  // Status apakah kartu sudah berhasil dicocokkan
  isMatched: {
    type: Boolean,
    default: false,
  },

  // Status apakah kartu sedang dinonaktifkan (tidak bisa diklik)
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

// === DEFINISI EVENTS ===
// Event yang akan dipancarkan ke komponen parent
const emit = defineEmits(['card-click'])

// === FUNGSI-FUNGSI KOMPONEN ===

/**
 * Fungsi yang menangani klik pada kartu
 * Melakukan validasi sebelum mengirim event ke parent
 * Hanya akan mengirim event jika kartu dalam kondisi valid untuk diklik
 */
const handleClick = () => {
  // Validasi: kartu hanya bisa diklik jika:
  // - Tidak sedang dinonaktifkan
  // - Belum terbuka
  // - Belum dicocokkan
  if (!props.isDisabled && !props.isFlipped && !props.isMatched) {
    // Kirim event 'card-click' dengan nomor kartu ke parent component
    emit('card-click', props.number)
  }
}
</script>

<template>
  <!-- === CONTAINER UTAMA KARTU === -->
  <!-- Container luar dengan efek 3D perspective dan hover -->
  <div
    class="w-20 h-20 sm:w-24 sm:h-24 cursor-pointer transition-transform duration-200 hover:scale-105"
    :class="{
      'cursor-not-allowed': isDisabled,
      'hover:scale-100': isDisabled || isFlipped || isMatched,
      'opacity-60': isMatched,
    }"
    @click="handleClick"
    style="perspective: 1000px"
  >
    <!-- Kelas CSS yang digunakan:
         - w-20 h-20: Ukuran kartu 80x80px pada mobile
         - sm:w-24 sm:h-24: Ukuran kartu 96x96px pada tablet/desktop
         - cursor-pointer: Menampilkan pointer saat hover
         - transition-transform: Animasi smooth untuk transformasi
         - duration-200: Durasi animasi 200ms
         - hover:scale-105: Efek zoom 105% saat hover
         - cursor-not-allowed: Cursor dilarang jika kartu disabled
         - hover:scale-100: Tidak ada efek zoom jika disabled/flipped/matched
         - opacity-60: Transparansi 60% jika kartu sudah dicocokkan
         - perspective: 1000px: Memberikan efek 3D depth untuk flip animation
    -->
    <!-- === CONTAINER FLIP ANIMATION === -->
    <!-- Container yang menangani efek flip 3D -->
    <div
      class="relative w-full h-full text-center transition-transform duration-600"
      :class="{ 'transform rotate-y-180': isFlipped || isMatched }"
      style="transform-style: preserve-3d"
    >
      <!-- Properti CSS untuk flip animation:
           - relative: Positioning untuk child elements
           - w-full h-full: Mengisi penuh container parent
           - text-center: Teks di tengah
           - transition-transform: Animasi smooth untuk rotasi
           - duration-600: Durasi flip 600ms
           - transform rotate-y-180: Rotasi 180° pada sumbu Y jika flipped/matched
           - transform-style: preserve-3d: Mempertahankan efek 3D pada child elements
      -->

      <!-- === SISI DEPAN KARTU (TERTUTUP) === -->
      <!-- Sisi yang terlihat saat kartu belum dibuka -->
      <div
        class="absolute w-full h-full flex items-center justify-center border-2 border-gray-800 rounded-lg shadow-md bg-gradient-to-br from-lime-500 to-green-600 text-white text-xl sm:text-3xl font-bold"
        style="backface-visibility: hidden"
      >
        <!-- Properti CSS sisi depan:
             - absolute: Positioning absolut untuk overlay
             - w-full h-full: Mengisi penuh container
             - flex items-center justify-center: Centering konten
             - border-2 border-gray-800: Border abu-abu tebal
             - rounded-lg: Sudut melengkung
             - shadow-md: Drop shadow sedang
             - bg-gradient-to-br from-lime-500 to-green-600: Gradient hijau
             - text-white: Teks putih
             - text-xl sm:text-3xl: Ukuran teks responsif
             - font-bold: Teks tebal
             - backface-visibility: hidden: Menyembunyikan sisi belakang saat flip
        -->

        <!-- Nomor posisi kartu di pojok kiri atas -->
        <span
          class="absolute top-1 left-1 text-sm sm:text-base font-bold text-white bg-black bg-opacity-50 rounded px-1"
          >{{ position }}</span
        >
        <!-- Tanda tanya sebagai indikator kartu tertutup -->
        <span>?</span>
      </div>

      <!-- === SISI BELAKANG KARTU (TERBUKA) === -->
      <!-- Sisi yang terlihat saat kartu dibuka -->
      <div
        class="absolute w-full h-full flex items-center justify-center border-2 border-gray-800 rounded-lg shadow-md bg-gradient-to-br from-pink-400 to-red-500 text-white text-xl sm:text-3xl font-bold transform rotate-y-180"
        style="backface-visibility: hidden"
      >
        <!-- Properti CSS sisi belakang:
             - Sama seperti sisi depan, tetapi:
             - bg-gradient-to-br from-pink-400 to-red-500: Gradient merah-pink
             - transform rotate-y-180: Sudah dirotasi 180° secara default
             - backface-visibility: hidden: Menyembunyikan saat tidak aktif
        -->

        <!-- Nomor posisi kartu di pojok kiri atas -->
        <span
          class="absolute top-1 left-1 text-sm sm:text-base font-bold text-white bg-black bg-opacity-50 rounded px-1"
          >{{ position }}</span
        >
        <!-- Angka kartu yang sebenarnya -->
        <span>{{ number }}</span>
      </div>
    </div>
  </div>
</template>

<!-- === STYLING CSS KOMPONEN === -->
<style scoped>
/* === KELAS CUSTOM UNTUK FLIP ANIMATION === */

/* Kelas untuk rotasi 180 derajat pada sumbu Y */
/* Digunakan untuk membalik kartu secara horizontal */
.rotate-y-180 {
  transform: rotateY(180deg);
}

/* Kelas untuk durasi transisi 600ms */
/* Memberikan animasi yang smooth dan tidak terlalu cepat */
.duration-600 {
  transition-duration: 0.6s;
}

/* === CATATAN TEKNIS === */
/* 
 * Efek flip 3D bekerja dengan kombinasi:
 * 1. perspective: 1000px pada container utama
 * 2. transform-style: preserve-3d pada container flip
 * 3. backface-visibility: hidden pada kedua sisi kartu
 * 4. transform: rotateY(180deg) untuk membalik
 * 5. transition-duration: 0.6s untuk animasi smooth
 * 
 * Kedua sisi kartu (depan dan belakang) diposisikan secara absolut
 * di tempat yang sama, tetapi sisi belakang sudah dirotasi 180°.
 * Ketika container flip dirotasi, sisi yang terlihat akan bertukar.
 */
</style>
