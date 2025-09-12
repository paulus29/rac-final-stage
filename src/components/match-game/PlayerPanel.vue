<script setup>
defineProps({
  playerName: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  attempts: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  currentTurnAttempts: {
    type: Number,
    default: 0,
  },
})
</script>

<template>
  <div
    :class="[
      'px-4 py-3 rounded-xl shadow-lg transition-all duration-500 min-w-[180px] max-w-[220px] h-fit self-center relative',
      isActive
        ? 'bg-gradient-to-br from-lime-500 to-green-600 text-white border-2 border-amber-700 shadow-black/50 transform scale-110'
        : 'bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 text-slate-700 border-2 border-amber-600 shadow-black/30',
    ]"
  >
    <!-- Indikator aktif dengan glow effect -->
    <div
      v-if="isActive"
      class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"
    ></div>
    <div v-if="isActive" class="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full"></div>

    <div
      class="font-bold text-base mb-3 text-center px-2 py-2 rounded-lg"
      :class="
        isActive
          ? 'bg-white/20 text-white border-b-2 border-white/50'
          : 'bg-slate-200/50 text-slate-700 border-b-2 border-amber-600'
      "
    >
      {{ playerName }}
    </div>
    <div class="text-center space-y-2">
      <!-- Bagian Skor dengan tampilan yang lebih menarik -->
      <div
        :class="[
          'rounded-lg p-3 shadow-inner backdrop-blur-sm',
          isActive
            ? 'bg-white/25 border border-white/30'
            : 'bg-white/60 border border-amber-600/50',
        ]"
      >
        <div
          :class="[
            'text-xs uppercase tracking-wide font-medium mb-1',
            isActive ? 'text-lime-100' : 'text-slate-500',
          ]"
        >
          Skor
        </div>
        <div :class="['text-2xl font-bold', isActive ? 'text-white' : 'text-slate-800']">
          {{ score }}
        </div>
      </div>

      <!-- Bagian Percobaan -->
      <div
        :class="[
          'flex justify-between items-center px-2 py-1 rounded-md',
          isActive ? 'bg-white/15' : 'bg-slate-200/40',
        ]"
      >
        <span :class="['text-xs font-medium', isActive ? 'text-lime-100' : 'text-slate-600']">
          Percobaan:
        </span>
        <span
          :class="[
            'font-bold text-sm px-2 py-1 rounded-full',
            isActive ? 'bg-white/20 text-white' : 'bg-slate-300/50 text-slate-700',
          ]"
        >
          {{ attempts }}
        </span>
      </div>

      <!-- Indikator Kesempatan - selalu tampil -->
      <div
        :class="[
          'rounded-lg py-2 px-3 text-xs flex justify-between items-center backdrop-blur-sm transition-all duration-300',
          isActive
            ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-300/30'
            : 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20',
        ]"
      >
        <span :class="['font-medium', isActive ? 'text-yellow-100' : 'text-gray-600']">
          Kesempatan:
        </span>
        <div class="flex items-center gap-2">
          <div
            class="w-4 h-4 rounded-full border-2 transition-all duration-300"
            :class="[
              isActive && currentTurnAttempts >= 1
                ? 'bg-yellow-300 border-yellow-200 shadow-lg shadow-yellow-400/50'
                : isActive
                  ? 'bg-transparent border-yellow-300/50'
                  : 'bg-transparent border-gray-400/30',
            ]"
          ></div>
          <div
            class="w-4 h-4 rounded-full border-2 transition-all duration-300"
            :class="[
              isActive && currentTurnAttempts >= 2
                ? 'bg-yellow-300 border-yellow-200 shadow-lg shadow-yellow-400/50'
                : isActive
                  ? 'bg-transparent border-yellow-300/50'
                  : 'bg-transparent border-gray-400/30',
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
