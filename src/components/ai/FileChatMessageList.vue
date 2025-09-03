<template>
  <div class="fc-ml-root" ref="container" @scroll="handleScroll">
    <div v-if="!list.length && !streaming" class="empty">暂无消息</div>
    <div class="chat-list">
      <div v-for="m in list" :key="m.id" class="message-item" :class="m.role==='user' ? 'right-message' : 'left-message'">
        <div class="avatar-wrapper">
          <div class="avatar-circle" :class="m.role">{{ m.role==='user' ? userAvatarText : aiAvatarText }}</div>
        </div>
        <div class="message-body">
          <div class="meta">
            <span class="time">{{ formatTime(m.createdAt) }}</span>
            <el-tag v-if="m.status==='error'" size="small" type="danger">错误</el-tag>
            <el-tag v-else-if="m.status==='aborted'" size="small" type="warning">已停止</el-tag>
            <el-tag v-else-if="m.status==='streaming'" size="small" type="info">生成中</el-tag>
          </div>
          <div class="bubble-text" :class="m.role">
            <span v-if="m.status==='streaming'">{{ m.content }}<span class="cursor"/></span>
            <span v-else>{{ m.content }}</span>
          </div>
          <div v-if="m.references && m.references.length" class="refs">
            <div class="ref-item" v-for="(r,i) in m.references" :key="i" :title="r.text || r.title || ''">参考{{ i+1 }}</div>
          </div>
          <div class="ops-row" :class="m.role">
            <el-tooltip content="复制" placement="top"><el-button link size="small" @click.stop="emitCopy(m)"><el-icon><DocumentCopy /></el-icon></el-button></el-tooltip>
            <el-tooltip v-if="m.role==='assistant' && (m.status==='error' || m.status==='aborted')" content="重试" placement="top"><el-button link size="small" :disabled="streaming" @click.stop="emitRetry(m)"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
            <el-tooltip v-if="m.role==='assistant' && m.status==='done'" content="重新生成" placement="top"><el-button link size="small" :disabled="streaming" @click.stop="emitRetry(m)"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
            <el-tooltip v-if="m.role==='user' && m.status==='done'" content="重发" placement="top"><el-button link size="small" :disabled="streaming" @click.stop="emitResend(m)"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
            <el-tooltip v-if="m.role==='user' && m.status==='done'" content="编辑" placement="top"><el-button link size="small" :disabled="streaming" @click.stop="emitEdit(m)"><el-icon><Edit /></el-icon></el-button></el-tooltip>
            <el-tooltip v-if="m.status!=='streaming'" content="删除" placement="top"><el-button link size="small" :disabled="streaming" @click.stop="emitDelete(m)"><el-icon><Close /></el-icon></el-button></el-tooltip>
          </div>
        </div>
      </div>
    </div>
    <div v-if="streaming" class="streaming-tip">生成中...(Esc 停止)</div>
    <div v-if="showScrollBtn" class="scroll-to-bottom" @click="scrollToBottom">回到底部</div>
  </div>
</template>
<script setup>
import { ref, watch, nextTick } from 'vue';
import { DocumentCopy, RefreshRight, Edit, Close } from '@element-plus/icons-vue';

const props = defineProps({
  list: { type: Array, default: () => [] },
  streaming: { type: Boolean, default: false },
  userAvatarText: { type: String, default: '我' },
  aiAvatarText: { type: String, default: 'AI' }
});
const emits = defineEmits(['copy','retry','resend','edit','delete']);

const container = ref(null);
const showScrollBtn = ref(false);

function formatTime(ts){ try { const d=new Date(ts); const pad=n=> String(n).padStart(2,'0'); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; } catch { return ''; } }
function emitCopy(m){ emits('copy', m); }
function emitRetry(m){ emits('retry', m); }
function emitResend(m){ emits('resend', m); }
function emitEdit(m){ emits('edit', m); }
function emitDelete(m){ emits('delete', m); }

function scrollToBottom(){ const el = container.value; if(!el) return; el.scrollTop = el.scrollHeight; showScrollBtn.value=false; }
function scrollToTop(){ const el = container.value; if(!el) return; el.scrollTop = 0; }
function handleScroll(){ const el=container.value; if(!el) return; const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120; showScrollBtn.value = !nearBottom; }

watch(()=>props.list.length, ()=> nextTick(scrollToBottom));
watch(()=>props.streaming, (v)=>{ if(v) nextTick(scrollToBottom); });

function exposeApi(){ return { scrollToBottom, scrollToTop }; }
// expose
// eslint-disable-next-line no-undef
defineExpose(exposeApi());
</script>
<style scoped>
.fc-ml-root{position:relative;flex:1;overflow:auto;padding:16px;scroll-behavior:smooth;background:#fff;}
.empty{margin-top:40px;text-align:center;color:#909399;font-size:13px;}
.chat-list{display:flex;flex-direction:column;gap:28px;}
.message-item{display:flex;align-items:flex-start;gap:12px;}
.message-item.right-message{flex-direction:row-reverse;}
.avatar-wrapper{width:40px;display:flex;justify-content:center;}
.avatar-circle{width:36px;height:36px;border-radius:50%;background:#409eff;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.15);}
.avatar-circle.user{background:#67c23a;}
.message-body{flex:1;min-width:0;display:flex;flex-direction:column;}
.message-body .meta{font-size:12px;color:#909399;display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.message-item.right-message .message-body .meta{justify-content:flex-end;text-align:right;}
.bubble-text{display:inline-block;max-width:780px;white-space:pre-wrap;word-break:break-word;line-height:1.6;font-size:14px;padding:10px 14px;border-radius:12px;background:#f5f6f7;position:relative;align-self:flex-start;box-sizing:border-box;}
.bubble-text.user{background:#409eff;color:#fff;align-self:flex-end;}
.refs{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px;}
.refs .ref-item{background:#eef2f5;padding:2px 6px;border-radius:4px;font-size:12px;color:#606266;cursor:default;}
.ops-row{display:flex;gap:6px;margin-top:6px;font-size:12px;opacity:.85;}
.ops-row.user{justify-content:flex-end;}
.ops-row .el-button{padding:0 4px;}
.cursor{display:inline-block;width:6px;background:#409eff;margin-left:2px;animation:blink 1s steps(1) infinite;height:14px;vertical-align:baseline;}
.bubble-text.user .cursor{background:#fff;}
.streaming-tip{position:sticky;bottom:0;text-align:center;font-size:12px;color:#909399;padding:6px 0;}
.scroll-to-bottom{position:absolute;right:16px;bottom:16px;background:#409eff;color:#fff;padding:4px 10px;border-radius:20px;cursor:pointer;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.15);} 
@keyframes blink{50%{opacity:0;}}
</style>
