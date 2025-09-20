import { http } from '@/utils/request'

export const aiApi = {
  getProviders() {
    return http.get('/ai/providers')
  },
  generateText(payload) {
    return http.post('/ai/generate', payload)
  },
  generateShotlist(payload) {
    return http.post('/ai/generate_shotlist', payload)
  }
}
