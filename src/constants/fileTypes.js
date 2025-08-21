// 系统文件类型与聚合 docType 编码常量集中管理
// 后端 docType 约定：
// 0: UNKNOWN  (默认)
// 1: PIC      (图片)
// 2: DOC      (文档)
// 3: AUDIO    (音频)
// 4: VIDEO    (视频)
// 5: APP      (可执行 / 应用包等)
// 6: ZIP      (压缩包)

export const DOC_TYPE_CODE = Object.freeze({
  UNKNOWN: 0,
  PIC: 1,
  DOC: 2,
  AUDIO: 3,
  VIDEO: 4,
  APP: 5,
  ZIP: 6
});

// 前端标签页 key 与业务含义统一
export const TAB_KEYS = Object.freeze({
  ALL: 'all',
  DOCUMENT: 'document',
  IMAGE: 'image',
  MULTIMEDIA: 'multimedia',
  ARCHIVE: 'archive',
  OTHER: 'other'
});

// docType 数值 -> 前端标签页映射
export const DOC_TYPE_TO_TAB = {
  [DOC_TYPE_CODE.PIC]: TAB_KEYS.IMAGE,
  [DOC_TYPE_CODE.DOC]: TAB_KEYS.DOCUMENT,
  [DOC_TYPE_CODE.AUDIO]: TAB_KEYS.MULTIMEDIA,
  [DOC_TYPE_CODE.VIDEO]: TAB_KEYS.MULTIMEDIA,
  [DOC_TYPE_CODE.APP]: TAB_KEYS.OTHER,
  [DOC_TYPE_CODE.ZIP]: TAB_KEYS.ARCHIVE,
  [DOC_TYPE_CODE.UNKNOWN]: TAB_KEYS.OTHER
};

export function mapDocTypeCodeToTab(docType) {
  return DOC_TYPE_TO_TAB[docType] || TAB_KEYS.OTHER;
}

// 基于扩展名的兜底分类 -> 与 tabs 一致
export function mapExtToTab(ext) {
  const e = (ext || '').toLowerCase();
  if (['pdf','doc','docx','txt','xls','xlsx','ppt','pptx','md','json'].includes(e)) return TAB_KEYS.DOCUMENT;
  if (['jpg','jpeg','png','gif','webp','svg'].includes(e)) return TAB_KEYS.IMAGE;
  if (['mp4','mov','avi','mp3','wav'].includes(e)) return TAB_KEYS.MULTIMEDIA;
  if (['zip','rar','7z'].includes(e)) return TAB_KEYS.ARCHIVE;
  return TAB_KEYS.OTHER;
}

export const TAB_TO_DOC_TYPE_PARAM = Object.freeze({
  document: String(DOC_TYPE_CODE.DOC),        // 2
  image: String(DOC_TYPE_CODE.PIC),          // 1
  multimedia: `${DOC_TYPE_CODE.AUDIO},${DOC_TYPE_CODE.VIDEO}` , // '3,4'
  archive: String(DOC_TYPE_CODE.ZIP),        // 6
  other: String(DOC_TYPE_CODE.UNKNOWN)       // 0
  // all: 不传 / 空
});

export function tabToDocTypeParam(tabKey) {
  return TAB_TO_DOC_TYPE_PARAM[tabKey]; // 未命中返回 undefined
}


//文件预览类型
export const FILE_TYPE = {
    pic: ['jpg', 'jpeg','jpge', 'png', 'gif', 'ico', 'bpm', 'psd', 'pic', 'svg', 'eps', 'cdr', 'ai', 'ps', 'wmf','heic','tif','tiff','bmp'],
    audio: ['wav', 'au', 'aif', 'mp3', 'ram', 'wma', 'amr', 'aac', 'ogg', 'flac', 'mid'],
    video: ['avi', 'mpg', 'mov', 'swf', 'mp4', 'rm', 'rmvb','vob',
        'mkg', 'dvi', 'flv', '3gp', 'wmv', 'vcd', 'svcd', 'dvd', 'mkv'],
    zip: ['zip', 'tar', 'gz', 'rar', 'iso', 'exe', 'bak'],
    doc: ['ppt', 'pptx', 'doc', 'docx', 'wps', 'pps', 'pptm', 'xls', 'xlsx', 'xlt', 'xltm', 'xlsm', 'xlts', 'xlw', 'vsd', 'vsdx', 'dot', 'pdf', 'rtf', 'dwg', 'dxf', 'html', 'htm'],
    shell: ['txt', 'md', 'c', 'vc', 'conf', 'java', 'php', 'py', 'js', 'm', 'h', 'mm', 'cpp', 'log','json'],
    pcb: ['pcb', 'prjpcb']
}
