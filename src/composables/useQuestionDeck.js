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

  // Parse satu baris menjadi objek soal pilihan ganda
  // Format: "Pertanyaan | Opsi A | Opsi B | Opsi C | Opsi D | Jawaban"
  // - Jawaban dapat berupa A/B/C/D (case-insensitive) atau 1/2/3/4
  const parseLine = (line, i) => {
    const parts = line
      .split('|')
      .map((s) => s.trim())
      .filter((p) => p.length > 0)

    if (parts.length < 6) {
      if (import.meta.env.DEV) {
        console.warn('[useQuestionDeck] Line invalid (need 6 parts):', line)
      }
      return null
    }

    const [question, a, b, c, d, ansRaw] = parts
    const options = [a, b, c, d]
    let correctIndex = -1
    const ans = String(ansRaw).trim().toUpperCase()
    if (["A", "B", "C", "D"].includes(ans)) {
      correctIndex = { A: 0, B: 1, C: 2, D: 3 }[ans]
    } else if (["1", "2", "3", "4"].includes(ans)) {
      correctIndex = parseInt(ans, 10) - 1
    }
    if (correctIndex < 0 || correctIndex > 3) {
      if (import.meta.env.DEV) {
        console.warn('[useQuestionDeck] Invalid answer key on line:', line)
      }
      return null
    }

    return { id: i + 1, question, options, correctIndex }
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

      const parsed = lines
        .map((line, i) => parseLine(line, i))
        .filter((q) => q !== null)

      deck.value = shuffle([...parsed])
      index.value = 0
    } catch (e) {
      error.value = e.message || 'Gagal memuat pertanyaan'
      // Fallback minimal
      deck.value = shuffle([
        {
          id: 1,
          question: 'Apa itu phishing?',
          options: [
            'Upaya mengelabui pengguna untuk mencuri data',
            'Teknik enkripsi data',
            'Metode backup harian',
            'Perangkat firewall',
          ],
          correctIndex: 0,
        },
        {
          id: 2,
          question: 'Kata sandi yang kuat sebaiknya?',
          options: [
            'Menggunakan tanggal lahir',
            'Pendek dan mudah diingat',
            'Panjang, unik, dan kombinasi karakter',
            'Sama untuk semua akun',
          ],
          correctIndex: 2,
        },
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

