# yly-search-viewer

基于 Vue 3 + Vite 的 RAG 检索/预览前端。

## 目录结构简述

- `src/components` 业务组件
- `src/stores` Pinia 状态
- `src/services` 接口封装
- `deploy.js` 仅本地部署使用（不会随产物发布）

## 构建与发布 (测试环境)

部署路径: 服务器 Nginx 根 `/opt/yliyun/work/nginx/` 下子目录 `/plugins/fts/`。

浏览器访问入口: `http(s)://<server>/plugins/fts/`

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

### 3. 生产模式（测试环境）打包

```bash
npm run build:test
```

生成目录: `dist/`

Assets 路径基于 `/plugins/fts/`（见 `vite.config.js` 的 `base` 设置）。

### 4. 手工发布（不使用脚本）

1. 打包完成后，将 `dist/*` 上传至服务器:
   `scp -r dist/* root@<server>:/opt/yliyun/work/nginx/plugins/fts/`
2. 确认 Nginx 已配置允许访问该子路径。
3. 浏览器访问验证。

### 5. 使用本地自动化脚本 `deploy.js`

脚本只用于本地，不应打入镜像/服务器。

```bash
npm run deploy                # 构建 + 打包 + 上传 + 远程解压 + 清理
node deploy.js --skip-build   # 使用现有 dist
node deploy.js --dry-run      # 查看计划
node deploy.js --keep-zip     # 保留本地 zip
```

可通过 env 覆盖：

```bash
DEPLOY_HOST=1.2.3.4 DEPLOY_USER=root DEPLOY_PASS=xxx DEPLOY_REMOTE=/opt/yliyun/work/nginx/plugins/fts node deploy.js
```

### 6. 常见问题

| 问题 | 说明 | 处理 |
|------|------|------|
| 访问 404 | Nginx 未匹配到子路径或 base 不一致 | 确认打包使用 `build:test` 且 `base=/plugins/fts/` |
| 静态资源 404 | dist 上传缺失或缓存 | 清理浏览器缓存 / 强制刷新；重新上传完整 dist |
| 路由刷新 404 | Nginx 未配置 history fallback | 在 Nginx location 中加入 `try_files $uri $uri/ /plugins/fts/index.html;` |
| 部署后老代码 | 浏览器缓存 | 增加版本号或开启 `Cache-Control: no-cache` |

### 7. Nginx 示例配置片段

```nginx
location /plugins/fts/ {
    alias /opt/yliyun/work/nginx/plugins/fts/;
    try_files $uri $uri/ /plugins/fts/index.html;
}
```

## 开发注意

- TagCloud 权重: (weight/sum)*100 + 6, 仅取前 100 个，过滤超过 8 字的标签。
- india_full 采用合并轮廓 shape 优化。
- 部署脚本相关依赖放在 devDependencies，不影响运行时包体。

## License

内部项目，未授权外部分发。
