import { createRouter, createWebHistory } from 'vue-router';
import SearchView from '../views/SearchView.vue';

const routes = [
  {
    path: '/',
    name: 'search',
    component: SearchView
  },
  {
    path: '/preview/:fc/:id',
    name: 'preview',
    component: () => import('../views/PreviewView.vue'),
    props: route => {
      let fileObj = null;
      // 优先 history state
      if (history.state && history.state.file) fileObj = history.state.file;
      // 回退：尝试从 query.f Base64(JSON) 解析
      if (!fileObj && route.query.f) {
        try {
          const json = decodeURIComponent(escape(atob(route.query.f)));
          fileObj = JSON.parse(json);
        } catch { /* ignore */ }
      }
      return {
        fc: route.params.fc,
        id: route.params.id,
        retureBtn: route.query.retureBtn === 'true' || route.query.retureBtn === true,
        file: fileObj
      };
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;