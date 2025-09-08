import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import './styles/variables.css';
import App from './App.vue';
import router from './router';
import { initAuth } from './services/api';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: zhCn });

 initAuth().catch(e => {
   console.warn('Auth failed, continuing anyway:', e);
   }).finally(() => {
  app.mount('#app');
 });