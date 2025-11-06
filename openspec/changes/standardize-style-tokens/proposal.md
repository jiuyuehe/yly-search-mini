# 变更：统一样式设计令牌的使用

## 背景
当前大量 Vue 组件直接在 `<style>` 或内联样式中硬编码颜色、字号、边框与间距，导致视觉风格不一致，后续调整成本高，也难以推行主题切换。

## 拟实施的调整
- 约定所有 Vue SFC `<style>` 区块与模板内联样式必须引用设计令牌，而非写死的数值。
- 将 `src/styles/variables.css` 明确为颜色、排版、边框、间距及语义状态等设计令牌的唯一来源。
- 明确需要通过自动化脚本或校验机制，持续约束新代码遵循设计令牌体系。

## 影响范围
- 变更规范：frontend-style-guidelines
- 可能改动的代码：`src/components/**/*.vue`、`src/views/**/*.vue`、`src/styles/variables.css` 以及 `tools/` 下的辅助脚本
