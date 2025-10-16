import api, {appsApi, getUserInfo} from './api';
import {ElMessage} from 'element-plus';
import {mapDocTypeCodeToTab, mapExtToTab} from '../constants/fileTypes';
import {normalizeFile} from '../constants/fileModel';

// Mock data for development

function transformResponse(data) {
    const list = data?.fileList || [];
    // 标准化
    const normalized = list.map(raw => {
        const norm = normalizeFile(raw);
        // 预览摘要补充（若标准化后没有）
        if (!norm.preview) {
            norm.preview = raw.fileSummary || raw.fileSummaryTranslate || raw.fileContents || raw.fileTranslate || '';
        }
        // 保留后端缩略图字段到统一 thumbUrl（normalize 已处理，若后端提供其他命名确保赋值）
        if (!norm.thumbUrl) {
            norm.thumbUrl = raw.thumbUrl || raw.thumb || raw.fsFileThumb || '';
        }
        // 分值
        if (raw.score != null && norm.score == null) norm.score = raw.score;
        return norm;
    });
    // 计算前端分类 type（沿用旧字段名，便于 UI 继续工作）
    const results = normalized.map(f => {
        const tab = f.docType != null ? mapDocTypeCodeToTab(Number(f.docType)) : mapExtToTab(f.fileType);
        return {...f, type: tab};
    });
    // 统计 tabCounts（若后端未给 types）
    let tabCounts;
    if (data?.types && typeof data.types === 'object') {
        const types = data.types;
        tabCounts = {
            all: data.total || results.length,
            document: types.document || 0,
            image: types.image || 0,
            multimedia: types.multimedia || 0,
            archive: types.archive || 0,
            other: types.other || 0
        };
    } else {
        const counter = {document: 0, image: 0, multimedia: 0, archive: 0, other: 0};
        results.forEach(r => {
            if (counter[r.type] != null) counter[r.type]++; else counter.other++;
        });
        tabCounts = {all: data?.total || results.length, ...counter};
    }
    return {results, pagination: {total: data?.total || results.length}, tabCounts};
}

class SearchService {
    async search(builtParams, imageFile = null) {
        const url = '/admin-api/rag/documents/search';
        const {offset, limit, ...rest} = builtParams;

        try {
            let root;
            const user = getUserInfo() || {};

            if (imageFile) {
                const form = new FormData();
                Object.entries(rest).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') form.append(k, v);
                });
                if (user.userId) form.append('userId', user.userId);
                form.append('offset', offset);
                form.append('limit', limit);
                form.append('image', imageFile); // 图片搜索: 后端字段如不同请调整
                root = await api.post(url, form, {headers: {'Content-Type': 'multipart/form-data'}});
            } else {
                const formData = new URLSearchParams();
                Object.entries({...rest, offset, limit}).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== '') formData.append(k, v);
                });
                if (user.userId) formData.append('userId', user.userId);
                root = await api.post(url, formData, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
            }
            // axios 拦截器已返回 data，root 即 { code, data, msg }
            if (root?.code !== 0) throw new Error(root?.msg || '搜索失败');
            const apiData = root?.data;
            if (!apiData || !Array.isArray(apiData.fileList)) throw new Error('无数据');
            const mapped = transformResponse(apiData);
            return {...mapped, searchTime: apiData.searchTime};
        } catch (error) {
            console.warn('搜索接口失败', error);
            const msg = error?.message || '搜索失败';
            ElMessage.error(msg);
            throw error;
        }
    }

    async getFilterOptions() {
        // TODO: 替换为真实后端接口; 暂时返回空结构
        return {fileSpaces: [], creators: [], tags: [], formats: []};
    }

    // 获取创建者列表（用户列表），后端接口: /admin-api/rag/documents/users
    async getCreators(force = false) {
        if (!force && this._cachedCreators && Array.isArray(this._cachedCreators)) return this._cachedCreators;
        try {
            const root = await api.get('/admin-api/rag/documents/users');
            if (root?.code !== 0) throw new Error(root?.msg || '获取用户失败');
            const raw = Array.isArray(root.data) ? root.data : [];
            const mapped = raw.map(u => ({value: String(u.userId), label: u.userName || ('用户' + u.userId)}));
            this._cachedCreators = mapped;
            return mapped;
        } catch (e) {
            console.warn('获取创建者列表失败，使用已有或空列表', e);
            this._cachedCreators = this._cachedCreators || [];
            return this._cachedCreators;
        }
    }

    // 获取 AI 标签列表（增强标签），后端接口: /admin-api/rag/enhancement/label/all
    // 支持分页的标签查询，返回 { items: [{value,label,...}], total, page }
    async getLabels(keyword = '', page = 1, pageSize = 20) {
        try {
            const params = {page, pageSize};
            if (keyword) {
                params.keyword = keyword;
                params.label = keyword;
            }
            const root = await api.get('/admin-api/rag/enhancement/label/all', {params});
            if (root?.code !== 0) throw new Error(root?.msg || '获取标签失败');
            const dataObj = root.data || {};
            const raw = Array.isArray(dataObj.list) ? dataObj.list : [];
            const total = Number(dataObj.total) || raw.length;
            const mapped = raw.map(item => {
                const name = item.labelName || item.name || item.label || item.tagName || '';
                const id = item.id != null ? String(item.id) : name;
                return {value: id, label: name, count: item.labelCount || 0, type: item.labelType || ''};
            });
            return {items: mapped, total, page: Number(page)};
        } catch (e) {
            console.warn('获取标签失败，降级为空列表', e);
            return {items: [], total: 0, page};
        }
    }

    async getFileCount(_filters) {
        // TODO: 若有真实接口替换，此处返回 0
        return {count: 0};
    }

    async downloadFiles(filesOrIds) {
        // 批量下载：提交压缩任务 -> 轮询进度 -> 获取下载地址
        try {
            if (!Array.isArray(filesOrIds) || !filesOrIds.length) {
                ElMessage.warning('请先选择文件');
                return;
            }
            // 支持传入两种形式：
            // 1) id 数组（原有行为），2) 文件对象数组（包含 fileCategory/nasId/fileId 等）
            // Expect an array of file objects with necessary fields
            const arr = filesOrIds;
            const filesPayload = arr.map(f => {
                const isNas = (f.fileCategory === 'nas') || f.nasId || f.nasCode || f.nasFilePath || f.subPath;
                if (isNas) {
                    return {
                        fileCategory: 'nas',
                        nasCode: f.nasId || f.nasCode || '',
                        nasFilePath: f.nasFilePath || f.subPath || ''
                    };
                }
                return {fileCategory: f.fileCategory || 'public', fileId: f.fileId || f.id};
            });
            const root = await appsApi.post('/files/zip-down/task', {files: filesPayload});
            const taskId = root?.data?.taskId || root?.taskId; // apps 返回 {status, data:{taskId}}
            if (!taskId || root?.status !== 'ok') {
                ElMessage.error('创建压缩任务失败');
                return;
            }
            const notify = ElMessage({
                type: 'info',
                message: '文件压缩中... 0%',
                duration: 0,
                grouping: true,
                showClose: true
            });
            let attempts = 0;
            const maxAttempts = 150; // ~5分钟 (150 * 2s)
            const poll = async () => {
                attempts++;
                if (attempts > maxAttempts) {
                    notify.close && notify.close();
                    ElMessage.error('压缩超时，已停止');
                    return;
                }
                try {
                    const prog = await appsApi.get('/files/zip-down/task', {params: {task_id: taskId}});
                    const info = prog?.data?.result || prog?.result;
                    const innerStatus = prog?.data?.status || prog?.status; // 内层任务状态
                    const errorMsg = prog?.data?.errorMsg || prog?.errorMsg;
                    if (innerStatus === 'fail' || errorMsg) {
                        notify.close && notify.close();
                        ElMessage.error(errorMsg || '压缩失败');
                        return;
                    }
                    if (info?.downloadUrl) {
                        notify.close && notify.close();
                        const a = document.createElement('a');
                        a.href = info.downloadUrl; // 若需拼接域名可在此处理
                        a.download = '下载文件.zip';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        ElMessage.success('压缩完成，开始下载');
                    } else {
                        const percent = info?.fileDownloadProgressShow || info?.progress || '...';
                        notify.message = '文件压缩中... ' + percent;
                        setTimeout(poll, 2000);
                    }
                } catch {
                    notify.message = '查询进度失败，重试中...';
                    setTimeout(poll, 3000);
                }
            };
            poll();
        } catch (e) {
            console.warn('批量下载失败', e);
            ElMessage.error(e.message || '下载失败');
        }
    }

    async exportResults(fileIds) {
        // 前端生成 CSV，无需后端
        try {
            let rows = [];
            // 允许传入对象数组或仅 id 数组；若是对象数组直接使用
            if (Array.isArray(fileIds) && fileIds.length && typeof fileIds[0] === 'object') {
                rows = fileIds;
            } else {
                // 如果只是 id 数组，尝试从 window.__SEARCH_RESULTS__（可由外部临时挂载）获取
                if (Array.isArray(window.__SEARCH_RESULTS__)) {
                    rows = window.__SEARCH_RESULTS__.filter(r => fileIds.includes(r.id));
                } else {
                    ElMessage.warning('缺少导出数据源');
                    return;
                }
            }
            if (!rows.length) {
                ElMessage.warning('没有可导出的数据');
                return;
            }
            const headers = ['文件名称', '文件大小', '文件路径', '创建人', '上传时间', '更新人', '更新时间', '空间', '中文摘要', '译文摘要', 'AI标签', '系统标签', '文件实体', '文本翻译', '属性', '文件内容'];
            const escapeCsv = (str) => {
                if (str == null) return '""';
                const s = String(str).replace(/"/g, '""');
                return '"' + s + '"';
            };
            const formatSize = (sz) => {
                if (!sz && sz !== 0) return '';
                const units = ['B', 'KB', 'MB', 'GB', 'TB'];
                let v = Number(sz);
                let i = 0;
                while (v >= 1024 && i < units.length - 1) {
                    v /= 1024;
                    i++;
                }
                return (v.toFixed(i ? 2 : 0)) + units[i];
            };
            let csv = headers.map(h => escapeCsv(h)).join(',') + '\n';
            rows.forEach(r => {
                const aiTagVal = r && r.fileAiTag != null ? r.fileAiTag : (r && r._raw ? r._raw.fileAiTag : undefined);
                const aiTagStr = aiTagVal == null ? '' : (typeof aiTagVal === 'string' ? aiTagVal : JSON.stringify(aiTagVal));
                csv += [
                    escapeCsv(r.fileName || r.name || ''),
                    escapeCsv(formatSize(r.fileSize)),
                    escapeCsv(r.filePath || ''),
                    escapeCsv(r.createrName || ''),
                    escapeCsv(r.createTime || ''),
                    escapeCsv(r.updateUserName || ''),
                    escapeCsv(r.updateTime || ''),
                    escapeCsv(r.fileCategory || ''),
                    escapeCsv(r.fileSummary || ''),
                    escapeCsv(r.fileSummaryTranslate || ''),
                    escapeCsv(aiTagStr),
                    escapeCsv(r.fileSysTag || ''),
                    escapeCsv(r.fileEntities || ''),
                    escapeCsv(r.fileTranslate || ''),
                    escapeCsv(r.userCustomAttributes || ''),
                    escapeCsv(r.fileContents || '')
                ].join(',') + '\n';
            });
            const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8;'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = '文件导出_' + new Date().toLocaleDateString() + '.csv';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
                document.body.removeChild(link);
            }, 120);
            ElMessage.success('导出完成');
        } catch (e) {
            console.warn('前端导出失败', e);
            ElMessage.error(e.message || '导出失败');
        }
    }

    // 新增：获取聚合统计（与搜索参数一致）
    async getAggregationStats(builtParams) {
        const url = '/admin-api/rag/documents/aggregations/stats';
        try {
            const user = getUserInfo() || {};
            const formData = new URLSearchParams();
            if (user.userId) formData.append('userId', user.userId);
            Object.entries(builtParams).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') formData.append(k, v);
            });
            const root = await api.post(url, formData, {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
            if (root?.code !== 0) throw new Error(root?.msg || '聚合统计失败');
            const dataObj = root?.data || {};
            // 新结构: data.docType 是数组 [{ key: '2', count: 6 }, ...]
            const docTypeArr = Array.isArray(dataObj.docType) ? dataObj.docType : [];
            const counts = {document: 0, image: 0, multimedia: 0, archive: 0, other: 0};
            docTypeArr.forEach(item => {
                const code = Number(item.key);
                const tab = mapDocTypeCodeToTab(code);
                if (counts[tab] != null) counts[tab] += item.count || 0; else counts.other += item.count || 0;
            });
            // fileCategory 目前不直接影响 tabs，如需可返回
            return counts;
        } catch (e) {
            console.warn('获取聚合统计失败，忽略并使用搜索结果内统计', e);
            return {};
        }
    }
}

export const searchService = new SearchService();