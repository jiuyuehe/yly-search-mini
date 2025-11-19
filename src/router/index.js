import { createRouter, createWebHistory } from 'vue-router';
import SearchView from '../views/SearchView.vue';

const routes = [
  {
    path: '/',
    name: 'search',
    component: SearchView
  },
  // Allow directly opening index.html (some users access /plugins/fts/index.html).
  // Without this, the router sees path 'index.html' (after base) and renders nothing.
  { path: '/index.html', redirect: '/' },
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
    // Preview by esId (document unique id)
    {
      path: '/preview/doc/:esid',
      name: 'preview-esid',
      component: () => import('../views/PreviewView.vue'),
      props: route => ({
        esid: route.params.esid,
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
  },
  {
    path: '/extractions/form/:id',
    name: 'extractions-form-detail',
    component: () => import('../views/FormExtractionsDetailView.vue'),
    props: true
  },
  // Data extraction statistics
  {
    path: '/newForm',
    name: 'newForm',
    component: () => import('../views/FormList.vue')
  },
  {
    path: '/newForm/:id/result',
    name: 'newForm-result',
    component: () => import('../views/FormDataViewPage.vue'),
    props: true
  },
  // Data labeling management
  {
    path: '/labeling',
    name: 'labeling',
    component: () => import('../views/DataLabelingView.vue')
  },
  // File diff comparison
  {
    path: '/diff',
    name: 'diff',
    component: () => import('../views/FileDiffView.vue')
  },
  // Catch-all: any unknown route redirect to root to avoid blank screen
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes
});

export default router;