<script setup>
const props = defineProps({
  number: {
    type: Number,
    required: true,
  },
  position: {
    type: Number,
    required: true,
  },
  isFlipped: {
    type: Boolean,
    default: false,
  },
  isMatched: {
    type: Boolean,
    default: false,
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['card-click'])

const handleClick = () => {
  if (!props.isDisabled && !props.isFlipped && !props.isMatched) {
    emit('card-click', props.number)
  }
}
</script>

<template>
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
    <div
      class="relative w-full h-full text-center transition-transform duration-600"
      :class="{ 'transform rotate-y-180': isFlipped || isMatched }"
      style="transform-style: preserve-3d"
    >
      <div
        class="absolute w-full h-full flex items-center justify-center border-2 border-gray-800 rounded-lg shadow-md bg-gradient-to-br from-lime-500 to-green-600 text-white text-xl sm:text-3xl font-bold"
        style="backface-visibility: hidden"
      >
        <span
          class="absolute top-1 left-1 text-sm sm:text-base font-bold text-white bg-black bg-opacity-50 rounded px-1"
          >{{ position }}</span
        >
        <span>?</span>
      </div>

      <div
        class="absolute w-full h-full flex items-center justify-center border-2 border-gray-800 rounded-lg shadow-md bg-gradient-to-br from-pink-400 to-red-500 text-white text-xl sm:text-3xl font-bold transform rotate-y-180"
        style="backface-visibility: hidden"
      >
        <span
          class="absolute top-1 left-1 text-sm sm:text-base font-bold text-white bg-black bg-opacity-50 rounded px-1"
          >{{ position }}</span
        >
        <span>{{ number }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rotate-y-180 {
  transform: rotateY(180deg);
}

.duration-600 {
  transition-duration: 0.6s;
}
</style>
