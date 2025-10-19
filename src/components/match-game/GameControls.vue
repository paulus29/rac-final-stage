<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useSoundEffects } from '@/composables/useSoundEffects'

const showMenu = ref(false)
const menuRef = ref(null)
const emit = defineEmits(['reset-game'])

const router = useRouter()
const { stopMatchGameBackgroundMusic } = useSoundEffects()

const goHome = () => {
  showMenu.value = false
  // Stop background music saat kembali ke menu utama
  stopMatchGameBackgroundMusic()
  router.push('/')
}

const openReset = () => {
  showMenu.value = false
  emit('reset-game')
}

onMounted(() => {
  const onDocClick = (e) => {
    if (!menuRef.value) return
    if (!menuRef.value.contains(e.target)) {
      showMenu.value = false
    }
  }
  document.addEventListener('click', onDocClick)
  if (menuRef.value) menuRef.value.__onDocClick = onDocClick
})

onBeforeUnmount(() => {
  if (menuRef.value && menuRef.value.__onDocClick) {
    document.removeEventListener('click', menuRef.value.__onDocClick)
  }
})
</script>

<template>
  <div class="relative" ref="menuRef">
    <button
      @click="showMenu = !showMenu"
      :class="[
        'w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white/90 text-gray-800 shadow-md ring-1 ring-white/50 transition-colors transform transition-transform duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400',
        showMenu ? 'rotate-90 scale-110' : '',
      ]"
      aria-label="Menu"
      :aria-expanded="showMenu.toString()"
      aria-haspopup="true"
    >
      <span class="relative inline-block w-5 h-5">
        <span
          :class="[
            'absolute inset-0 flex items-center justify-center transition-all duration-200',
            showMenu ? 'opacity-0 scale-75' : 'opacity-100 scale-100',
          ]"
          >☰</span
        >
        <span
          :class="[
            'absolute inset-0 flex items-center justify-center transition-all duration-200',
            showMenu ? 'opacity-100 scale-100 rotate-90' : 'opacity-0 scale-75',
          ]"
          >✕</span
        >
      </span>
    </button>
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="showMenu"
        class="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur rounded-xl shadow-lg ring-1 ring-black/10 overflow-hidden origin-top-right"
      >
        <button
          @click="goHome"
          class="w-full text-left px-4 py-3 hover:bg-white text-gray-800 font-medium flex items-center gap-2 transition-colors"
        >
          <span>🏠</span>
          <span>Kembali ke Menu Utama</span>
        </button>
        <div class="h-px bg-black/10"></div>
        <button
          @click="openReset"
          class="w-full text-left px-4 py-3 hover:bg-white text-gray-800 font-medium flex items-center gap-2 transition-colors"
        >
          <span>🔄</span>
          <span>Reset Game</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
