<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import FluentEditor from '@opentiny/fluent-editor'
import '@opentiny/fluent-editor/style.css'

interface Props {
  modelValue: string
  readonly?: boolean
  placeholder?: string
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  placeholder: '请输入内容...'
})
const emit = defineEmits<{
  (e:'update:modelValue', v:string):void
  (e:'change', v:string):void
}>()

const rootEl = ref<HTMLElement | null>(null)
let editor: any = null
let innerChanging = false
let observer: MutationObserver | null = null
let elId = ''

const toolbarItems = [
  'undo','redo','|',
  'bold','italic','underline','strike','|',
  'heading','blockquote','code','link','image','|',
  'ol','ul','table','|',
  'align-left','align-center','align-right','|',
  'clean','fullscreen','preview'
]

function getEditorHtml() {
  if (!editor) return ''
  return editor.getHtml?.()
    ?? editor.getHTML?.()
    ?? editor.getContent?.()
    ?? editor.getValue?.()
    ?? ''
}
function setEditorHtml(v: string) {
  if (!editor) return
  const val = v || ''
  if (editor.setHtml) editor.setHtml(val)
  else if (editor.setHTML) editor.setHTML(val)
  else if (editor.setContent) editor.setContent(val)
  else if (editor.setValue) editor.setValue(val)
}

function bindChangeEvents() {
  if (!editor) return
  let bound = false
  if (editor.on) {
    editor.on('change', handleEditorChange)
    editor.on('text-change', handleEditorChange)
    bound = true
  } else if (editor.addListener) {
    editor.addListener('change', handleEditorChange)
    bound = true
  }
  if (!bound && rootEl.value) {
    observer = new MutationObserver(() => handleEditorChange())
    observer.observe(rootEl.value, { childList: true, subtree: true, characterData: true })
  }
}

function initEditor() {
  if (!rootEl.value) return
  // 统一使用数组 toolbar，避免 value.trim 报错
  const options: any = {
    content: props.modelValue,
    value: props.modelValue,
    readOnly: props.readonly,
    placeholder: props.placeholder,
    toolbar: toolbarItems,
    language: 'zh-CN'
  }
  // 优先 (el, options) 签名
  try {
    editor = new (FluentEditor as any)(rootEl.value, options)
  } catch (e1) {
    console.warn('[OpenTinyEditor] (el, options) 签名失败，尝试对象签名', e1)
    try {
      editor = new (FluentEditor as any)({ el: rootEl.value, ...options })
    } catch (e2) {
      console.error('[OpenTinyEditor] 初始化失败', e2)
      return
    }
  }
  if (!editor) return
  // ready 事件（若存在）
  if (editor.on) {
    editor.on('ready', () => {
      if (props.modelValue) setEditorHtml(props.modelValue)
    })
  }
  if (props.modelValue && !getEditorHtml()) setEditorHtml(props.modelValue)
  bindChangeEvents()
  console.info('[OpenTinyEditor] 初始化成功')
}

function handleEditorChange() {
  if (!editor) return
  const html = getEditorHtml()
  innerChanging = true
  emit('update:modelValue', html)
  emit('change', html)
  innerChanging = false
}

watch(() => props.modelValue, (v) => {
  if (!editor || innerChanging) return
  const current = getEditorHtml()
  if (v !== current) setEditorHtml(v || '')
})

watch(() => props.readonly, (ro) => {
  if (!editor) return
  if (editor.setReadOnly) editor.setReadOnly(ro)
  else editor.readOnly = ro
})

watch(() => props.placeholder, (ph) => {
  if (!editor) return
  if (editor.setPlaceholder) editor.setPlaceholder(ph)
})

onMounted(async () => {
  await nextTick()
  initEditor()
})

onBeforeUnmount(() => {
  if (observer) { observer.disconnect(); observer = null }
  if (editor?.destroy) editor.destroy()
  editor = null
})
</script>

<template>
  <div class="ot-editor-wrapper">
    <div ref="rootEl" class="ot-editor-host"></div>
  </div>
</template>

<style scoped>
.ot-editor-wrapper { flex:1; width:100%; display:flex; flex-direction:column; position:relative; }
.ot-editor-host { flex:1; width:100%; min-height:260px; }
.ot-editor-wrapper:focus-within { outline:2px solid rgba(22,113,242,.25); outline-offset:2px; border-radius: var(--border-radius-sm); }
/* 适配可能注入的内部主容器类名（猜测常见类） */
.ot-editor-host :deep(.fluent-editor),
.ot-editor-host :deep(.tiny-editor),
.ot-editor-host :deep(.editor) {
  min-height:240px;
}
</style>