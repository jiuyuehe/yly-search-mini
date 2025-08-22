import api from './api';
import { streamingService } from './streamingService';

const API_BASE = '/api';

// Mock AI responses
const MOCK_AI_DATA = {
  summaries: {
    1: '这是一个关于项目需求的重要文档，包含了详细的功能规范和技术要求。主要涵盖用户管理、文件搜索、AI分析工具等核心模块的设计方案。',
    2: '设计图标准规范文档，定义了UI界面的视觉设计标准和图标使用规范。',
    3: '项目会议录音文件，讨论了开发进度和技术难点。'
  },
  
  tags: {
    1: ['项目文档', '需求分析', '技术规范', '重要'],
    2: ['设计', 'UI标准', '图标', '规范'],
    3: ['会议', '录音', '开发', '讨论']
  },
  
  nerEntities: {
    1: {
      persons: ['张三', '李四', '王五'],
      organizations: ['开发团队', '设计部门'],
      locations: ['北京', '上海'],
      dates: ['2024-01-15', '2024-02-01']
    },
    2: {
      persons: ['设计师'],
      organizations: ['UI团队'],
      locations: [],
      dates: ['2024-01-14']
    },
    3: {
      persons: ['项目经理', '开发工程师'],
      organizations: ['技术部'],
      locations: ['会议室'],
      dates: ['2024-01-13']
    }
  },
  
  translations: {
    'en': {
      '这是一个项目需求文档': 'This is a project requirements document',
      '包含详细的功能需求': 'Contains detailed functional requirements',
      '技术规范': 'Technical specifications'
    },
    'ja': {
      '这是一个项目需求文档': 'これはプロジェクト要件書です',
      '包含详细的功能需求': '詳細な機能要件を含む',
      '技术规范': '技術仕様'
    }
  }
};

class AIService {
  async getSummary(fileId, onChunk) {
    try {
      // Mock streaming response
      const summary = MOCK_AI_DATA.summaries[fileId] || '暂无摘要信息';
      
      if (onChunk) {
        // Simulate streaming by sending chunks
        const words = summary.split('');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          onChunk(words.slice(0, i + 1).join(''));
        }
      }
      
      return summary;
    } catch (error) {
      console.warn('AI Summary API not available, using mock data');
      return MOCK_AI_DATA.summaries[fileId] || '暂无摘要信息';
    }
  }
  
  async getTags(fileId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      return MOCK_AI_DATA.tags[fileId] || [];
    } catch (error) {
      console.warn('AI Tags API not available, using mock data');
      return MOCK_AI_DATA.tags[fileId] || [];
    }
  }
  
  async getNEREntities(fileId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      return MOCK_AI_DATA.nerEntities[fileId] || { persons: [], organizations: [], locations: [], dates: [] };
    } catch (error) {
      console.warn('AI NER API not available, using mock data');
      return MOCK_AI_DATA.nerEntities[fileId] || { persons: [], organizations: [], locations: [], dates: [] };
    }
  }
  
  async extractCustomInfo(fileId, template) {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      // Mock custom extraction based on template
      const mockResults = {
        contract: {
          parties: ['甲方：XX公司', '乙方：YY公司'],
          amount: '100万元',
          date: '2024-01-15',
          duration: '12个月'
        },
        invoice: {
          number: 'INV-2024-001',
          amount: '50000元',
          date: '2024-01-15',
          vendor: 'ABC供应商'
        }
      };
      
      return mockResults[template.type] || {};
    } catch (error) {
      console.warn('AI Extract API not available, using mock data');
      return {};
    }
  }

  // New method for form-based extraction
  async extractWithForm(fileId, formStructure, aiModel = 'gpt-4') {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock form-based extraction results
      const mockFormResults = {
        1: { // Contract form
          甲方: {
            companyName: '示例科技有限公司',
            负责人: '李经理',
            联系方式: '13900139000'
          },
          购买产品: [
            {
              产品名称: '企业邮箱服务',
              数量: 100,
              价格: 50.0
            },
            {
              产品名称: '云存储服务',
              数量: 500,
              价格: 2.0
            }
          ],
          合同详情: {
            总价: 6000.0,
            服务器周期: '1年',
            交付周期: '7天'
          }
        },
        2: { // Invoice form
          发票号码: 'INV-2024-0088',
          开票日期: '2024-01-20',
          销售方: '北京软件技术公司',
          购买方: '示例科技有限公司',
          金额: 25000.0,
          税率: 0.13,
          备注: '技术服务费'
        },
        3: { // Quote form
          报价单号: 'QT-2024-0055',
          报价日期: '2024-01-18',
          客户名称: '上海创新公司',
          报价项目: [
            {
              项目名称: 'ERP系统开发',
              单价: 120000.0,
              数量: 1,
              小计: 120000.0
            },
            {
              项目名称: '系统集成服务',
              单价: 30000.0,
              数量: 1,
              小计: 30000.0
            }
          ],
          总金额: 150000.0,
          有效期: '60天'
        }
      };

      // Generate realistic data based on form structure
      if (formStructure && formStructure.fields) {
        const result = this.generateMockDataFromFormStructure(formStructure, fileId);
        return result;
      }

      // Fallback to predefined mock data
      return mockFormResults[fileId] || this.generateGenericMockData(formStructure);
    } catch (error) {
      console.warn('Form-based AI Extract API not available, using mock data');
      throw error;
    }
  }

  // Generate mock data based on form structure
  generateMockDataFromFormStructure(formStructure, fileId) {
    const mockData = {};
    
    if (!formStructure.fields) return {};
    
    formStructure.fields.forEach(field => {
      if (field.type === 'object' && field.fields) {
        mockData[field.name] = {};
        field.fields.forEach(subField => {
          mockData[field.name][subField.name] = this.generateFieldValue(subField, fileId);
        });
      } else if (field.type === 'array' && field.fields) {
        // Generate 1-3 array items
        const itemCount = Math.floor(Math.random() * 3) + 1;
        mockData[field.name] = [];
        for (let i = 0; i < itemCount; i++) {
          const item = {};
          field.fields.forEach(subField => {
            item[subField.name] = this.generateFieldValue(subField, fileId, i);
          });
          mockData[field.name].push(item);
        }
      } else {
        mockData[field.name] = this.generateFieldValue(field, fileId);
      }
    });
    
    return mockData;
  }

  // Generate individual field values
  generateFieldValue(field, fileId, index = 0) {
    // If field has example, use it with some variation
    if (field.example !== undefined && field.example !== null) {
      if (field.type === 'number') {
        return typeof field.example === 'number' ? 
          field.example + Math.floor(Math.random() * 1000) : 
          parseFloat(field.example) || 0;
      } else if (field.type === 'text') {
        return typeof field.example === 'string' ? 
          field.example + (index > 0 ? ` ${index + 1}` : '') : 
          '示例文本';
      } else if (field.type === 'date') {
        return field.example || '2024-01-15';
      } else if (field.type === 'boolean') {
        return Math.random() > 0.5;
      }
    }
    
    // Generate based on field type and name
    const lowerName = field.name.toLowerCase();
    
    if (field.type === 'number') {
      if (lowerName.includes('价格') || lowerName.includes('金额') || lowerName.includes('总价')) {
        return Math.floor(Math.random() * 100000) + 1000;
      } else if (lowerName.includes('数量')) {
        return Math.floor(Math.random() * 100) + 1;
      } else if (lowerName.includes('税率')) {
        return 0.13;
      }
      return Math.floor(Math.random() * 1000) + 1;
    } else if (field.type === 'date') {
      const dates = ['2024-01-15', '2024-01-20', '2024-01-25', '2024-02-01'];
      return dates[Math.floor(Math.random() * dates.length)];
    } else if (field.type === 'boolean') {
      return Math.random() > 0.5;
    } else {
      // Text field - generate based on field name
      if (lowerName.includes('公司') || lowerName.includes('company')) {
        const companies = ['示例科技有限公司', 'ABC软件公司', 'XYZ技术公司', '创新科技集团'];
        return companies[Math.floor(Math.random() * companies.length)];
      } else if (lowerName.includes('姓名') || lowerName.includes('负责人') || lowerName.includes('name')) {
        const names = ['张三', '李四', '王五', '赵六', '钱七'];
        return names[Math.floor(Math.random() * names.length)];
      } else if (lowerName.includes('电话') || lowerName.includes('联系') || lowerName.includes('phone')) {
        return '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
      } else if (lowerName.includes('邮箱') || lowerName.includes('email')) {
        return 'example@company.com';
      } else if (lowerName.includes('地址') || lowerName.includes('address')) {
        return '北京市朝阳区示例大街123号';
      } else if (lowerName.includes('产品') || lowerName.includes('项目')) {
        const products = ['云服务器', '数据库服务', '技术支持', '软件开发', '系统集成'];
        return products[Math.floor(Math.random() * products.length)] + (index > 0 ? ` ${index + 1}` : '');
      } else if (lowerName.includes('号码') || lowerName.includes('编号')) {
        return 'NO-2024-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      }
      
      return field.example || `示例${field.name}`;
    }
  }

  generateGenericMockData(formStructure) {
    return {
      message: '无法生成符合表单结构的数据',
      formName: formStructure?.formName || '未知表单'
    };
  }
  
  async askQuestion(fileId, question, onChunk) {
    try {
      // Mock Q&A response
      const answers = [
        '根据文档内容，这个问题的答案是：',
        '首先，我们需要分析文档中的相关信息。',
        '通过对文档的理解，可以得出以下结论：',
        `关于"${question}"这个问题，文档中提到了相关的内容和解决方案。`
      ];
      
      const answer = answers[Math.floor(Math.random() * answers.length)] + 
                    ' 这是一个基于文档内容生成的模拟回答，展示了AI问答功能的工作方式。';
      
      if (onChunk) {
        const words = answer.split('');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 80));
          onChunk(words.slice(0, i + 1).join(''));
        }
      }
      
      return answer;
    } catch (error) {
      console.warn('AI QA API not available, using mock data');
      return '这是一个模拟的问答回复。';
    }
  }
  
  async translateText(text, targetLanguage, onChunk) {
    try {
      // Mock translation
      const translations = MOCK_AI_DATA.translations[targetLanguage] || {};
      let translatedText = translations[text] || `[${targetLanguage.toUpperCase()}] ${text}`;
      
      // If not found in mock data, create a simple mock translation
      if (translatedText === `[${targetLanguage.toUpperCase()}] ${text}`) {
        switch (targetLanguage) {
          case 'en':
            translatedText = `Translated to English: ${text}`;
            break;
          case 'ja':
            translatedText = `日本語に翻訳: ${text}`;
            break;
          case 'ko':
            translatedText = `한국어로 번역: ${text}`;
            break;
          default:
            translatedText = `Translated text: ${text}`;
        }
      }
      
      if (onChunk) {
        const words = translatedText.split('');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 60));
          onChunk(words.slice(0, i + 1).join(''));
        }
      }
      
      return translatedText;
    } catch (error) {
      console.warn('AI Translation API not available, using mock data');
      return `Mock translation: ${text}`;
    }
  }
  
  async extractText(fileId) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockTexts = {
        1: '这是从PDF文件中提取的文本内容。包含了项目需求的详细描述，技术规范，以及实施方案等重要信息。\n\n主要章节包括：\n1. 项目概述\n2. 功能需求\n3. 技术架构\n4. 实施计划\n\n这些内容为项目的顺利进行提供了重要的参考依据。',
        2: '从图片中识别的文字内容：设计标准、UI规范、图标库等相关设计要素。',
        3: '音频转文字：会议主要讨论了项目进度、技术难点和解决方案等议题。'
      };
      
      return mockTexts[fileId] || '暂无可提取的文本内容';
    } catch (error) {
      console.warn('Text extraction API not available, using mock data');
      return '模拟提取的文本内容';
    }
  }
}

export const aiService = new AIService();