import { ref } from 'vue'

export function useQuestions() {
  const questions = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const loadQuestions = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Import dengan cache busting menggunakan timestamp
      const questionsModule = await import('../assets/data/pertanyaan.txt?raw')
      const text = questionsModule.default
      console.log('[Match Game] Loading questions, first line:', text.split('\n')[0])
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')

      const parsedQuestions = lines
        .map((line, index) => {
          // New format: "Pertanyaan | Jawaban | Clue 1 | Clue 2 | ... (opsional lebih banyak)"
          // Backward-compatible: if only 2 parts, treat as "Pertanyaan | Jawaban"
          const parts = line.split('|').map((s) => s.trim()).filter((p) => p.length > 0)
          if (parts.length < 2) {
            console.warn(
              `Question ${index + 1} has invalid format (expected at least 'Pertanyaan | Jawaban'):`,
              line,
            )
            return null
          }

          const [question, answer, ...clues] = parts

          return {
            id: index + 1,
            question,
            answer,
            clues,
          }
        })
        .filter((q) => q !== null)

      questions.value = parsedQuestions
      console.log('[Match Game] Total questions loaded:', parsedQuestions.length)
      console.log('[Match Game] Sample question 1:', parsedQuestions[0]?.question)
    } catch (err) {
      error.value = err.message
      console.error('Error loading questions:', err)

      questions.value = [
        {
          id: 1,
          question: 'Apa itu phishing?',
          answer: 'phishing',
          clues: [],
        },
        {
          id: 2,
          question: 'Kepanjangan MFA?',
          answer: 'multi faktor',
          clues: [],
        },
      ]
    } finally {
      isLoading.value = false
    }
  }

  const getQuestionById = (id) => {
    const q = questions.value.find((q) => q.id === id)
    if (!q) {
      console.warn(`Question with id ${id} not found; falling back to first question`)
    }
    return q || questions.value[0]
  }

  const getRandomQuestion = () => {
    if (questions.value.length === 0) return null
    const randomIndex = Math.floor(Math.random() * questions.value.length)
    return questions.value[randomIndex]
  }

  return {
    questions,
    isLoading,
    error,
    loadQuestions,
    getQuestionById,
    getRandomQuestion,
  }
}

