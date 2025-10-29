import { ref, watch } from 'vue'

const STORAGE_KEY = 'gameVolumeSettings'

// Shared state untuk volume settings
const bgmVolume = ref(0.1) // Default 0.1 (10%)
const sfxVolume = ref(0.5) // Default 0.5 (50%)

// Load dari localStorage saat pertama kali
const loadSettings = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const settings = JSON.parse(saved)
      if (typeof settings.bgmVolume === 'number') {
        bgmVolume.value = Math.max(0, Math.min(1, settings.bgmVolume))
      }
      if (typeof settings.sfxVolume === 'number') {
        sfxVolume.value = Math.max(0, Math.min(1, settings.sfxVolume))
      }
    }
  } catch (error) {
    console.error('Failed to load volume settings:', error)
  }
}

// Save ke localStorage
const saveSettings = () => {
  try {
    const settings = {
      bgmVolume: bgmVolume.value,
      sfxVolume: sfxVolume.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save volume settings:', error)
  }
}

// Load settings saat module pertama kali dimuat
loadSettings()

// Auto-save saat ada perubahan
watch([bgmVolume, sfxVolume], () => {
  saveSettings()
})

export function useVolumeSettings() {
  return {
    bgmVolume,
    sfxVolume,
    setBgmVolume: (value) => {
      bgmVolume.value = Math.max(0, Math.min(1, value))
    },
    setSfxVolume: (value) => {
      sfxVolume.value = Math.max(0, Math.min(1, value))
    },
  }
}
