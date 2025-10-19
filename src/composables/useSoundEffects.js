// Module-level variables untuk background music (singleton pattern)
// Ini memastikan hanya ada satu instance audio yang di-share antar semua komponen
let backgroundMusicInstance = null // Snake Ladder
let matchGameBackgroundMusicInstance = null // Match Game

// Composable untuk memutar sound effects
export function useSoundEffects() {

  const playSound = (soundPath, volume = 0.5) => {
    try {
      const audio = new Audio(soundPath)
      audio.volume = Math.max(0, Math.min(1, volume)) // Clamp volume 0-1
      audio.play().catch((error) => {
        console.warn('Failed to play sound:', soundPath, error)
      })
    } catch (error) {
      console.error('Error creating audio:', soundPath, error)
    }
  }

  // Play sound with loop (returns audio instance for manual control)
  const playSoundLoop = (soundPath, volume = 0.5) => {
    try {
      const audio = new Audio(soundPath)
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.loop = true
      audio.play().catch((error) => {
        console.warn('Failed to play looped sound:', soundPath, error)
      })
      return audio
    } catch (error) {
      console.error('Error creating looped audio:', soundPath, error)
      return null
    }
  }

  // Stop audio
  const stopSound = (audio) => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  // Match Game sounds
  const playOpenCard = () => {
    const soundPath = new URL('../assets/music/match-game/open-card.mp3', import.meta.url).href
    playSound(soundPath, 0.8)
  }

  const playMatchCard = () => {
    const soundPath = new URL('../assets/music/match-game/match-card.mp3', import.meta.url).href
    playSound(soundPath, 0.8)
  }

  const playFinishGame = () => {
    const soundPath = new URL('../assets/music/match-game/finish-game.mp3', import.meta.url).href
    playSound(soundPath, 0.8)
  }

  // Snake Ladder sounds
  const playWalkingForward = () => {
    const soundPath = new URL('../assets/music/snake-ladder/walking-forward.mp3', import.meta.url)
      .href
    return playSoundLoop(soundPath, 0.6)
  }

  const playWalkingBackward = () => {
    const soundPath = new URL('../assets/music/snake-ladder/walking-backward.mp3', import.meta.url)
      .href
    playSound(soundPath, 0.6)
  }

  const playShooting = () => {
    const soundPath = new URL('../assets/music/snake-ladder/shooting.mp3', import.meta.url).href
    playSound(soundPath, 0.7)
  }

  const playShieldBroken = () => {
    const soundPath = new URL('../assets/music/snake-ladder/shield-broken.mp3', import.meta.url)
      .href
    playSound(soundPath, 0.7)
  }

  const playGetShield = () => {
    const soundPath = new URL('../assets/music/snake-ladder/get-shield.mp3', import.meta.url).href
    playSound(soundPath, 0.7)
  }

  const playVictory1st = () => {
    const soundPath = new URL('../assets/music/snake-ladder/victory-1st.mp3', import.meta.url).href
    playSound(soundPath, 0.8)
  }

  const playVictoryAllRanking = () => {
    const soundPath = new URL('../assets/music/snake-ladder/victory-all-rangking.mp3', import.meta.url)
      .href
    playSound(soundPath, 0.8)
  }

  // Background Music Management
  const playBackgroundMusic = () => {
    if (!backgroundMusicInstance) {
      try {
        const soundPath = new URL(
          '../assets/music/snake-ladder/background-music.mp3',
          import.meta.url,
        ).href
        backgroundMusicInstance = new Audio(soundPath)
        backgroundMusicInstance.volume = 0.3 // Volume default background music
        backgroundMusicInstance.loop = true
        backgroundMusicInstance.play().catch((error) => {
          console.warn('Failed to play background music:', error)
        })
      } catch (error) {
        console.error('Error creating background music:', error)
      }
    } else {
      // Resume jika sudah ada instance
      backgroundMusicInstance.play().catch((error) => {
        console.warn('Failed to resume background music:', error)
      })
    }
  }

  const stopBackgroundMusic = () => {
    if (backgroundMusicInstance) {
      backgroundMusicInstance.pause()
      backgroundMusicInstance.currentTime = 0
      backgroundMusicInstance = null
    }
  }

  const fadeOutBackgroundMusic = async (duration = 1000) => {
    if (!backgroundMusicInstance) return
    const initialVolume = backgroundMusicInstance.volume
    const steps = 20
    const stepDuration = duration / steps
    const volumeDecrement = initialVolume / steps

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration))
      if (backgroundMusicInstance) {
        backgroundMusicInstance.volume = Math.max(
          0,
          backgroundMusicInstance.volume - volumeDecrement,
        )
      }
    }
  }

  const fadeInBackgroundMusic = async (targetVolume = 0.3, duration = 1000) => {
    if (!backgroundMusicInstance) return
    backgroundMusicInstance.volume = 0
    const steps = 20
    const stepDuration = duration / steps
    const volumeIncrement = targetVolume / steps

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration))
      if (backgroundMusicInstance) {
        backgroundMusicInstance.volume = Math.min(
          targetVolume,
          backgroundMusicInstance.volume + volumeIncrement,
        )
      }
    }
  }

  // Match Game Background Music Management
  const playMatchGameBackgroundMusic = () => {
    if (!matchGameBackgroundMusicInstance) {
      try {
        const soundPath = new URL(
          '../assets/music/match-game/background-music.mp3',
          import.meta.url,
        ).href
        matchGameBackgroundMusicInstance = new Audio(soundPath)
        matchGameBackgroundMusicInstance.volume = 0.25 // Volume default background music match game
        matchGameBackgroundMusicInstance.loop = true
        matchGameBackgroundMusicInstance.play().catch((error) => {
          console.warn('Failed to play match game background music:', error)
        })
      } catch (error) {
        console.error('Error creating match game background music:', error)
      }
    } else {
      // Resume jika sudah ada instance
      matchGameBackgroundMusicInstance.play().catch((error) => {
        console.warn('Failed to resume match game background music:', error)
      })
    }
  }

  const stopMatchGameBackgroundMusic = () => {
    if (matchGameBackgroundMusicInstance) {
      matchGameBackgroundMusicInstance.pause()
      matchGameBackgroundMusicInstance.currentTime = 0
      matchGameBackgroundMusicInstance = null
    }
  }

  const fadeOutMatchGameBackgroundMusic = async (duration = 1000) => {
    if (!matchGameBackgroundMusicInstance) return
    const initialVolume = matchGameBackgroundMusicInstance.volume
    const steps = 20
    const stepDuration = duration / steps
    const volumeDecrement = initialVolume / steps

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration))
      if (matchGameBackgroundMusicInstance) {
        matchGameBackgroundMusicInstance.volume = Math.max(
          0,
          matchGameBackgroundMusicInstance.volume - volumeDecrement,
        )
      }
    }
  }

  const fadeInMatchGameBackgroundMusic = async (targetVolume = 0.25, duration = 1000) => {
    if (!matchGameBackgroundMusicInstance) return
    matchGameBackgroundMusicInstance.volume = 0
    const steps = 20
    const stepDuration = duration / steps
    const volumeIncrement = targetVolume / steps

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration))
      if (matchGameBackgroundMusicInstance) {
        matchGameBackgroundMusicInstance.volume = Math.min(
          targetVolume,
          matchGameBackgroundMusicInstance.volume + volumeIncrement,
        )
      }
    }
  }

  return {
    playSound,
    stopSound,
    // Match Game
    playOpenCard,
    playMatchCard,
    playFinishGame,
    // Snake Ladder
    playWalkingForward,
    playWalkingBackward,
    playShooting,
    playShieldBroken,
    playGetShield,
    playVictory1st,
    playVictoryAllRanking,
    // Snake Ladder Background Music
    playBackgroundMusic,
    stopBackgroundMusic,
    fadeOutBackgroundMusic,
    fadeInBackgroundMusic,
    // Match Game Background Music
    playMatchGameBackgroundMusic,
    stopMatchGameBackgroundMusic,
    fadeOutMatchGameBackgroundMusic,
    fadeInMatchGameBackgroundMusic,
  }
}
