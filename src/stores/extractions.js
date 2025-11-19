import { defineStore } from 'pinia';
import { extractionsService } from '../services/extractionsService';

// 定义一个名为"extractions"的Pinia store，用于管理数据抽取相关的状态
export const useExtractionsStore = defineStore('extractions', {
    // 定义store的初始状态
    state: () => ({
        // 存储所有数据抽取记录的数组
        extractions: [],
        // 当前选中的数据抽取记录
        currentExtraction: null,
        // 可用的AI模型列表
        availableModels: [],
        // 已选中的数据抽取记录ID列表（用于批量操作）
        selectedExtractions: [],
        // 各种操作的加载状态
        loading: {
            list: false,     // 列表加载状态
            create: false,   // 创建操作状态
            update: false,   // 更新操作状态
            delete: false,   // 删除操作状态
            search: false,   // 搜索操作状态
            export: false,   // 导出操作状态
            models: false    // 模型加载状态
        },
        // 错误信息
        error: null,
        // 过滤条件
        filters: {
            form_id: null,      // 表单ID过滤
            document_id: null,  // 文档ID过滤
            status: null,       // 状态过滤
            ai_model: null,     // AI模型过滤
            start_date: null,   // 开始日期过滤
            end_date: null      // 结束日期过滤
        },
        // 搜索关键词
        searchKeyword: '',
        // 分页信息
        pagination: {
            page: 1,        // 当前页码
            pageSize: 20,   // 每页条数
            total: 0        // 总条数
        }
    }),

    // 定义计算属性（getters），用于从state中派生数据
    getters: {
        // 根据ID获取特定的数据抽取记录
        extractionById: (state) => (id) => {
            return state.extractions.find(extraction => extraction.id === parseInt(id));
        },

        // 根据文档ID获取相关联的数据抽取记录
        extractionsByDocument: (state) => (documentId) => {
            return state.extractions.filter(extraction => extraction.document_id === documentId);
        },

        // 根据表单ID获取相关联的数据抽取记录
        extractionsByForm: (state) => (formId) => {
            return state.extractions.filter(extraction => extraction.form_id === parseInt(formId));
        },

        // 统计不同状态的数据抽取记录数量
        statusCounts: (state) => {
            const counts = { completed: 0, pending: 0, error: 0 };
            state.extractions.forEach(extraction => {
                counts[extraction.status] = (counts[extraction.status] || 0) + 1;
            });
            return counts;
        },

        // 获取可用的AI模型选项（用于下拉选择等UI组件）
        availableModelOptions: (state) => {
            return state.availableModels
                .filter(model => model.available)  // 过滤出可用的模型
                .map(model => ({
                    label: `${model.name} (${model.provider})`,  // 显示标签：模型名称(提供商)
                    value: model.id  // 选项值：模型ID
                }));
        }
    },

    // 定义可以修改state的方法（actions）
    actions: {
        // 加载数据抽取记录列表
        async loadExtractions(filters = {}) {
            this.loading.list = true;  // 设置加载状态
            this.error = null;         // 清除错误信息

            try {
                // 调用服务层获取数据
                const resp = await extractionsService.getExtractions({
                    ...filters,  // 合并传入的过滤条件
                    page: this.pagination.page,      // 页码
                    pageSize: this.pagination.pageSize  // 每页条数
                });

                // 解构响应数据，提供默认值防止undefined错误
                const { list = [], total = 0, page, pageSize } = resp || {};
                this.extractions = list;  // 更新数据列表

                // 如果后端返回了分页信息，则更新本地分页状态
                if (page !== undefined) this.pagination.page = Number(page) || this.pagination.page;
                if (pageSize !== undefined) this.pagination.pageSize = Number(pageSize) || this.pagination.pageSize;
                this.pagination.total = Number(total || list.length || 0);  // 更新总条数
                return list;
            } catch (error) {
                this.error = error.message;  // 记录错误信息
                throw error;
            } finally {
                this.loading.list = false;  // 重置加载状态
            }
        },

        // 加载单个数据抽取记录详情
        async loadExtraction(id) {
            this.loading.list = true;  // 复用列表加载状态
            this.error = null;

            try {
                // 调用服务层获取单个记录
                const extraction = await extractionsService.getExtraction(id);
                this.currentExtraction = extraction;  // 更新当前记录
                return extraction;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.list = false;
            }
        },

        // 创建数据抽取记录（目前未实现）
        async createExtraction() {
            throw new Error('不支持手动创建抽取记录');
        },

        // 更新数据抽取记录（调用服务端接口）
        async updateExtraction(id, payload = {}) {
            this.loading.update = true;
            this.error = null;
            try {
                const updated = await extractionsService.updateExtraction(id, payload);
                // 更新列表中的对应项
                const idx = this.extractions.findIndex(e => String(e.id) === String(id));
                if (idx > -1) {
                    this.extractions[idx] = { ...this.extractions[idx], ...updated };
                }
                return updated;
            } catch (error) {
                this.error = error.message || error;
                throw error;
            } finally {
                this.loading.update = false;
            }
        },

        // 删除单个数据抽取记录
        async deleteExtraction(id) {
            this.loading.delete = true;  // 设置删除加载状态
            this.error = null;

            try {
                // 调用服务层删除记录
                await extractionsService.deleteExtraction(id);
                // 重新加载当前页数据
                await this.loadExtractions();
                // 如果删除的是当前选中记录，则清空当前记录
                if (this.currentExtraction?.id === parseInt(id)) {
                    this.currentExtraction = null;
                }
                return true;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.delete = false;
            }
        },

        // 批量删除数据抽取记录
        async deleteSelectedExtractions() {
            // 如果没有选中的记录，直接返回
            if (this.selectedExtractions.length === 0) return;

            this.loading.delete = true;
            this.error = null;

            try {
                // 调用服务层批量删除
                await extractionsService.deleteExtractions(this.selectedExtractions);
                this.selectedExtractions = [];  // 清空选中列表
                await this.loadExtractions();   // 重新加载数据
                return true;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.delete = false;
            }
        },

        // 搜索数据抽取记录
        async searchExtractions(keyword, filters = {}) {
            this.loading.search = true;    // 设置搜索加载状态
            this.error = null;
            this.searchKeyword = keyword;  // 保存搜索关键词

            try {
                // 调用服务层搜索
                const res = await extractionsService.searchExtractions(keyword, {
                    ...filters,
                    page: this.pagination.page,
                    pageSize: this.pagination.pageSize
                });

                // 处理不同格式的响应数据
                // 旧版本返回数组，新版本返回包含list等信息的对象
                if (Array.isArray(res)) {
                    this.extractions = res;
                    this.pagination.total = res.length;
                    return res;
                }

                // 解构新版本响应数据
                const { list = [], total = 0, page, pageSize } = res || {};
                this.extractions = list;
                if (page !== undefined) this.pagination.page = Number(page) || this.pagination.page;
                if (pageSize !== undefined) this.pagination.pageSize = Number(pageSize) || this.pagination.pageSize;
                this.pagination.total = Number(total || list.length || 0);
                return list;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.search = false;
            }
        },

        // 导出数据抽取记录
        async exportExtractions(ids, format = 'json') {
            this.loading.export = true;  // 设置导出加载状态
            this.error = null;

            try {
                // 调用服务层导出数据
                const result = await extractionsService.exportExtractions(ids, format);

                // 创建下载文件
                const blob = new Blob([
                    format === 'json' ? JSON.stringify(result.data, null, 2) : result.data
                ], {
                    type: format === 'json' ? 'application/json' : 'text/csv'
                });

                // 创建临时下载链接并触发下载
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = result.filename;  // 使用服务端返回的文件名
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);  // 释放URL对象

                return result;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.export = false;
            }
        },

        // 使用后端导出接口按表单或全部导出
        async exportByForm(params = {}) {
            this.loading.export = true;
            this.error = null;
            try {
                const res = await extractionsService.exportByForm(params);
                return res;
            } catch (e) {
                this.error = e.message || e;
                throw e;
            } finally {
                this.loading.export = false;
            }
        },

        // 加载可用的AI模型列表
        async loadAvailableModels() {
            this.loading.models = true;
            this.error = null;

            try {
                // 调用服务层获取模型列表
                const models = await extractionsService.getAvailableModels();
                this.availableModels = models;  // 更新模型列表
                return models;
            } catch (error) {
                this.error = error.message;
                throw error;
            } finally {
                this.loading.models = false;
            }
        },

        // 设置过滤条件
        setFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters };
        },

        // 清除所有过滤条件
        clearFilters() {
            this.filters = {
                form_id: null,
                document_id: null,
                status: null,
                ai_model: null,
                start_date: null,
                end_date: null
            };
        },

        // 设置选中的数据抽取记录
        setSelectedExtractions(ids) {
            this.selectedExtractions = ids;
        },

        // 切换单个记录的选中状态
        toggleSelection(id) {
            const index = this.selectedExtractions.indexOf(id);
            if (index > -1) {
                // 如果已选中，则取消选中
                this.selectedExtractions.splice(index, 1);
            } else {
                // 如果未选中，则添加到选中列表
                this.selectedExtractions.push(id);
            }
        },

        // 全选当前页的所有记录
        selectAll() {
            this.selectedExtractions = this.extractions.map(e => e.id);
        },

        // 清除所有选中
        clearSelection() {
            this.selectedExtractions = [];
        },

        // 设置当前选中的记录
        setCurrentExtraction(extraction) {
            this.currentExtraction = extraction;
        },

        // 清除当前选中的记录
        clearCurrentExtraction() {
            this.currentExtraction = null;
        },

        // 清除搜索关键词
        clearSearch() {
            this.searchKeyword = '';
        },

        // 清除错误信息
        clearError() {
            this.error = null;
        },

        // 设置分页信息
        setPagination(page, pageSize) {
            this.pagination.page = page;
            this.pagination.pageSize = pageSize;
        },

        // 根据表单结构将平面数据转换为结构化数据
        generateFormStructuredData(flatData, formStructure) {
            const structured = {};

            // 如果没有表单结构，直接返回原始数据
            if (!formStructure || !formStructure.fields) {
                return flatData;
            }

            // 遍历表单字段定义
            formStructure.fields.forEach(field => {
                if (field.type === 'object' && field.fields) {
                    // 处理对象类型字段
                    structured[field.name] = {};
                    field.fields.forEach(subField => {
                        if (flatData[subField.name] !== undefined) {
                            structured[field.name][subField.name] = flatData[subField.name];
                        }
                    });
                } else if (field.type === 'array' && field.fields) {
                    // 处理数组类型字段
                    structured[field.name] = flatData[field.name] || [];
                } else {
                    // 处理普通字段
                    if (flatData[field.name] !== undefined) {
                        structured[field.name] = flatData[field.name];
                    }
                }
            });

            return structured;
        }
    }
});
