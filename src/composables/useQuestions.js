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
      const lines = text.trim().split('\n').filter(line => line.trim() !== '')

      const parsedQuestions = lines.map((line, index) => {
        const parts = line.split(', ')
        
        if (parts.length !== 3) {
          console.warn(`Question ${index + 1} has invalid format:`, line)
          return null
        }

        const question = parts[0].trim()
        const optionA = parts[1].trim().replace(/^a\.\s*/, '')
        const optionB = parts[2].trim().replace(/^b\.\s*/, '')

        return {
          id: index + 1,
          question,
          optionA,
          optionB,
          correctAnswer: 'a'
        }
      }).filter(q => q !== null)

      questions.value = parsedQuestions
    } catch (err) {
      error.value = err.message
      console.error('Error loading questions:', err)
      
      questions.value = [
        {
          id: 1,
          question: 'Siapa presiden pertama Indonesia?',
          optionA: 'Soekarno',
          optionB: 'Soeharto',
          correctAnswer: 'a'
        },
        {
          id: 2,
          question: 'Apa ibu kota negara Australia?',
          optionA: 'Canberra',
          optionB: 'Sydney',
          correctAnswer: 'a'
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  const getQuestionById = (id) => {
    return questions.value.find(q => q.id === id) || questions.value[0]
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
    getRandomQuestion
  }
}
