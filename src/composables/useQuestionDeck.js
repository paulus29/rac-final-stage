import { ref } from 'vue'

// Deck pertanyaan untuk Snake & Ladder
// - Memuat dari src/assets/data/pertanyaan-snake-ladder.txt
// - Mengacak urutan
// - Menyediakan getNext() yang tidak mengulang sampai habis, lalu reshuffle
export function useQuestionDeck() {
  const deck = ref([])
  const index = ref(0)
  const isLoading = ref(false)
  const error = ref(null)

  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const load = async () => {
    isLoading.value = true
    error.value = null
    try {
      const mod = await import('@/assets/data/pertanyaan-snake-ladder.txt?raw')
      const text = mod.default
      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
      deck.value = shuffle([...lines])
      index.value = 0
    } catch (e) {
      error.value = e.message || 'Gagal memuat pertanyaan'
      // Fallback minimal
      deck.value = shuffle([
        'Ibu kota Indonesia?',
        'Simbol kimia untuk air?',
        'Planet terdekat dari Matahari?',
        'Warna bendera Indonesia?',
      ])
      index.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const getNext = () => {
    if (deck.value.length === 0) return null
    const q = deck.value[index.value]
    index.value += 1
    if (index.value >= deck.value.length) {
      // habis, reshuffle utk siklus berikutnya
      deck.value = shuffle([...deck.value])
      index.value = 0
    }
    return q
  }

  return { deck, isLoading, error, load, getNext }
}
