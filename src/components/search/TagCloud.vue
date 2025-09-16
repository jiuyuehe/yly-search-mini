<template>
  <div class="tag-cloud-wrapper">
    <div class="cloud-toolbar">
      <div class="left-info">
        <span class="title">标签云</span>
        <span v-if="loading" class="loading">加载中...</span>
        <span v-if="!loading && tags.length" class="meta">共 {{ tags.length }} 个标签</span>
      </div>
      <div class="right-actions">
        <el-select v-model="shape" size="small" style="width:110px" @change="renderCloud" :disabled="loading">
          <el-option label="圆形" value="circle" />
          <el-option label="心形" value="cardioid" />
          <el-option label="菱形" value="diamond" />
          <el-option label="方形" value="square" />
          <el-option label="三角" value="triangle" />
          <el-option label="五边形" value="pentagon" />
          <el-option label="星形" value="star" />
          <el-option v-if="customShapeFn" label="自定义" value="custom" />
        </el-select>
        <el-select v-model="stylePreset" size="small" style="width:110px" @change="scheduleRender(0)" :disabled="loading">
          <el-option label="动态" value="dynamic" />
          <!-- <el-option label="示例样式" value="example" />
          <el-option label="India 2" value="example-india-2" /> -->
        </el-select>
        <el-button size="small" text @click="advancedOpen = !advancedOpen">高级</el-button>
        <el-button size="small" :loading="loading" @click="onRefresh">刷新</el-button>
      </div>
    </div>

    <!-- 高级模式面板 -->
    <transition name="fade">
      <div v-show="advancedOpen" class="advanced-panel">
        <div class="panel-header">
          <span class="panel-title">自定义 Shape 函数</span>
          <div class="panel-actions">
            <el-button size="small" @click="applyCustomShape" type="primary">应用</el-button>
            <el-button size="small" @click="resetCustomShape" :disabled="!customShapeFn">重置</el-button>
          </div>
        </div>
        <el-input
          v-model="customShapeCode"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 8 }"
          placeholder="示例: \n// theta ∈ [0, 2π) 需返回 (0,1] 半径缩放\nreturn 1 - Math.sin(theta);\n// 或完整函数: function(theta){ return 1 - Math.sin(theta); }\n// 也可: const arr=[...]; var max=...; return arr[Math.floor(theta/(2*Math.PI)*arr.length)]/max;"
        />
        <div class="help-row">
          <span class="hint">返回值越大半径越大。建议范围 0~1。支持使用局部常量。</span>
          <el-button size="small" text @click="fillSample">示例</el-button>
        </div>
        <div v-if="customShapeError" class="error">{{ customShapeError }}</div>
      </div>
    </transition>

    <!-- Canvas container (always render for ResizeObserver; toggle visibility) -->
  <div ref="cloudContainer" class="cloud-canvas-wrapper" v-show="tags.length" :style="{ height: props.height + 'px' }">
      <canvas ref="cloudCanvas"></canvas>
      <!-- hover 高亮独立图层，避免重新布局主词云 -->
      <canvas ref="highlightCanvas" class="highlight-layer"></canvas>
      <div v-if="rendering" class="rendering-overlay">生成中...</div>
      <div v-show="hoverWord" ref="tooltip" class="wc-tooltip" :style="tooltipStyle">{{ hoverWord }}<span v-if="hoverWeight"> ({{ hoverWeight }})</span></div>
    </div>
    <el-empty description="暂无标签" v-if="!tags.length && !loading" />

    <!-- Fallback simple list (hidden by default, toggled if canvas不支持) --> 
    <div v-if="fallback" class="fallback-list">
      <span v-for="t in tags" :key="t.tag" class="fallback-item" :style="inlineStyleFor(t)" @click="handleClick(t.tag)" :title="`${t.tag} (权重 ${t.weight})`">{{ t.tag }}</span>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useSearchStore } from '../../stores/search';
// Side-effect import: wordcloud2.js attaches WordCloud to window/globalThis
import '../../utils/wordcloud2.js';
import { getExamplePreset } from '../../utils/examplesPresets.js';
const WordCloud = (typeof window !== 'undefined' ? window.WordCloud : globalThis.WordCloud);

const emit = defineEmits(['tag-click']);
const props = defineProps({
  autoLoad: { type: Boolean, default: true },
  minFont: { type: Number, default: 12 },
  maxFont: { type: Number, default: 46 },
  height: { type: Number, default: 540 },
  background: { type: String, default: '#fff' }
});

const store = useSearchStore();
const loading = ref(false);
const rendering = ref(false);
const shape = ref('circle');
const cloudContainer = ref(null);
const cloudCanvas = ref(null);
const highlightCanvas = ref(null);
const tooltip = ref(null);
const fallback = ref(false);
// Hover state
const hoverWord = ref('');
const hoverWeight = ref('');
const hoverDim = ref(null);
const tooltipStyle = computed(()=>{
  const d = hoverDim.value;
  if(!d) return { left:'-9999px', top:'-9999px' };
  let x, y, w;
  if(Array.isArray(d)) { x = d[0]; y = d[1]; w = d[2]; }
  else { x = d.x; y = d.y; w = d.w; }
  return { left: (x + (w||0)/2) + 'px', top: y + 'px' };
});
const resizeObserver = ref(null);
// 高级模式
const advancedOpen = ref(false);
const customShapeCode = ref('');
const customShapeFn = ref(null); // 实际使用的函数
const customShapeError = ref('');
// 样式预设：
// dynamic: 自适应缩放
// example: 模拟 WordsService 示例 (india 预设)
const stylePreset = ref('dynamic');

const rawTags = computed(() => store.tagCloud || []);
// 过滤掉长度 > 8 的标签（去除首尾空白后判定）
const tags = computed(()=> rawTags.value.filter(t => {
  const name = (t.tag || '').trim();
  return name.length > 0 && name.length <= 8;
}));

function getWeightRange() {
  if (!tags.value.length) return { min: 0, max: 0 };
  let min = Infinity, max = -Infinity;
  tags.value.forEach(t => { if (t.weight < min) min = t.weight; if (t.weight > max) max = t.weight; });
  if (min === Infinity) min = 0; if (max === -Infinity) max = 0; return { min, max };
}

function inlineStyleFor(t){
  const { min, max } = getWeightRange();
  let size = props.minFont;
  if (max > min) {
    const ratio = (t.weight - min) / (max - min);
    size = props.minFont + ratio * (props.maxFont - props.minFont);
  } else { size = (props.minFont + props.maxFont)/2; }
  return { fontSize: size + 'px' };
}

// 参考外部逻辑：取前100（或更少）聚合 -> 求和 -> (单值/总和)*100 + BASE_OFFSET
const TOP_N = 100;
const BASE_OFFSET = 6; // 确保最小字号有基础权重
let currentMaxWeight = 1; // 记录当前最大权重(转换后)
function buildList(){
  // 排序（权重降序）
  const sorted = [...tags.value].sort((a,b)=> (b.weight||0) - (a.weight||0));
  const picked = sorted.slice(0, TOP_N);
  const sum = picked.reduce((s,t)=> s + (t.weight || 0), 0) || 1;
  // 生成加 baseline 的百分比权重
  const list = picked.map(t => {
    const w = (t.weight || 0);
    const percent = (w / sum) * 100; // 0~100
    const finalW = Number((percent + BASE_OFFSET).toFixed(4)); // 一致性
    return [t.tag, finalW];
  });
  currentMaxWeight = list.reduce((m,i)=> i[1] > m ? i[1] : m, BASE_OFFSET);
  return list;
}

function colorFunc(_word, weight){
  // weight 范围: BASE_OFFSET ~ currentMaxWeight (~106) -> 归一到 0~1
  const p = Math.min(Math.max((weight - BASE_OFFSET)/(currentMaxWeight - BASE_OFFSET || 1), 0), 1);
  const h = Math.round(210 - p * 170);
  const s = 52 + Math.round(p * 30);
  const l = 34 + Math.round(p * 18);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// (旧 stray 预设逻辑已移除，转移到 renderCloud 内部分支)
let renderTimer = null;
function scheduleRender(delay=40){
  if(renderTimer) { clearTimeout(renderTimer); }
  renderTimer = setTimeout(()=>{ renderCloud(); }, delay);
}

function clearCanvas(){
  const canvas = cloudCanvas.value;
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx && ctx.clearRect(0,0,canvas.width, canvas.height);
  const hcv = highlightCanvas.value; if(hcv){ const hctx = hcv.getContext('2d'); hctx && hctx.clearRect(0,0,hcv.width,hcv.height); }
  hoverWord.value=''; hoverWeight.value='';
}

function renderCloud(){
  if(!tags.value.length){ clearCanvas(); return; }
  if(!cloudContainer.value){ return; }
  rendering.value = true;
  nextTick(()=>{
    try {
      const el = cloudCanvas.value || cloudContainer.value;
  const rect = cloudContainer.value.getBoundingClientRect();
      // Set canvas size
      if(cloudCanvas.value){
        const dpr = window.devicePixelRatio || 1;
        cloudCanvas.value.width = rect.width * dpr;
        cloudCanvas.value.height = props.height * dpr;
        cloudCanvas.value.style.width = rect.width + 'px';
        cloudCanvas.value.style.height = props.height + 'px';
        const ctx = cloudCanvas.value.getContext('2d');
        ctx.setTransform(dpr,0,0,dpr,0,0);
        ctx.fillStyle = props.background;
        ctx.fillRect(0,0,rect.width, props.height);
      }
      if(highlightCanvas.value){
        const dpr = window.devicePixelRatio || 1;
        // 与主 canvas 保持一致
        highlightCanvas.value.width = rect.width * dpr;
        highlightCanvas.value.height = props.height * dpr;
        highlightCanvas.value.style.width = rect.width + 'px';
        highlightCanvas.value.style.height = props.height + 'px';
        const hctx = highlightCanvas.value.getContext('2d');
        hctx.setTransform(dpr,0,0,dpr,0,0);
        hctx.clearRect(0,0,rect.width, props.height);
      }
  const list = buildList();
  // ensure default origin center for non-cardioid shapes to keep items centered
  const defaultOrigin = [Math.floor(rect.width/2), Math.floor(props.height/2)];
      // 根据词数量自适应 gridSize，保证内容尽量排满
  const dpr = window.devicePixelRatio || 1;
  // 动态模式使用更小基准：基准 3，范围 [2,8]
  const adaptiveGrid = Math.min(8, Math.max(2, Math.round(3 * dpr)));
  // 针对心形(cardioid)内容偏下问题，上移一定比例
  const isCardioid = (shape.value === 'cardioid');
  const HEART_SHIFT_RATIO = 0.14; // 上移 14% 高度，可按需微调
  const originOverride = isCardioid ? [rect.width / 2, props.height * (0.5 - HEART_SHIFT_RATIO)] : null;
      // 自适应最大字体：避免最大标签超出画布宽度
      let effectiveMaxFont = props.maxFont;
      if(list.length){
        const maxWord = list.reduce((a,b)=> (b[1]>a[1]?b:a));
        const wordText = maxWord[0];
        // 估算某字体大小下文本宽度（中文/英文混合平均宽度系数 0.55）
        const avgCharFactor = 0.55; // 可调
        let estimatedWidth = effectiveMaxFont * wordText.length * avgCharFactor;
        let tries = 0;
        while(estimatedWidth > rect.width * 0.92 && effectiveMaxFont > props.minFont && tries < 6){
          effectiveMaxFont = Math.max(props.minFont, Math.floor(effectiveMaxFont * 0.9));
          estimatedWidth = effectiveMaxFont * wordText.length * avgCharFactor;
          tries++;
        }
        // 进一步基于总体面积（粗估）限制：∑(font^2) ~ 面积
        const approxTotalArea = list.reduce((sum, item)=>{
          const ratio = Math.min(Math.max((item[1]-1)/100,0),1);
          const f = props.minFont + ratio * (effectiveMaxFont - props.minFont);
          return sum + f * f * 0.6; // 0.6 填充密度系数
        },0);
        const canvasArea = rect.width * props.height;
        if(approxTotalArea > canvasArea * 1.35){
          const scale = Math.sqrt((canvasArea * 1.35)/approxTotalArea);
          effectiveMaxFont = Math.max(props.minFont, Math.floor(props.minFont + (effectiveMaxFont - props.minFont)*scale));
        }
      }

      let wcOptions;
  // 兼容旧值 example-min -> dynamic
  if(stylePreset.value === 'example-min') stylePreset.value = 'dynamic';

  if(stylePreset.value === 'example' || stylePreset.value === 'example-india-2') {
        // 从 WordsService 示例载入 'india' 预设
        const preset = getExamplePreset(stylePreset.value === 'example-india-2' ? 'india_2' : 'india');
        wcOptions = preset ? {
          list,
          ...preset,
      origin: originOverride || preset.origin || defaultOrigin,
          click: function(item){ if(item && item[0]) handleClick(item[0]); },
          hover: function(item, dimension){
            if(!cloudContainer.value) return;
            const container = cloudContainer.value;
            if(item){
              container.style.cursor='pointer';
              hoverWord.value = item[0];
              hoverWeight.value = item[1];
              hoverDim.value = dimension;
              drawHighlight(dimension, item);
            } else {
              container.style.cursor='default';
              hoverWord.value=''; hoverWeight.value=''; hoverDim.value=null; clearHighlight();
            }
          },
          done: function(){ rendering.value=false; }
        } : { list };
  } else { // dynamic 模式参照示例风格
        const example = getExamplePreset('india');
        const baseGrid = example ? example.gridSize : 4;
        const egDprGrid = Math.max(2, Math.round(baseGrid * dpr));
        // 线性映射：保持与示例 weightFactor:1 类似的比例，再缩放到字号区间
        const span = (effectiveMaxFont - props.minFont) * 0.85; // 稍压缩，避免过大
  wcOptions = {
          list,
          shape: (shape.value === 'custom' && customShapeFn.value) ? customShapeFn.value : shape.value,
          gridSize: egDprGrid,
          fontFamily: example?.fontFamily || undefined,
          weightFactor: function(weight){
            if(weight <= 0) return 0;
            const linear = (weight - BASE_OFFSET) / (currentMaxWeight - BASE_OFFSET || 1); // 0~1
            let size = props.minFont + linear * span;
            const cap = props.minFont * 5; // 保持紧凑
            if(size > cap) size = cap;
            return size;
          },
          color: (props.background === '#fff') ? 'random-dark' : colorFunc,
          backgroundColor: props.background === '#fff' ? 'transparent' : props.background,
          rotateRatio: example?.rotateRatio ?? 0.5,
          rotationSteps: 2,
          minRotation: -Math.PI/6,
          maxRotation: Math.PI/6,
          shuffle: true,
          drawOutOfBound: false,
          origin: null,
          abortThreshold: 1500,
          ...(originOverride ? { origin: originOverride } : { origin: defaultOrigin }),
          click: function(item){ if(item && item[0]) handleClick(item[0]); },
          hover: function(item, dimension){
            if(!cloudContainer.value) return;
            const container = cloudContainer.value;
            if(item){
              container.style.cursor='pointer';
              hoverWord.value = item[0];
              hoverWeight.value = item[1];
              hoverDim.value = dimension;
              drawHighlight(dimension, item);
              if(tooltip.value){ tooltip.value.style.transform = 'translate(-50%, -100%) translateY(-6px)'; }
            } else {
              container.style.cursor='default';
              hoverWord.value=''; hoverWeight.value=''; hoverDim.value=null; clearHighlight();
            }
          },
          abort: function(){ rendering.value=false; },
          wait: 10,
          classes: function(_word, weight){
            const p = (weight - BASE_OFFSET) / (currentMaxWeight - BASE_OFFSET || 1);
            return p > 0.66 ? 'wc-heavy' : (p > 0.33 ? 'wc-medium' : 'wc-light');
          },
          done: function(){ rendering.value=false; }
        };
      }
  try {
  const inspect = { ...wcOptions };
        inspect.listSample = inspect.list.slice(0,8);
        inspect.totalWords = inspect.list.length;
        inspect.weightFactor = '(fn)';
        inspect.color = '(fn)';
        inspect.classes = '(fn)';
        inspect.hover = '(fn)';
        inspect.click = '(fn)';
        inspect.shape = (typeof wcOptions.shape === 'function') ? '(custom function)' : wcOptions.shape;
        inspect.maxComputedWeight = currentMaxWeight;
        inspect.baseOffset = BASE_OFFSET;
        inspect.effectiveMaxFont = effectiveMaxFont;
  inspect.gridSize = wcOptions.gridSize;
  inspect.adaptiveGridBase = adaptiveGrid;
  inspect.dpr = window.devicePixelRatio || 1;
  inspect.stylePreset = stylePreset.value;
        inspect.origin = wcOptions.origin || '(auto)';
        console.log('[TagCloud][WordCloud options]', inspect);
  } catch{ /* log ignore */ }
      WordCloud(el, wcOptions);
      // Attach click fallback on container: if WordCloud click didn't fire, use last hoverWord
      try {
        if (cloudContainer.value && !cloudContainer.value.__tagCloudClickAttached) {
          cloudContainer.value.addEventListener('click', (ev)=>{
            // prefer WordCloud's click; fallback to hoverWord when clicking on canvas
            if (hoverWord.value) { handleClick(hoverWord.value); }
          });
          cloudContainer.value.__tagCloudClickAttached = true;
        }
      } catch(e){ /* ignore */ }
    } catch(e){
      console.warn('渲染标签云失败, 使用回退模式', e);
      fallback.value = true;
    } finally {
      rendering.value = false;
    }
  });
}

async function load(){
  loading.value = true;
  try { await store.fetchTagCloud(true); }
  finally { loading.value = false; scheduleRender(0); }
}

async function onRefresh(){
  loading.value = true; rendering.value = true;
  try { await store.refreshTagCloud(); }
  finally { loading.value=false; rendering.value=false; scheduleRender(10); }
}

function handleClick(tag){ emit('tag-click', tag); }

// Watch tags change
watch(tags, ()=> scheduleRender(20));
watch(shape, ()=> scheduleRender(0));
watch(customShapeFn, ()=> { if(shape.value==='custom') scheduleRender(0); });
watch(stylePreset, ()=> scheduleRender(0));

function normalizeCustomCode(raw){
  if(!raw) return '';
  let code = raw.trim();
  if(!code) return '';
  // If starts with function or (theta)=> treat as expression returning fn
  if(/^function\s*\(/.test(code) || /^\(/.test(code) || /^theta\s*=>/.test(code)){
    return code;
  }
  // If contains 'return' treat as body of function
  if(/return\s+/.test(code)){
    return 'function(theta){' + code + '}';
  }
  // Otherwise treat last expression as implicit return
  return 'function(theta){ return ('+code+'); }';
}

function applyCustomShape(){
  customShapeError.value='';
  try {
    const normalized = normalizeCustomCode(customShapeCode.value);
    if(!normalized){ customShapeError.value='请输入函数代码'; return; }
    // sandbox new Function
    const fn = new Function('return ('+normalized+')')();
    if(typeof fn !== 'function') throw new Error('不是有效函数');
    // test
    const testVal = fn(Math.PI/3);
    if(!isFinite(testVal)) throw new Error('返回值无效');
    customShapeFn.value = fn;
    shape.value = 'custom';
    scheduleRender(0);
  } catch(e){
    customShapeFn.value = null;
    customShapeError.value = '解析失败: ' + e.message;
  }
}

function resetCustomShape(){
  customShapeFn.value = null;
  customShapeCode.value = '';
  customShapeError.value='';
  if(shape.value==='custom') shape.value='circle';
  scheduleRender(0);
}

function fillSample(){
  customShapeCode.value = 'const arr=[68,69,70,71,72,72,72,73,74];\nconst max=74;\nreturn arr[Math.floor(theta/(2*Math.PI)*arr.length)]/max;';
}

onMounted(()=>{
  if(props.autoLoad) load(); else scheduleRender(0);
  // Observe size changes safely
  if('ResizeObserver' in window){
  resizeObserver.value = new ResizeObserver(()=> scheduleRender(60));
  nextTick(()=>{ if(cloudContainer.value instanceof Element){ try { resizeObserver.value.observe(cloudContainer.value); } catch { /* ignore */ } } });
  }
});

// When tags first loaded ensure observer attached (in case mounted earlier before element existed)
let observed = false;
watch(tags, (val)=>{
  if(!observed && val.length && resizeObserver.value && cloudContainer.value instanceof Element){
    try { resizeObserver.value.observe(cloudContainer.value); observed = true; } catch { /* ignore */ }
  }
});

onBeforeUnmount(()=>{ if(resizeObserver.value){ try { resizeObserver.value.disconnect(); } catch { /* ignore */ } } });

function clearHighlight(){
  const hc = highlightCanvas.value; if(!hc) return; const ctx = hc.getContext('2d'); if(!ctx) return; ctx.clearRect(0,0,hc.width,hc.height);
}

function drawHighlight(dimension, _item){
  const hc = highlightCanvas.value; if(!hc || !dimension) return; const ctx = hc.getContext('2d'); if(!ctx) return; ctx.clearRect(0,0,hc.width,hc.height);
  let x, y, w, h;
  if(Array.isArray(dimension)) { [x,y,w,h] = dimension; }
  else { ({x,y,w,h} = dimension); }
  if([x,y,w,h].some(v => typeof v !== 'number')) return; // guard
  ctx.save();
  ctx.fillStyle = 'rgba(64,158,255,0.18)';
  ctx.strokeStyle = 'rgba(64,158,255,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const rx = x-4, ry = y-2, rw = w+8, rh = h+4;
  ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, 4) : ctx.rect(rx, ry, rw, rh);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
</script>
<style scoped>
.tag-cloud-wrapper{padding:8px 10px 18px; border:1px solid #ebeef5; border-radius:8px; background:var(--el-bg-color,#fff); position:relative;}
.cloud-toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;gap:8px;flex-wrap:wrap;}
.left-info{display:flex;align-items:center;gap:8px;}
.right-actions{display:flex;align-items:center;gap:8px;}
.title{font-weight:600;font-size:14px;}
.loading{font-size:12px;color:#909399;}
.meta{font-size:12px;color:#666;}
.cloud-canvas-wrapper{position:relative;width:100%;height:100%;min-height:180px;}
.cloud-canvas-wrapper canvas{width:100%;height:100%;display:block;border-radius:4px;}
.cloud-canvas-wrapper .highlight-layer{position:absolute;left:0;top:0;pointer-events:none;}
.rendering-overlay{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:13px;background:rgba(255,255,255,0.6);backdrop-filter:blur(2px);color:#666;}
/* Fallback list */
.fallback-list{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;}
.fallback-item{cursor:pointer;user-select:none;padding:4px 6px;border-radius:4px;transition:all .15s;background:linear-gradient(145deg,#f6f8fa,#eef3ff);} 
.fallback-item:hover{background:#409eff;color:#fff;transform:translateY(-2px);} 
/* WordCloud injected elements (if DOM mode) */
:deep(.wc-heavy){font-weight:700;}
:deep(.wc-medium){font-weight:500;}
:deep(.wc-light){font-weight:400;opacity:.9;}
.advanced-panel{margin-top:6px;padding:8px 10px 10px;border:1px dashed #dcdfe6;border-radius:6px;background:#fafafa;}
.panel-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
.panel-title{font-size:13px;font-weight:600;color:#333;}
.panel-actions{display:flex;gap:6px;}
.help-row{display:flex;justify-content:space-between;align-items:center;margin-top:4px;}
.hint{font-size:12px;color:#888;}
.error{margin-top:4px;font-size:12px;color:#d93026;}
.fade-enter-active,.fade-leave-active{transition:all .18s ease;}
.fade-enter-from,.fade-leave-to{opacity:0;transform:translateY(-4px);} 
.wc-tooltip{position:absolute;z-index:3;pointer-events:none;background:rgba(0,0,0,0.68);color:#fff;padding:4px 8px;font-size:12px;line-height:1;border-radius:4px;white-space:nowrap;transform:translate(-50%, -100%) translateY(-6px);box-shadow:0 2px 6px rgba(0,0,0,0.25);}
</style>
