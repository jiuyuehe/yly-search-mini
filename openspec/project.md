# Project Context

## Purpose
YLY Search Viewer 是一个企业级 RAG（检索增强生成）文件搜索与预览前端应用，提供：
- **智能搜索**: 全文搜索、语义搜索、图片搜索、AI 文档搜索
- **文件预览**: 集成第三方预览插件，支持文本抽取和翻译
- **AI 工具**: 摘要、标签、实体抽取、自定义信息提取、文档问答、翻译
- **数据管理**: 表单设计器、数据抽取管理、统计分析、标签分类管理
- **文件对比**: 支持多种文本格式的文件差异对比

**目标**: 为企业用户提供统一的文档搜索、智能预览和 AI 辅助分析平台。

## Tech Stack

### 核心框架
- **Vue 3.5.18** - Composition API + `<script setup>` 语法
- **Vite 7.1.3** - 构建工具
- **Pinia 3.0.3** - 状态管理
- **Vue Router 4.5.1** - 路由管理

### UI 组件库
- **Element Plus 2.11.0** - 主要 UI 组件库
- **@element-plus/icons-vue 2.3.1** - 图标库
- **Sass 1.90.0** - 样式预处理器

### 数据可视化
- **ECharts 6.0.0** - 统计图表（折线图、饼图）

### 文本编辑与展示
- **Milkdown** - 富文本编辑器（通过 @opentiny/fluent-editor 集成）
- **md-editor-v3 5.8.4** - Markdown 编辑器
- **markdown-it 14.1.0** - Markdown 解析
- **github-markdown-css 5.5.1** - Markdown 样式

### 文件处理
- **pdfjs-dist 5.4.54** - PDF 预览
- **diff 8.0.2** + **diff2html 3.4.52** - 文件差异对比
- **vue-diff 1.2.4** - Vue 差异组件

### HTTP 与流式传输
- **Axios 1.11.0** - HTTP 客户端
- **@microsoft/fetch-event-source 2.0.1** - Server-Sent Events (SSE) 流式响应

### 开发工具
- **ESLint 9.33.0** + **eslint-plugin-vue 10.4.0** - 代码检查
- **@vitejs/plugin-vue 6.0.1** - Vue SFC 支持

### 部署工具
- **archiver 6.0.1** - 打包压缩
- **ssh2 1.15.0** + **ssh2-sftp-client 10.0.3** - SSH/SFTP 自动部署
- **fs-extra 11.2.0** - 文件操作增强

## Project Conventions

### Code Style
- **ESLint Flat Config** (eslint.config.js):
  - ECMAScript 2023, module 模式
  - Vue 3 `<script setup>` 单文件组件 (SFC)
  - 未使用变量警告：允许 `^_` 开头的参数/变量名
  - 禁用 `no-console` (开发日志允许)
  - 禁用 `vue/multi-word-component-names` (单词组件名允许)
- **命名约定**:
  - 组件文件：PascalCase (如 `SearchView.vue`, `FilterSidebar.vue`)
  - 服务文件：camelCase (如 `searchService.js`, `aiService.js`)
  - Store 文件：camelCase (如 `search.js`, `filePreview.js`, `aiTools.js`)
  - 常量文件：camelCase (如 `fileTypes.js`, `server.js`)
- **样式系统**:
  - 统一使用 CSS 变量（`src/styles/variables.css`）
  - 主色调: `#3B82F6` (Blue-500, Tailwind 风格)
  - 禁止硬编码颜色、字号、边框、间距
  - 使用语义化设计令牌 (如 `--primary-color`, `--text-color-primary`)

### Architecture Patterns

#### 目录结构
```
src/
├── components/          # UI 组件
│   ├── common/         # 通用组件（AppHeader）
│   ├── search/         # 搜索相关（FilterSidebar, SearchBox, SearchResultItem, etc.）
│   ├── preview/        # 预览相关（FilePreview, TextExtractor, TranslationPanel）
│   ├── ai/             # AI 工具（SummaryPanel, TagsPanel, NERPanel, DocumentQA, etc.）
│   ├── forms/          # 表单设计器（FormDesigner, FormsManager）
│   ├── extractions/    # 数据抽取（ExtractionsManager, ExtractionDetail）
│   └── editor/         # 编辑器（RichTextEditor, OpenTinyEditor）
├── views/              # 页面视图（SearchView, PreviewView, FormsView, etc.）
├── stores/             # Pinia 状态（search, filePreview, aiTools, forms, extractions）
├── services/           # API 封装（search, ai, file, preview, streaming, etc.）
├── router/             # 路由配置
├── constants/          # 常量定义（fileTypes, fileModel, server）
├── utils/              # 工具函数（esid, language, examplesPresets）
├── styles/             # 全局样式（variables.css）
└── assets/             # 静态资源
```

#### 状态管理模式
- **Pinia Store 组织**:
  - `search.js`: 搜索状态（query, filters, results, pagination, selectedMap）
  - `filePreview.js`: 预览状态（currentFile, activePanel, textContent）
  - `aiTools.js`: AI 工具状态（summary, tags, entities, QA history）
  - `forms.js`: 表单设计器状态（forms, fields, templates）
  - `extractions.js`: 数据抽取状态（extractions, filters, pagination）
- **Store 职责**:
  - 管理业务数据和 UI 状态
  - 调用 service 层 API
  - 提供 computed getters 和 actions
  - 跨组件共享状态（如 selectedMap 支持跨页选择）

#### API 服务层
- **服务实例模式**: 每个服务导出单例（如 `export const searchService = new SearchService()`）
- **关键服务**:
  - `searchService`: 搜索、聚合、标签云、创建者列表
  - `aiService`: AI 摘要、标签、NER、自定义抽取、文档问答、翻译、主题/标签管理
  - `streamingService`: SSE 流式响应处理（AI 工具）
  - `formsService`: 表单 CRUD、模板管理
  - `extractionsService`: 数据抽取 CRUD、批量操作
  - `fileService`: 文件下载、批量下载、导出
  - `previewService`: 文件预览元数据、权限管理
  - `imageSearchService`: 图片搜索（OCR、相似图片）
  - `vectorService`: 向量嵌入服务
  - `statsService`: 统计分析数据（mock 数据）
  - `tagCloudService`: 标签云数据
- **Axios 实例**:
  - `searchApi`: 指向搜索后端（默认同域 origin + `/elasticsearch`）
  - `appsApi`: 指向应用后端（默认同域 origin）

#### 组件设计原则
- **单一职责**: 每个组件职责单一，易于维护
- **Props 向下，事件向上**: 父子组件通过 props 和 emit 通信
- **Store 集成**: 复杂状态通过 Pinia store 管理
- **Composition API**: 优先使用 `<script setup>` 和 `ref/reactive`
- **响应式布局**: 使用 Element Plus Grid 系统和媒体查询
- **无障碍性**: 提供合理的 ARIA 标签和键盘导航

### Testing Strategy
- **当前状态**: 项目尚未集成自动化测试框架
- **建议后续添加**:
  - Vitest 单元测试
  - Vue Test Utils 组件测试
  - Cypress/Playwright E2E 测试

### Git Workflow
- **分支策略**: 
  - `main` / `master`: 生产稳定分支
  - `search-ui-diff`: 当前开发分支（搜索 UI 与 diff 功能）
  - 功能分支: 按功能创建独立分支
- **提交约定**: 建议遵循 Conventional Commits（如 `feat:`, `fix:`, `refactor:`, `docs:`）

## Domain Context

### 业务领域
**企业内容管理与智能检索**: 为企业用户提供跨多个文件空间（个人、团队、公共、NAS）的统一搜索和预览体验。

### 核心概念
- **文件空间 (File Category)**:
  - `personal`: 个人空间
  - `group`: 团队空间
  - `public`: 公共空间
  - `nas`: NAS 网络存储空间
- **搜索模式 (Search Type)**:
  - `fullText`: 全文搜索（Elasticsearch）
  - `semantic`: 语义搜索（向量检索）
  - `image`: 图片搜索（OCR + 相似图片）
  - `ai`: AI 文档搜索（支持上传文件/图片）
- **精准模式 (Precision Mode)**:
  - `1`: 基础模式（关键词匹配）
  - `2`: 高级模式（短语匹配）
  - `3`: 精准模式（完整句子匹配 + 标签过滤）
- **文件类型 (Document Type)**:
  - `word`, `excel`, `ppt`, `pdf`, `txt`, `img`, `video`, `audio`, `archive`, `other`
- **AI 功能**:
  - **摘要 (Summary)**: 文档内容摘要生成
  - **标签 (Tags)**: 自动标签提取
  - **实体抽取 (NER)**: 命名实体识别（人名、地名、组织等）
  - **自定义抽取 (Custom Extraction)**: 基于 JSON Schema 表单的结构化信息提取
  - **文档问答 (Document QA)**: 基于文档内容的问答对话
  - **翻译 (Translation)**: 多语言文档翻译

### 用户工作流
1. **搜索阶段**: 用户输入关键词 → 选择搜索模式 → 应用过滤条件 → 查看聚合结果
2. **预览阶段**: 点击文件 → 进入预览界面 → 使用 AI 工具分析 → 抽取/翻译文本
3. **管理阶段**: 设计表单模板 → 批量抽取数据 → 查看统计分析 → 管理标签分类
4. **对比阶段**: 上传两个文件 → 选择对比模式 → 查看差异高亮

## Important Constraints

### 技术约束
- **浏览器兼容性**: 现代浏览器（Chrome 90+, Firefox 88+, Edge 90+, Safari 14+）
- **单页应用 (SPA)**: 无服务端渲染，所有路由由前端处理
- **流式响应**: AI 接口使用 SSE (Server-Sent Events) 流式传输，需浏览器支持 EventSource 或 fetch + ReadableStream
- **文件预览限制**: 第三方预览插件可能对文件大小和格式有限制

### 业务约束
- **权限控制**: 文件访问需后端权限验证，无权限时需提供申请流程
- **敏感信息标识**: 搜索结果需标记是否包含敏感信息
- **文件空间隔离**: 不同文件空间的数据需逻辑隔离

### 部署约束
- **部署路径**: 测试环境部署在 Nginx 子路径 `/plugins/fts/`，需配置 Vite `base` 参数
- **自动部署**: 使用 `deploy.js` 通过 SSH/SFTP 上传到远程服务器
- **环境配置**: `APPS_BASE` 和搜索后端地址需根据部署环境动态配置

## External Dependencies

### 后端 API 服务
- **搜索服务**: Elasticsearch API (默认路径 `/elasticsearch`)
- **应用服务**: 文件管理、AI 工具、权限管理（默认同域 origin）
- **流式 AI 服务**: SSE 接口（`/applications/ai/process`, `/applications/ai/translate`, etc.）

### 第三方服务
- **PDF.js**: Mozilla 开源 PDF 渲染引擎（CDN 或本地部署）
- **Milkdown/Fluent Editor**: 富文本编辑器（可能依赖外部字体/主题）
- **ECharts**: 百度开源图表库（通过 npm 引入）

### 环境变量与配置
- **VITE_BASE_URL**: Vite 构建时的 base 路径（默认 `/plugins/fts/`）
- **APPS_BASE**: 应用服务器地址（运行时从 `window.location.origin` 获取）
- **搜索后端**: 在 `api.js` 中配置 `searchApi` 基础路径

### 部署依赖
- **Nginx**: 作为静态文件服务器和反向代理
- **SSH/SFTP**: 自动化部署脚本需 SSH 私钥或密码认证
- **Node.js**: 开发环境需 Node.js 18+ 和 pnpm/npm

## Current Development Status

### 已完成功能
- ✅ 统一样式系统重构（#3B82F6 主色调，CSS 变量体系）
- ✅ 搜索界面（FilterSidebar, SearchBox, 聚合结果，分页）
- ✅ 文件预览界面（多栏布局，文本抽取，翻译）
- ✅ AI 工具面板（摘要、标签、NER、自定义抽取、文档问答、翻译）
- ✅ 表单设计器（字段设计、预览、CRUD）
- ✅ 数据抽取管理（列表、详情、批量操作）
- ✅ 统计分析页（ECharts 可视化）
- ✅ 标签分类管理页（主题树、标签 CRUD）
- ✅ 文件对比页（diff2html 集成）
- ✅ 代码质量保证（ESLint 检查通过）

### 待优化项（参考 PROJECT_SUMMARY.md）
- ⏳ SearchView UI 细节调整（AI 按钮视觉效果）
- ⏳ FormDesigner 单/多数据提取模式选项
- ⏳ FormsView 关联数据结果列、可用状态开关
- ⏳ ExtractionsManager 对象字段弹窗展示、行内编辑、字段验证

### 下一步建议
1. 补充自动化测试（Vitest + Vue Test Utils）
2. 性能优化（大文件处理、虚拟滚动）
3. 国际化支持（i18n）
4. 主题切换功能（暗色模式）
5. 移动端响应式优化
