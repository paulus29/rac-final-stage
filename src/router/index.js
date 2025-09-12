import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import MatchGame from '../views/MatchGame.vue'
import SnakesLadders from '../views/SnakesLadders.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/stage-2',
      name: 'match-game',
      component: MatchGame
    },
    {
      path: '/stage-3',
      name: 'snakes-ladders',
      component: SnakesLadders
    }
  ]
})

export default router
