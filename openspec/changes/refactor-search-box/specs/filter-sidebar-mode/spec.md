# Spec: FilterSidebar Mode Selector

## ADDED Requirements

### Requirement: FilterSidebar应在顶部提供搜索模式选择器
**Rationale**: 将原本在SearchBox内的文本搜索模式(快速/精准/模糊)移至FilterSidebar,与其他筛选条件统一管理,降低搜索框复杂度。

#### Scenario: 搜索模式section位于筛选器顶部
**Given** 用户打开筛选侧边栏  
**When** FilterSidebar渲染  
**Then** 第一个section应为"搜索模式"
**And** section标题应可点击展开/折叠
**And** 默认状态应为展开(`expandedSections.searchMode = true`)

#### Scenario: 搜索模式section包含三个单选项
**Given** "搜索模式"section已展开  
**When** 渲染section内容  
**Then** 应显示三个单选按钮:
  - "快速" (value=1)
  - "精准" (value=2)
  - "模糊" (value=3)
**And** 默认选中"模糊"(precisionMode=3)

#### Scenario: 每个选项提供tooltip说明
**Given** 用户悬停在"快速"选项上  
**When** tooltip显示  
**Then** 应显示"全文检索,速度最快"

**Given** 用户悬停在"精准"选项上  
**Then** tooltip应显示"段落级匹配,精度较高"

**Given** 用户悬停在"模糊"选项上  
**Then** tooltip应显示"混合检索,平衡速度与精度"

### Requirement: 搜索模式选择应与searchStore.precisionMode双向绑定
**Rationale**: 确保FilterSidebar的选择与全局状态同步,SearchBox和API调用能读取最新模式。

#### Scenario: 初始化时从store读取当前模式
**Given** `searchStore.precisionMode = 2`  
**When** FilterSidebar挂载  
**Then** "精准"单选按钮应选中

#### Scenario: 用户切换模式时更新store
**Given** 当前选中"快速"(precisionMode=1)  
**When** 用户点击"精准"单选按钮  
**Then** `searchStore.precisionMode` 应更新为 `2`
**And** SearchBox中后续搜索应携带 `precisionMode=2` 参数

#### Scenario: Store变化时同步UI选中状态
**Given** FilterSidebar当前显示"快速"选中  
**When** 外部代码设置 `searchStore.precisionMode = 3`  
**Then** FilterSidebar应自动切换到"模糊"选中状态

### Requirement: 搜索模式选择器应支持"选择即搜"(可选)
**Rationale**: 提升用户效率,切换模式后立即重新执行搜索,无需再次点击搜索按钮。

#### Scenario: 切换模式后自动触发搜索(如果已有查询)
**Given** 用户已搜索"年度报告"并显示结果  
**And** 当前模式为"快速"  
**When** 用户在FilterSidebar切换到"精准"  
**Then** 应自动重新执行搜索(`searchStore.search(currentQuery, 'fullText', null, {precisionMode: 2})`)
**And** 搜索结果应更新为精准匹配结果

**Given** 用户未执行过搜索(query为空)  
**When** 用户切换搜索模式  
**Then** 不应触发搜索

## MODIFIED Requirements

### Requirement: 筛选器重置不应重置搜索模式
**Rationale**: 搜索模式是用户偏好设置,与具体筛选条件(时间、大小等)不同,重置筛选器时应保留用户选择的模式。

#### Scenario: 点击"重置"按钮仅清空筛选条件
**Given** 用户设置了以下状态:
  - 文件空间: "个人空间"
  - 时间范围: "近一周"
  - 搜索模式: "精准"
**When** 用户点击FilterSidebar的"重置"按钮  
**Then** "文件空间"应重置为未选中
**And** "时间范围"应重置为"全部"
**And** "搜索模式"应保持"精准"不变

## REMOVED Requirements

### ~~Requirement: SearchBox内部提供文本搜索模式下拉选择器~~
**Rationale**: 已移至FilterSidebar,SearchBox不再包含此控件。

---

## Cross-References
- **Related to**: [search-box-ui/spec.md](../search-box-ui/spec.md) - SearchBox移除模式选择器后,读取store.precisionMode传递给API
- **Related to**: [inline-qa-panel/spec.md](../inline-qa-panel/spec.md) - 问答模式不受文本搜索模式影响(问答不使用precisionMode参数)
