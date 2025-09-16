// 全局统一的文件对象模型与工具方法
// 使用场景：搜索结果列表、预览页、AI 工具调用、下载/权限申请等
// 说明：后端可能返回的字段名不一致，这里集中做一次标准化，前端其它模块尽量只依赖标准字段。

/**
 * 标准文件对象字段约定 (全部可选，未返回则为 null/默认值)
 * 关键统一别名：
 *  id => fileId (保持与现有组件使用 id 的兼容)
 *  name => fileName
 *  size => fileSize (字节)
 *  creator => createrName
 */
export const DEFAULT_FILE_OBJECT = Object.freeze({
  // 基础标识
  fileId: null,            // 主键 ID
  id: null,                // 兼容旧组件 (与 fileId 相同)
  parentId: null,
  parentIds: null,
  fsFileId: null,
  taskId: null,
  fileVersion: null,

  // 路径 / 分类
  fileCategory: 'public',  // public / private / nas / share
  filePath: '',            // 目录路径(以 / 结尾)
  rootPath: null,
  subPath: null,
  folder: false,           // 是否文件夹
  historyVersion: false,   // 是否历史版本

  // 文件名称 / 类型 / 存储引用
  fileName: '',
  name: '',                // 别名 (与 fileName 保持同步)
  fileType: '',            // 解析出的扩展名或类型 (pdf, txt, png ...)
  fsFileName: '',          // 存储系统真实名 (如 fastdfs key)
  fsFileThumb: null,       // 缩略图引用
  docType: null,           // 后端文档类型枚举 (数字)

  // 大小 / 热度
  fileSize: 0,             // 字节
  size: 0,                 // 别名
  hot: null,               // 热度/权重(可选)

  // 创建 / 更新 / 权限
  createrId: null,
  createrName: '',         // 原始创建者名称
  creator: '',             // 统一别名 (与 createrName 同步)
  createTime: null,
  updateUserId: null,
  updateUserName: null,
  updateTime: null,
  delStatus: 0,
  searchStatus: null,

  // NAS / 共享 / 组织
  nasId: null,
  nasFileId: null,
  groupId: null,
  deptId: null,
  shareId: null,
  topDeptFolder: null,

  // 访问 / 预览 / 内容 (前端追加态)
  hasAccess: true,         // 是否有预览权限
  applyStatus: null,       // 权限申请状态: none | pending | approved | rejected
  viewUrl: '',             // 预览 URL
  content: '',             // 预览/文本内容（裁剪）
  extractedText: '',       // 抽取文本
  preview: '',             // 搜索命中片段 (HTML)
  tags: [],                // 标签数组
  aiMeta: null,            // AI 生成的结构化元信息
  thumbUrl: '',            // 缩略图 (图片/视频)
  imageThumbnail: null,    // 后端返回的缩略图 base64 或 data URL

  // 前端辅助字段
  highlight: null,         // 高亮命中信息 (备用)
  esId: null,              // ES 文档 ID (若需要)
  pathBreadcrumb: null,    // 预处理的面包屑数组
  _raw: null               // 保留原始对象 (调试/回溯)
});

/**
 * 统一从后端/任意原始对象提取并标准化为 DEFAULT_FILE_OBJECT 结构。
 * @param {Object} raw 后端返回的文件记录
 * @returns {Object} 标准化后的文件对象（浅拷贝，可安全修改）
 */
export function normalizeFile(raw = {}) {
  if (!raw || typeof raw !== 'object') raw = {};

  const fileId = raw.fileId ?? raw.id ?? raw.fid ?? null;
  const fileName = raw.fileName ?? raw.name ?? '';
  const fileSize = Number(raw.fileSize ?? raw.size ?? 0) || 0;
  const creatorName = raw.createrName || raw.creator || raw.creatorName || '';
  const fileType = inferFileType(raw.fileType, fileName, raw.docType);
  const folder = !!(raw.folder || raw.isFolder || raw.type === 'folder');
  const fileCategory = raw.fileCategory || raw.fc || 'public';

  const obj = {
    ...DEFAULT_FILE_OBJECT,
    // 基础
    fileId,
    id: fileId,
    parentId: raw.parentId ?? null,
    parentIds: raw.parentIds ?? null,
    fsFileId: raw.fsFileId ?? null,
    taskId: raw.taskId ?? null,
    fileVersion: raw.fileVersion ?? null,
    // 路径
    fileCategory,
    filePath: raw.filePath || raw.path || '',
    rootPath: raw.rootPath ?? null,
    subPath: raw.subPath ?? null,
    folder,
    historyVersion: raw.historyVersion || false,
    // 文件属性
    fileName,
    name: fileName,
    fileType,
    fsFileName: raw.fsFileName || '',
    fsFileThumb: raw.fsFileThumb || null,
    docType: raw.docType ?? null,
    fileSize,
    size: fileSize,
    hot: raw.hot ?? null,
    // 创建更新
    createrId: raw.createrId ?? raw.creatorId ?? null,
    createrName: creatorName,
    creator: creatorName,
    createTime: raw.createTime || raw.createdTime || null,
    updateUserId: raw.updateUserId ?? null,
    updateUserName: raw.updateUserName || null,
    updateTime: raw.updateTime || raw.modifiedTime || null,
    delStatus: raw.delStatus ?? 0,
    searchStatus: raw.searchStatus ?? null,
    // 组织/共享
    nasId: raw.nasId ?? null,
    nasFileId: raw.nasFileId ?? null,
    groupId: raw.groupId ?? null,
    deptId: raw.deptId ?? null,
    shareId: raw.shareId ?? null,
    topDeptFolder: raw.topDeptFolder ?? null,
    // 权限/预览
    hasAccess: raw.hasAccess !== undefined ? !!raw.hasAccess : true,
    applyStatus: raw.applyStatus || null,
    viewUrl: raw.viewUrl || '',
    content: raw.content || '',
    extractedText: raw.extractedText || '',
    preview: raw.preview || raw.highlight || '',
    tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],
    aiMeta: raw.aiMeta || null,
    thumbUrl: raw.thumbUrl || raw.thumb || raw.fsFileThumb || '',
    // 附加
    highlight: raw.highlight || null,
    esId: raw.esId || raw.esid || null,
    pathBreadcrumb: raw.pathBreadcrumb || null,
  _raw: raw,
  // preserve any raw thumbnail fields the backend may return
  imageThumbnail: raw.imageThumbnail ?? raw.image_thumb ?? raw.thumbnail ?? null
  };

  return obj;
}

/**
 * 推断文件类型：优先后端给的 fileType；否则用扩展名；再使用 docType 映射；最后 'unknown'
 */
function inferFileType(fileType, fileName, docType) {
  if (fileType) return String(fileType).toLowerCase();
  const ext = (fileName || '').split('.').pop();
  if (ext && ext !== fileName) return ext.toLowerCase();
  if (docType !== undefined && docType !== null) return 'dtype_' + docType;
  return 'unknown';
}

/**
 * 生成用于路由跳转 (预览) 的轻量对象，避免传递过大数据。
 */
export function toPreviewLite(file) {
  const f = normalizeFile(file);
  return {
    id: f.fileId,
    fileId: f.fileId,
    fileName: f.fileName,
    name: f.fileName,
    fileType: f.fileType,
    fileCategory: f.fileCategory,
    fileSize: f.fileSize,
    size: f.size,
    fsFileId: f.fsFileId,
    filePath: f.filePath,
    nasId: f.nasId,
    groupId: f.groupId,
    creator: f.creator,
    createrName: f.createrName,
    hasAccess: f.hasAccess,
    applyStatus: f.applyStatus
  };
}

/**
 * 批量标准化工具
 */
export function normalizeFileList(list = []) { return list.map(normalizeFile); }

export default {
  DEFAULT_FILE_OBJECT,
  normalizeFile,
  normalizeFileList,
  toPreviewLite
};
