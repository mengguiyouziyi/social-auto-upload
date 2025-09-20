//引入createApp用于创建应用
import { createApp } from 'vue'
//引入APP根组件
import App from './App.vue'

const app = createApp(App)
import router from './router'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入Pinia
import { createPinia } from 'pinia'

// 导入全局样式
import '@/styles/index.scss'

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')