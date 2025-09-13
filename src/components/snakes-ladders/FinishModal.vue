<template>
  <Transition name="modal" appear>
    <div v-if="isVisible && !isMinimized" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <!-- Overlay tanpa blur (konsisten dengan QuestionChallengeModal) -->
      <div class="absolute inset-0" @click="$emit('close')"></div>

      <!-- Canvas confetti (hanya untuk juara 1) -->
      <canvas v-if="rank === 1" ref="canvasRef" class="absolute inset-0 pointer-events-none"></canvas>

      <!-- Card -->
      <div class="relative w-full max-w-md bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-600 rounded-xl p-6 shadow-2xl">
        <div class="flex justify-between items-center mb-3">
          <div class="bg-emerald-600 text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-2">
            🏁 Finish
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="isMinimized = true"
              class="text-gray-600 hover:text-gray-800 w-8 h-8 rounded-md bg-white/80 hover:bg-white flex items-center justify-center border border-emerald-200"
              title="Minimize"
            >▁</button>
          </div>
        </div>

        <div class="text-center space-y-3">
          <div class="text-2xl font-extrabold text-emerald-800">
            Selamat, {{ playerName }}!
          </div>
          <div class="text-lg font-semibold text-emerald-700">
            Kamu menempati peringkat
          </div>
          <div class="text-4xl font-black text-emerald-700 drop-shadow">#{{ rank }}</div>
        </div>

        <div class="mt-6 flex justify-center">
          <button
            @click="$emit('close')"
            class="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-lg"
          >Lanjut</button>
        </div>
      </div>
    </div>
  </Transition>
  <!-- Minimized pill (no overlay) -->
  <div v-if="isVisible && isMinimized" class="fixed bottom-4 left-4 z-[91]">
    <button
      @click="isMinimized = false"
      class="px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-emerald-400 shadow-md text-emerald-900 font-semibold flex items-center gap-2 hover:bg-white"
      title="Tampilkan kembali"
    >
      <span>🏁 Finish:</span>
      <span class="font-bold">{{ playerName }}</span>
      <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-white">Buka</span>
    </button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  isVisible: { type: Boolean, default: false },
  playerName: { type: String, default: '' },
  rank: { type: Number, default: 1 },
})

const canvasRef = ref(null)
let rafId = null
let startTime = 0
const isMinimized = ref(false)

const random = (min, max) => Math.random() * (max - min) + min

const colors = [
  '#34d399', // emerald-400
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#a855f7', // violet-500
]

function fireConfetti(durationMs = 2200) {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()

  const particles = Array.from({ length: 160 }).map(() => ({
    x: random(0, canvas.width),
    y: random(-50, -10),
    size: random(4, 8),
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: random(0, Math.PI * 2),
    speedX: random(-1, 1),
    speedY: random(2, 5),
    rotation: random(0, 360),
    rotationSpeed: random(-6, 6),
    alpha: 1,
  }))

  const draw = (t) => {
    if (!startTime) startTime = t
    const elapsed = t - startTime

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p) => {
      p.x += p.speedX
      p.y += p.speedY
      p.rotation += p.rotationSpeed
      // gravity
      p.speedY += 0.02
      // fade out towards the end
      if (elapsed > durationMs * 0.6) {
        p.alpha = Math.max(0, p.alpha - 0.02)
      }

      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.fillStyle = p.color
      // rectangle confetti
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      ctx.restore()
    })

    if (elapsed < durationMs) {
      rafId = requestAnimationFrame(draw)
    }
  }

  rafId = requestAnimationFrame(draw)
  window.addEventListener('resize', resize)
  // cleanup on end
  setTimeout(() => {
    window.removeEventListener('resize', resize)
  }, durationMs + 100)
}

const cleanup = () => {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = null
  startTime = 0
  const canvas = canvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    ctx && ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

watch(
  () => props.isVisible,
  (v) => {
    // reset minimized setiap kali visibilitas berubah
    isMinimized.value = false
    cleanup()
    if (v && props.rank === 1) {
      // fire confetti a moment after mount for smoother paint
      setTimeout(() => fireConfetti(2400), 50)
    }
  },
)

onMounted(() => {
  if (props.isVisible && props.rank === 1) setTimeout(() => fireConfetti(2400), 50)
})

onUnmounted(() => cleanup())
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-leave-active {
  transition: all 0.3s ease-in;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>
