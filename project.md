# 需求文档

### 1、搜索界面
	1）左右布局，左边为搜索过滤筛选条件，右边为搜索结果和搜索框
	2）左侧搜索过滤条件包括：文件空间、创建人员、标签过滤、格式过滤、时间过滤、大小过滤、历史版本过滤。注意这个过滤组件是可以开启和隐藏的。
	3）右侧上面为主搜索框，模仿chatbot风格，但是在上面，框中条件匹配模式：包含全文搜索、语义搜索、图片搜索、AI文档搜索（支持输入文件，选择模式，和上传图片内容进行搜索）
	4）左侧下面为搜索聚合结果（tabs）（全部、文档、图片、多媒体、压缩包、其他）搜索结果和搜索内容
	5）每个搜索结果条目都带复选框，展示内容为：文件名，文件内容（展示个字），路径、作者、时间；在条目的最右侧有得分，有是否包含敏感信息提示。
	6）最下面为搜索分页，同时选中结果后展示下载文件按钮和导出结果按钮


### 2、文件预览界面
	1）点击搜索页面的结果（文件名）后跳转到文件预览界面。
	2）文件预览结呈现上下左右布局的多栏目布局，需要根据屏幕宽度来展示布局栏目，上下结构中分为标题栏（header）和内容栏（content）。
	3）header栏目：固定的文件icon ，标题，内容栏控制按钮，文件的操作按钮（下载、定位、等等）
	4）content栏目分为：文件预览栏目（调用第三方插件预览， 默认，宽度）；AI工具栏目（展示在最右侧的80px的操作按钮栏）文本抽取栏（文档中的文本独立展示成富文本编辑模式）翻译栏（将文本翻译成其他语言也是富文本编辑模式）其中文本栏目和翻译栏目还有文件预览栏目和AI工具栏目都可以在header中开启和关闭。
	5）文件预览和AI工具栏目展示成一个版面（AI工具包括：摘要、标签、实体抽取、自定抽取、AI翻译）除了AI翻译点击进入翻译界面外，其他都是打开300px的右侧栏目，和文件预览组成 AI 预览界面。相当板面为文件原文预览+AI右侧操作栏目（300px）注意：文件预览界面如果调用API返回无权限，404界面上，需要新增一个点击申请访问的按钮，点击后弹出一个模态窗口，下拉各种申请权限的操作列表，确认后发起申请。
	6）文本抽取编辑栏目和文本翻译栏目展示成一个版本（两者的内容是通过接口翻译的，翻译后的内容实现同步对应和滚动）相当于在content中有2个1:1的服文本编辑窗口。（推荐选中Milkdown）


### 3、AI 工具条目
	AI 工具条目的功能有几个主要为
	1、摘要，标签，NER信息提取 （这3个占用一栏（上中下3段，按照顺序展示））注意：这个和文件预览组成一个板面。
	2、自定义信息提取： 点击开上半部分展示用户自定义的多个信息抽取表单（JSON结构表单，如何：合同、报价、单据），选中表单后，下半部分抽取出用户的需要的结果，用户点击确认后保存。注意，这里也是和文件预览组成一个板面。
	3、文档问答，展示问答框，用户进行提问和回答。
	4、翻译：点击后，左侧content 进入文本抽取和翻译组成的板面。注意这里是一个独立的板面。

4、技术选型：

1、采用成熟的vue3 +vite + elementplus 手脚架方案，带状态管理和http库。
2、先根据功能进行功能与框架的架构，功能一点都不能漏，设计好架构之后，将架构输入到project.md中，后面如果中段了，需要根据project.md 来进行继续生成。
3、后端请求方面：调用AI（摘要、翻译、标签、NER等） 的接口需要支持流式输出，普通接口不需要（搜索、过滤、下载、聚合）采用通用http组件。
4、前端技术点：
	- 富文本编辑组件需要集成milkdown，
	- 文件预览组件需要集成pdf.js
	- AI 接口需要流式输出

# YLY Search Viewer Architecture

## Project Overview
A comprehensive file search and viewing system with advanced AI capabilities for document analysis, translation, and information extraction.

## Tech Stack
- **Frontend Framework**: Vue 3
- **Build Tool**: Vite
- **UI Library**: Element Plus
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Rich Text Editor**: Milkdown
- **PDF Viewer**: PDF.js
- **Router**: Vue Router

## Project Structure
```
yly-search-viewer/
├── public/
│   └── assets/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── search/
│   │   │   ├── FilterSidebar.vue
│   │   │   ├── SearchBox.vue
│   │   │   ├── SearchResultTabs.vue
│   │   │   ├── SearchResultItem.vue
│   │   │   └── SearchPagination.vue
│   │   ├── preview/
│   │   │   ├── PreviewHeader.vue
│   │   │   ├── FilePreview.vue
│   │   │   ├── TextExtractor.vue
│   │   │   └── TranslationPanel.vue
│   │   └── ai/
│   │       ├── AIToolbar.vue
│   │       ├── SummaryPanel.vue
│   │       ├── TagsPanel.vue
│   │       ├── NERPanel.vue
│   │       ├── CustomExtractionPanel.vue
│   │       ├── DocumentQA.vue
│   │       └── TranslationTool.vue
│   ├── layouts/
│   │   └── MainLayout.vue
│   ├── views/
│   │   ├── SearchView.vue
│   │   └── PreviewView.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── search.js
│   │   ├── filePreview.js
│   │   └── aiTools.js
│   ├── services/
│   │   ├── api.js
│   │   ├── search.js
│   │   ├── file.js
│   │   ├── aiService.js
│   │   └── streamingService.js
│   ├── utils/
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.vue
│   └── main.js
├── .eslintrc.js
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## Key Components

### 1. Search Interface
- **FilterSidebar**: Left panel with filters for file space, creators, tags, format, time, size, and version history
- **SearchBox**: Main search input with modes (full-text, semantic, image, AI document search)
- **SearchResultTabs**: Tabs for different file types (All, Documents, Images, Multimedia, Archives, Others)
- **SearchResultItem**: Individual search result with checkbox, file details, and sensitivity indicators
- **SearchPagination**: Pagination controls with download and export buttons

### 2. File Preview Interface
- **PreviewHeader**: File icon, title, content controls, and file operation buttons
- **FilePreview**: Main file preview area with third-party plugins
- **AIToolbar**: Right sidebar (80px) with AI tool buttons
- **TextExtractor**: Text extraction in rich text editing mode
- **TranslationPanel**: Translation in rich text editing mode

### 3. AI Tools
- **SummaryPanel**: Document summaries
- **TagsPanel**: Document tags
- **NERPanel**: Named entity recognition
- **CustomExtractionPanel**: Custom information extraction with form selection
- **DocumentQA**: Q&A interactions
- **TranslationTool**: Text translation

## API Services

### 1. Search API
- `search(query, filters, page, pageSize)` - Main search function
- `getFilterOptions()` - Get available filter options
- `getFileCount(filters)` - Get count of files by type

### 2. File API
- `getFilePreview(fileId)` - Get file preview data
- `downloadFile(fileId)` - Download a file
- `downloadSelectedFiles(fileIds)` - Download multiple files
- `exportResults(searchResults)` - Export search results
- `requestAccess(fileId, reason)` - Request access to a file

### 3. AI API
- `getSummary(fileId)` - Get document summary (streaming)
- `getTags(fileId)` - Get document tags (streaming)
- `getNEREntities(fileId)` - Get named entities (streaming)
- `extractCustomInfo(fileId, template)` - Extract custom information
- `askQuestion(fileId, question)` - Ask a question about the document (streaming)
- `translateText(text, targetLanguage)` - Translate text (streaming)
- `extractText(fileId)` - Extract text from file

## Layout Structure

### Search View
- Left-right layout (70/30 split when filters are visible)
- Responsive design with collapsible filter sidebar
- Search results with selectable items and pagination

### Preview View
- Header with file info and control buttons
- Content area with dynamic panels:
  - Panel 1: File Preview + AI Tools
  - Panel 2: Text Extraction + Translation
- Responsive layout adjusting based on screen width and active panels

## State Management
- **searchStore**: Manage search queries, filters, and results
- **filePreviewStore**: Manage file preview state and active panels
- **aiToolsStore**: Manage AI processing state and results
```

