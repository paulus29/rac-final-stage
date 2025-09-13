<template>
  <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 w-full">
    <div
      ref="boardContainer"
      class="grid gap-1 w-full max-w-2xl mx-auto min-w-0 relative"
      :style="{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(cell, index) in boardCells"
        :key="index"
        :class="[
          'relative aspect-square border-2 border-white/30 rounded-lg flex items-center justify-center min-w-0 min-h-0 overflow-hidden transform-gpu transition-transform duration-200 ease-out hover:scale-[1.04] hover:shadow-md',
          getCellBackground(cell.number),
          getMarkerRingClass(cell.number),
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
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'

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

// Computed board cells (8x8, zigzag numbering)
const boardCells = computed(() => {
  const cells = []
  for (let row = 0; row < props.boardSize; row++) {
    const isEvenRow = row % 2 === 0
    for (let col = 0; col < props.boardSize; col++) {
      const position = isEvenRow
        ? row * props.boardSize + col + 1
        : row * props.boardSize + (props.boardSize - col)
      cells.push({
        number: position,
        row: props.boardSize - 1 - row,
        col: isEvenRow ? col : props.boardSize - 1 - col,
      })
    }
  }
  return cells.sort((a, b) => a.number - b.number)
})

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
const getPositionCoordinates = (position) => {
  if (!boardContainer.value) return { x: 0, y: 0 }

  // Find the cell element for this position in the DOM
  const cellElements = boardContainer.value.children
  const targetCellIndex = position - 1 // Convert to 0-based index

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

// Expose methods to parent
defineExpose({
  animateMove,
  animateBackward,
})
</script>
