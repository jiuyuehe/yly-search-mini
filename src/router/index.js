import { createRouter, createWebHistory } from 'vue-router';
import SearchView from '../views/SearchView.vue';

const routes = [
  {
    path: '/',
    name: 'search',
    component: SearchView
  },
  // NAS 专用预览 (需放在通用前面防止被通用匹配拦截)
  {
    path: '/preview/nas/:nsi/:subp(.*)?',
    name: 'preview-nas',
    component: () => import('../views/PreviewView.vue'),
    props: route => ({
      fc: 'nas',
      nsi: route.params.nsi,
      subp: route.params.subp ? decodeURIComponent(route.params.subp) : '',
      retureBtn: route.query.retureBtn === 'true' || route.query.retureBtn === true
    })
  },
  // 通用预览: fc + fileId + fsFileId(可选)
  {
    path: '/preview/:fc/:fi/:fsi?',
    name: 'preview',
    component: () => import('../views/PreviewView.vue'),
    props: route => ({
      fc: route.params.fc,
      fi: route.params.fi,
      fsi: route.params.fsi || '',
      retureBtn: route.query.retureBtn === 'true' || route.query.retureBtn === true
    })
  },
  // 兼容旧路径 /preview/:fc/:id -> 重定向到新结构（fsi 置空）
  {
    path: '/preview/:fc/:id',
    name: 'preview-legacy',
    redirect: to => ({ name: 'preview', params: { fc: to.params.fc, fi: to.params.id, fsi: '' }, query: to.query })
  },
  // Forms management routes
  {
    path: '/forms',
    name: 'forms',
    component: () => import('../views/FormsView.vue')
  },
  {
    path: '/forms/create',
    name: 'forms-create',
    component: () => import('../views/FormDesignerView.vue')
  },
  {
    path: '/forms/edit/:id',
    name: 'forms-edit',
    component: () => import('../views/FormDesignerView.vue'),
    props: true
  },
  // Extractions management routes
  {
    path: '/extractions',
    name: 'extractions',
    component: () => import('../views/ExtractionsView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;