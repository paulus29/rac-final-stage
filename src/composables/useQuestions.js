import { ref } from 'vue'

export function useQuestions() {
  const questions = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const loadQuestions = async () => {
    isLoading.value = true
    error.value = null

    try {
      const questionsModule = await import('../assets/data/pertanyaan.txt?raw')
      const text = questionsModule.default
      const lines = text
        .trim()
        .split('\n')
        .filter((line) => line.trim() !== '')

      const parsedQuestions = lines
        .map((line, index) => {
          // Format: "Pertanyaan | Clue 1 | Clue 2 | ... (opsional lebih banyak)"
          const parts = line.split('|').map((s) => s.trim()).filter((p) => p.length > 0)
          if (parts.length < 2) {
            console.warn(
              `Question ${index + 1} has invalid format (expected at least 2 fields separated by |):`,
              line,
            )
            return null
          }

          const [question, ...clues] = parts

          return {
            id: index + 1,
            question,
            clues,
          }
        })
        .filter((q) => q !== null)

      questions.value = parsedQuestions
    } catch (err) {
      error.value = err.message
      console.error('Error loading questions:', err)

      questions.value = [
        {
          id: 1,
          question: 'Siapa presiden pertama Indonesia?',
          clues: ['Soekarno', 'Proklamator RI'],
        },
        {
          id: 2,
          question: 'Apa ibu kota negara Australia?',
          clues: ['Bukan Sydney', 'Canberra'],
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

