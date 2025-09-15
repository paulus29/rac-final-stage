<template>
  <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 w-full">
    <div
      ref="boardContainer"
      :class="['grid gap-1 w-full max-w-2xl mx-auto min-w-0 relative', { shake: isShaking }]"
      :style="{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(cell, index) in boardCells"
        :key="index"
        :class="[
          'relative aspect-square border-2 border-white/30 rounded-lg flex items-center justify-center min-w-0 min-h-0 overflow-hidden transform-gpu transition-transform duration-200 ease-out hover:scale-[1.04] hover:shadow-md',
          getCellBackground(cell.number),
          getMarkerRingClass(cell.number),
          getStartFinishRingClass(cell.number),
        ]"
      >
        <!-- Cell Number -->
        <div
          class="absolute top-1 left-1 z-30 text-xs font-bold text-gray-700 bg-white/80 rounded px-1"
        >
          {{ cell.number }}
        </div>

        <!-- Challenge Marker Watermark (centered, subtle) -->
        <div
          v-if="markers && markers[cell.number]"
          class="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
          :title="
            markers[cell.number] === 'optional' ? 'Tantangan opsional (?)' : 'Tantangan wajib (!)'
          "
        >
          <span
            :class="[
              'select-none leading-none',
              // size responsif agar tetap proporsional di berbagai viewport (sedikit lebih kecil)
              'text-5xl sm:text-6xl lg:text-7xl',
              markers[cell.number] === 'optional' ? 'text-amber-500/50' : 'text-rose-500/50',
            ]"
          >
            {{ markers[cell.number] === 'optional' ? '?' : '!' }}
          </span>
        </div>

        <!-- Start Cell Design -->
        <div v-if="cell.number === 1" class="absolute inset-0 z-10 pointer-events-none">
          <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.35)_0%,transparent_60%)]"
          ></div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2">
            <span
              class="text-[10px] sm:text-xs font-bold text-emerald-900 bg-emerald-200/90 px-1.5 py-0.5 rounded shadow"
              >START</span
            >
          </div>
        </div>

        <!-- Finish Cell Design -->
        <div v-if="cell.number === maxCell" class="absolute inset-0 z-10 pointer-events-none">
          <div
            class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.4)_0%,transparent_60%)]"
          ></div>
          <div class="absolute bottom-1 left-1/2 -translate-x-1/2">
            <span
              class="text-[10px] sm:text-xs font-bold text-white bg-rose-500/90 px-1.5 py-0.5 rounded shadow"
              >FINISH</span
            >
          </div>
        </div>

        <!-- Players on this cell -->
        <div class="absolute inset-0 p-2 z-20 pointer-events-none">
          <div
            v-for="(player, idx) in getPlayersOnCell(cell.number)"
            :key="player.id"
            class="absolute -translate-x-1/2 -translate-y-1/2"
            :style="getPlayerOffsetStyle(cell.number, idx)"
          >
            <span
              :class="`${getPlayerSizeClass(cell.number)} ${getPlayerShadow(player.color)} block leading-none select-none`"
            >
              {{ player.icon }}
            </span>
          </div>
        </div>
      </div>

      <!-- Ghost Token for Animation -->
      <div
        v-if="ghostToken.visible"
        class="absolute z-40 pointer-events-none transition-all duration-300 ease-in-out"
        :style="ghostToken.style"
      >
        <span class="text-3xl drop-shadow-lg block leading-none select-none">
          {{ ghostToken.icon }}
        </span>
      </div>

      <!-- Projectile for Attack Animation -->
      <div
        v-if="projectile.visible"
        class="absolute z-50 pointer-events-none"
        :style="projectile.style"
      >
        <div
          class="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
        ></div>
      </div>

      <!-- Hit Effect (burst) -->
      <div
        v-if="hitEffect.visible"
        class="absolute z-50 pointer-events-none"
        :style="hitEffect.style"
      >
        <div class="hit-burst"></div>
      </div>

      <!-- Shield Pulse Effect -->
      <div
        v-if="shieldEffect.visible"
        class="absolute z-50 pointer-events-none"
        :style="shieldEffect.style"
      >
        <div class="shield-pulse"></div>
      </div>

      <!-- Shield Hold (static) -->
      <div
        v-if="shieldHold.visible"
        class="absolute z-40 pointer-events-none"
        :style="shieldHold.style"
      >
        <img :src="shieldLogo" alt="shield" class="hold-shield w-6 h-6" />
      </div>

      <!-- Shield Gain Pop Effect -->
      <div
        v-if="shieldGain.visible"
        class="absolute z-50 pointer-events-none"
        :style="shieldGain.style"
      >
        <img :src="shieldLogo" alt="shield" class="gain-shield w-6 h-6" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import shieldLogo from '@/assets/images/shield-logo.png'

// Props
const props = defineProps({
  players: { type: Array, required: true },
  boardSize: { type: Number, default: 8 },
  // markers: mapping nomor sel -> 'optional' ("?") atau 'forced' ("!")
  markers: { type: Object, default: () => ({}) },
})

// Refs
const boardContainer = ref(null)

// Ghost token state for animation
const ghostToken = ref({
  visible: false,
  icon: '',
  style: {
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
  },
})

// Projectile and effects state
const projectile = ref({
  visible: false,
  style: {
    left: '0px',
    top: '0px',
    transition: 'none',
    transform: 'translate(-50%, -50%)',
  },
})

const hitEffect = ref({
  visible: false,
  style: {
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
  },
})

const shieldEffect = ref({
  visible: false,
  style: {
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
  },
})

const isShaking = ref(false)

// Shield gain pop effect
const shieldGain = ref({
  visible: false,
  style: {
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
  },
})

// Shield hold (static protective ring shown before a shot)
const shieldHold = ref({
  visible: false,
  style: {
    left: '0px',
    top: '0px',
    transform: 'translate(-50%, -50%)',
  },
})

// Computed board cells (start di bawah kiri = 1, zigzag ke atas)
const boardCells = computed(() => {
  const cells = []
  const N = props.boardSize
  // Iterasi DOM row dari atas ke bawah, tapi nomor logis dihitung dari bawah
  for (let rowDOM = 0; rowDOM < N; rowDOM++) {
    const logicalRow = N - 1 - rowDOM // 0 = baris terbawah
    const isEvenLogical = logicalRow % 2 === 0
    for (let col = 0; col < N; col++) {
      const position = isEvenLogical ? logicalRow * N + col + 1 : logicalRow * N + (N - col)
      cells.push({
        number: position,
        row: logicalRow,
        col: isEvenLogical ? col : N - 1 - col,
      })
    }
  }
  // Biarkan urutan sesuai DOM grid
  return cells
})

// Max cell number
const maxCell = computed(() => props.boardSize * props.boardSize)

// Helpers
const getCellBackground = (cellNumber) => {
  const row = Math.floor((cellNumber - 1) / props.boardSize)
  const col = (cellNumber - 1) % props.boardSize
  const isLight = (row + col) % 2 === 0
  return isLight ? 'bg-white/40' : 'bg-white/20'
}

// Subtle ring highlight for cells with markers
const getMarkerRingClass = (cellNumber) => {
  const type = props.markers && props.markers[cellNumber]
  if (!type) return ''
  return type === 'optional'
    ? 'ring-2 ring-amber-400/40 ring-offset-0'
    : 'ring-2 ring-rose-400/40 ring-offset-0'
}

// Special ring highlight for Start (1) and Finish (max)
const getStartFinishRingClass = (cellNumber) => {
  if (cellNumber === 1) return 'ring-4 ring-emerald-400/70 ring-offset-0'
  if (cellNumber === maxCell.value) return 'ring-4 ring-rose-400/70 ring-offset-0'
  return ''
}

const getPlayersOnCell = (cellNumber) => {
  return props.players
    .filter((player) => player.position === cellNumber)
    .sort((a, b) => a.id - b.id)
}

const getPlayerSizeClass = (cellNumber) => {
  const count = getPlayersOnCell(cellNumber).length
  if (count <= 1) return 'text-3xl'
  if (count === 2) return 'text-3xl'
  if (count >= 3) return 'text-2xl'
  return 'text-2xl'
}

const getPlayerOffsetStyle = (cellNumber, idx) => {
  const count = getPlayersOnCell(cellNumber).length
  let positions = [{ left: '50%', top: '50%' }]
  if (count === 2) {
    positions = [
      { left: '35%', top: '50%' },
      { left: '65%', top: '50%' },
    ]
  } else if (count >= 3) {
    positions = [
      { left: '35%', top: '35%' },
      { left: '65%', top: '35%' },
      { left: '50%', top: '65%' },
      { left: '65%', top: '65%' },
    ]
  }
  const pos = positions[idx] || positions[0]
  return `left: ${pos.left}; top: ${pos.top};`
}

const getPlayerShadow = (_color) => 'drop-shadow-lg'

// Animation helpers
// Map posisi logis (1..N, dihitung dari bawah) ke index elemen DOM (baris atas ke bawah)
const positionToDomIndex = (position) => {
  const N = props.boardSize
  const logicalRow = Math.floor((position - 1) / N) // 0 = baris terbawah
  const colInRow = (position - 1) % N
  const isEvenLogical = logicalRow % 2 === 0
  const col = isEvenLogical ? colInRow : N - 1 - colInRow
  const rowDOM = N - 1 - logicalRow
  return rowDOM * N + col
}

const getPositionCoordinates = (position) => {
  if (!boardContainer.value) return { x: 0, y: 0 }

  // Find the cell element for this position in the DOM
  const cellElements = boardContainer.value.children
  const targetCellIndex = positionToDomIndex(position) // index DOM sesuai zigzag

  if (targetCellIndex >= 0 && targetCellIndex < cellElements.length) {
    const cellElement = cellElements[targetCellIndex]
    const cellRect = cellElement.getBoundingClientRect()
    const containerRect = boardContainer.value.getBoundingClientRect()

    // Calculate relative position from container
    const x = cellRect.left - containerRect.left + cellRect.width / 2
    const y = cellRect.top - containerRect.top + cellRect.height / 2

    return { x, y }
  }

  return { x: 0, y: 0 }
}

// NEW: hitung koordinat pusat pion (memperhitungkan offset pion di dalam sel)
const getPlayerOffsetPerc = (position, playerId) => {
  const playersOnCell = getPlayersOnCell(position)
  const count = playersOnCell.length
  let offsets = [{ left: 0.5, top: 0.5 }]
  if (count === 2) {
    offsets = [
      { left: 0.35, top: 0.5 },
      { left: 0.65, top: 0.5 },
    ]
  } else if (count >= 3) {
    offsets = [
      { left: 0.35, top: 0.35 },
      { left: 0.65, top: 0.35 },
      { left: 0.5, top: 0.65 },
      { left: 0.65, top: 0.65 },
    ]
  }
  const idx = playersOnCell.findIndex((p) => p.id === playerId)
  return offsets[idx >= 0 ? idx : 0]
}

const getPlayerCoordinates = (player) => {
  if (!boardContainer.value) return { x: 0, y: 0 }

  const cellElements = boardContainer.value.children
  const targetCellIndex = positionToDomIndex(player.position)
  if (targetCellIndex >= 0 && targetCellIndex < cellElements.length) {
    const cellElement = cellElements[targetCellIndex]
    const cellRect = cellElement.getBoundingClientRect()
    const containerRect = boardContainer.value.getBoundingClientRect()

    const { left, top } = getPlayerOffsetPerc(player.position, player.id)
    const x = cellRect.left - containerRect.left + cellRect.width * left
    const y = cellRect.top - containerRect.top + cellRect.height * top
    return { x, y }
  }
  // fallback ke tengah sel
  return getPositionCoordinates(player.position)
}

// Exposed animation method for forward movement
const animateMove = async (player, steps, speed = 300) => {
  if (!boardContainer.value) return

  const startPosition = player.position
  const endPosition = Math.min(startPosition + steps, props.boardSize * props.boardSize)

  // Setup ghost token at starting position
  const startCoords = getPositionCoordinates(startPosition)
  ghostToken.value.visible = true
  ghostToken.value.icon = player.icon
  ghostToken.value.style = {
    left: `${startCoords.x}px`,
    top: `${startCoords.y}px`,
    transform: 'translate(-50%, -50%)',
  }

  // Wait a moment to ensure ghost token is visible at start position
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Animate step by step forward
  for (let currentPos = startPosition + 1; currentPos <= endPosition; currentPos++) {
    const coords = getPositionCoordinates(currentPos)

    ghostToken.value.style = {
      left: `${coords.x}px`,
      top: `${coords.y}px`,
      transform: 'translate(-50%, -50%)',
    }

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, speed))
  }

  // Hide ghost token after animation
  ghostToken.value.visible = false
}

// Exposed animation method for backward movement
const animateBackward = async (player, steps, speed = 300) => {
  if (!boardContainer.value) return

  const startPosition = player.position
  const endPosition = Math.max(startPosition - steps, 1)

  // Setup ghost token at starting position
  const startCoords = getPositionCoordinates(startPosition)
  ghostToken.value.visible = true
  ghostToken.value.icon = player.icon
  ghostToken.value.style = {
    left: `${startCoords.x}px`,
    top: `${startCoords.y}px`,
    transform: 'translate(-50%, -50%)',
  }

  // Wait a moment to ensure ghost token is visible at start position
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Animate step by step backward
  for (let currentPos = startPosition - 1; currentPos >= endPosition; currentPos--) {
    const coords = getPositionCoordinates(currentPos)

    ghostToken.value.style = {
      left: `${coords.x}px`,
      top: `${coords.y}px`,
      transform: 'translate(-50%, -50%)',
    }

    // Wait for animation to complete
    await new Promise((resolve) => setTimeout(resolve, speed))
  }

  // Hide ghost token after animation
  ghostToken.value.visible = false
}

// Attack animation: projectile travels from attacker to target, shake board and burst on hit
const animateShoot = async (attacker, target, duration = 500) => {
  if (!boardContainer.value) return

  const start = getPlayerCoordinates(attacker)
  const end = getPlayerCoordinates(target)

  // Kecepatan konstan (px per detik)
  const speedPxPerSec = 900
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const travelMs = Math.max(120, Math.round((distance / speedPxPerSec) * 1000))

  // Setup projectile at start
  projectile.value.visible = true
  projectile.value.style = {
    left: `${start.x}px`,
    top: `${start.y}px`,
    transform: 'translate(-50%, -50%)',
    transition: 'none',
  }

  await nextTick()
  // Trigger travel
  requestAnimationFrame(() => {
    projectile.value.style = {
      left: `${end.x}px`,
      top: `${end.y}px`,
      transform: 'translate(-50%, -50%)',
      transition: `left ${travelMs}ms linear, top ${travelMs}ms linear`,
    }
  })

  // wait for travel to finish
  await new Promise((res) => setTimeout(res, travelMs))
  projectile.value.visible = false

  // Show hit burst at target
  hitEffect.value.visible = true
  hitEffect.value.style = {
    left: `${end.x}px`,
    top: `${end.y}px`,
    transform: 'translate(-50%, -50%)',
  }

  // Shake the board slightly
  isShaking.value = true
  setTimeout(() => (isShaking.value = false), 250)

  await new Promise((res) => setTimeout(res, 350))
  hitEffect.value.visible = false
}

// Shield pulse effect when an attack is blocked
const animateShieldPulse = async (target, duration = 600) => {
  if (!boardContainer.value) return
  const pos = getPlayerCoordinates(target)
  shieldEffect.value.visible = true
  shieldEffect.value.style = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'translate(-50%, -50%)',
  }
  await new Promise((res) => setTimeout(res, duration))
  shieldEffect.value.visible = false
}

// When gaining shield: show a popping shield icon and a protective pulse
const animateShieldGain = async (target, duration = 1200) => {
  if (!boardContainer.value) return
  const pos = getPlayerCoordinates(target)
  // Start both effects
  shieldGain.value.visible = true
  shieldGain.value.style = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'translate(-50%, -50%)',
  }
  // Also pulse a protective ring
  shieldEffect.value.visible = true
  shieldEffect.value.style = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'translate(-50%, -50%)',
  }
  await new Promise((res) => setTimeout(res, duration))
  shieldGain.value.visible = false
  shieldEffect.value.visible = false
}

// Shield hold controls
const animateShieldHoldStart = (target) => {
  if (!boardContainer.value) return
  const pos = getPlayerCoordinates(target)
  shieldHold.value.visible = true
  shieldHold.value.style = {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'translate(-50%, -50%)',
  }
}

const animateShieldHoldStop = () => {
  shieldHold.value.visible = false
}

// Expose methods to parent
defineExpose({
  animateMove,
  animateBackward,
  animateShoot,
  animateShieldPulse,
  animateShieldGain,
  animateShieldHoldStart,
  animateShieldHoldStop,
})
</script>

<style scoped>
/* Shake effect for the board container */
.shake {
  animation: board-shake 250ms ease-in-out;
}
@keyframes board-shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  50% {
    transform: translateX(2px);
  }
  75% {
    transform: translateX(-1px);
  }
  100% {
    transform: translateX(0);
  }
}

/* Hit burst: expanding ring */
.hit-burst {
  width: 12px;
  height: 12px;
  border: 3px solid rgba(251, 191, 36, 0.9); /* amber-400 */
  border-radius: 9999px;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.7);
  animation: burst 380ms ease-out forwards;
}
@keyframes burst {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  100% {
    transform: scale(3.2);
    opacity: 0;
  }
}

/* Shield pulse: glowing protective ring */
.shield-pulse {
  width: 14px;
  height: 14px;
  border: 3px solid rgba(16, 185, 129, 0.95); /* emerald-500 */
  border-radius: 9999px;
  box-shadow:
    0 0 16px rgba(16, 185, 129, 0.9),
    inset 0 0 10px rgba(16, 185, 129, 0.6);
  animation: shieldPulse 600ms ease-out forwards;
}
@keyframes shieldPulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  60% {
    transform: scale(3);
    opacity: 0.9;
  }
  100% {
    transform: scale(3.4);
    opacity: 0;
  }
}

/* Shield hold icon glow (static) */
.hold-shield {
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.9));
  opacity: 0.95;
}

/* Shield gain pop (emoji) */
.gain-shield {
  font-size: 20px;
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.8));
  animation: gainPop 1200ms ease-out forwards;
}
@keyframes gainPop {
  0% {
    transform: scale(0.6) translateY(0);
    opacity: 0;
  }
  30% {
    transform: scale(1.15) translateY(-4px);
    opacity: 1;
  }
  60% {
    transform: scale(1) translateY(-6px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(-12px);
    opacity: 0;
  }
}
</style>
