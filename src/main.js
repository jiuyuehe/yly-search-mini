import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './styles/variables.css';
import App from './App.vue';
import router from './router';
import { initAuth } from './services/api';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// initAuth().catch(e => {
//   console.warn('Auth failed, continuing anyway:', e);
// }).finally(() => {
  app.mount('#app');
// });