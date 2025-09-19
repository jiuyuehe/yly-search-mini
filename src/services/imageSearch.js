import api from './api';
import { normalizeFile } from '../constants/fileModel';

/**
 * 图片搜索服务 - 专门处理图片视觉搜索
 * 对应后端 /search/visual 接口
 */
class ImageSearchService {
  /**
   * 以图搜图 - 基于视觉特征的图像搜索
   * @param {Object} params - 搜索参数
   * @param {File} imageFile - 图片文件
   * @returns {Promise<Object>} 搜索结果
   */
  async searchByVisual(params, imageFile) {
    const url = '/admin-api/rag/images/search/visual';
    
    try {
      const formData = new FormData();
      
      // 映射前端参数到后端 ImageSearchParam
      const {
        keyword = '',
        offset = 0,
        limit = 20,
        hasHistory = false,
        fileCategory,
        docType,
        fileSize,
        groupId,
        createUserId,
        createrId, // 前端可能传递的字段名
        scoreThreshold = 0.4,
        similarity = 0.5,
        sortField,
        sortDirection
      } = params;

      // 添加基础参数
      if (keyword) formData.append('keyword', keyword);
      formData.append('offset', offset);
      formData.append('limit', limit);
      formData.append('hasHistory', hasHistory);
      formData.append('scoreThreshold', scoreThreshold);
      formData.append('similarity', similarity);

      // 添加可选过滤参数
      if (fileCategory) formData.append('fileCategory', fileCategory);
      if (docType) formData.append('docType', docType);
      if (fileSize) formData.append('fileSize', fileSize);
      if (groupId) formData.append('groupId', groupId);
      
      // 处理创建者ID（前端可能使用不同字段名）
      const userId = createUserId || createrId;
      if (userId) formData.append('createUserId', userId);
      
      if (sortField) formData.append('sortField', sortField);
      if (sortDirection) formData.append('sortDirection', sortDirection);

      // 添加图片文件 - 这是关键参数
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      console.log('图片搜索参数:', formData);

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 处理响应
      if (response?.code !== 0) {
        throw new Error(response?.msg || '图片搜索失败');
      }

      const apiData = response?.data;
      if (!apiData || !Array.isArray(apiData.fileList)) {
        throw new Error('图片搜索无数据');
      }

      // 转换响应数据格式
      return this.transformImageSearchResponse(apiData);

    } catch (error) {
      console.warn('图片搜索接口失败:', error);
      // 为图片搜索提供特定的mock数据
      return this.getImageSearchMockData();
    }
  }

  /**
   * 转换图片搜索响应数据
   * @param {Object} data - 后端响应数据
   * @returns {Object} 标准化的搜索结果
   */
  transformImageSearchResponse(data) {
    const list = data?.fileList || [];
    
    // 标准化文件数据
    const normalized = list.map(raw => {
      const norm = normalizeFile(raw);
      
      // 图片搜索特有的字段处理
      if (!norm.thumbUrl) {
        norm.thumbUrl = raw.thumbUrl || raw.thumb || raw.fsFileThumb || '';
      }
      
      // 相似度分值 (图片搜索通常有similarity字段)
      if (raw.similarity != null && norm.score == null) {
        norm.score = raw.similarity;
      } else if (raw.score != null && norm.score == null) {
        norm.score = raw.score;
      }
      
      return norm;
    });

    // 图片搜索结果都应该是图片类型
    const results = normalized.map(f => ({
      ...f,
      type: 'image' // 强制设置为图片类型
    }));

    // 图片搜索的统计信息
    const tabCounts = {
      all: data?.total || results.length,
      document: 0,
      image: data?.total || results.length, // 图片搜索全部都是图片
      multimedia: 0,
      archive: 0,
      other: 0
    };

    return {
      results,
      pagination: {
        total: data?.total || results.length
      },
      tabCounts,
      searchTime: data?.searchTime || 0
    };
  }

  /**
   * 获取图片搜索相关的过滤选项
   * @returns {Promise<Object>} 过滤选项
   */
  async getImageFilterOptions() {
    // 图片搜索可能有特殊的过滤选项
    // 这里先返回基础选项，后续可以扩展
    return {
      fileCategories: [
        { value: 'design', label: '设计图' },
        { value: 'photo', label: '照片' },
        { value: 'diagram', label: '图表' },
        { value: 'screenshot', label: '截图' }
      ],
      similarities: [
        { value: 0.9, label: '非常相似 (90%)' },
        { value: 0.8, label: '很相似 (80%)' },
        { value: 0.7, label: '相似 (70%)' },
        { value: 0.6, label: '一般相似 (60%)' }
      ]
    };
  }

  /**
   * 获取图片搜索的mock数据
   * @returns {Object} 标准化的搜索结果
   */
  getImageSearchMockData() {
    const imageResults = [
      
    ];

    // 标准化并转换
    const normalized = imageResults.map(raw => {
      const norm = normalizeFile(raw);
      norm.score = raw.similarity || raw.score;
      norm.thumbUrl = raw.thumbUrl;
      return norm;
    });

    const results = normalized.map(f => ({
      ...f,
      type: 'image' // 强制设置为图片类型
    }));

    return {
      results,
      pagination: {
        total: results.length
      },
      tabCounts: {
        all: results.length,
        document: 0,
        image: results.length,
        multimedia: 0,
        archive: 0,
        other: 0
      },
      searchTime: 150 // 模拟图片搜索耗时
    };
  }
}

export const imageSearchService = new ImageSearchService();