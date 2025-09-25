<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  playerName: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: false,
    default: 0,
  },
  matches: {
    type: Number,
    required: false,
    default: 0,
  },
  // Event payload: { playerId, amount, ts }
  pointGain: {
    type: Object,
    required: false,
    default: null,
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

// Smooth number animation for points
const animatedPoints = ref(props.points || 0)
const displayPoints = computed(() => Math.round(animatedPoints.value))

watch(
  () => props.points,
  (newVal, oldVal) => {
    const from = Number.isFinite(oldVal) ? oldVal : 0
    const to = Number.isFinite(newVal) ? newVal : 0
    if (from === to) return
    const duration = 700
    const start = performance.now()
    const animate = (now) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      animatedPoints.value = from + (to - from) * eased
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  },
  { immediate: true },
)

// Floating +points animation
const showGain = ref(false)
const gainAmount = ref(0)
let gainTimeoutId = null

watch(
  () => props.pointGain?.ts,
  () => {
    if (!props.pointGain) return
    gainAmount.value = props.pointGain.amount || 0
    showGain.value = false
    if (gainTimeoutId) clearTimeout(gainTimeoutId)
    // next frame to restart transition
    requestAnimationFrame(() => {
      showGain.value = true
      gainTimeoutId = setTimeout(() => {
        showGain.value = false
      }, 1000)
    })
  },
)
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
      <!-- Bagian Poin -->
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
          Poin
        </div>
        <div class="relative select-none">
          <div
            :class="[
              'text-2xl font-bold tabular-nums text-center w-full px-10 sm:px-12',
              isActive ? 'text-white' : 'text-slate-800',
            ]"
          >
            {{ displayPoints }}
          </div>
          <span
            :class="[
              'absolute right-1 top-0 -translate-y-1/2 inline-block font-extrabold text-xs sm:text-sm px-2 py-0.5 rounded-full shadow transition-all duration-500',
              showGain ? 'opacity-100' : 'opacity-0',
              isActive
                ? 'bg-yellow-300 text-amber-900 border border-yellow-500'
                : 'bg-amber-200 text-amber-900 border border-amber-400',
            ]"
          >
            +{{ gainAmount }}
          </span>
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

      <!-- Bagian Match (tie-breaker) -->
      <div
        :class="[
          'flex justify-between items-center px-2 py-1 rounded-md',
          isActive ? 'bg-white/15' : 'bg-slate-200/40',
        ]"
      >
        <span :class="['text-xs font-medium', isActive ? 'text-lime-100' : 'text-slate-600']">
          Match Score:
        </span>
        <span
          :class="[
            'font-bold text-sm px-2 py-1 rounded-full',
            isActive ? 'bg-white/20 text-white' : 'bg-slate-300/50 text-slate-700',
          ]"
        >
          {{ matches }}
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
