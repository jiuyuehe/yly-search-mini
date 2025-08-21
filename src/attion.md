搜索的流程说明：

+ 用户在 SearchBox 中输入内容 / 选择类型 /（可选）上传图片，点击搜索或快捷键。
+ SearchBox 调用 handleSearch -> emit('search', query, type, imageFile)。
+ SearchView.vue 监听 @search，调用本地 handleSearch -> searchStore.search(...)。
+ Pinia store 中 search() 组装参数 buildParams()，调用 searchService.search(params, imageFile)。
+ searchService 根据是否有 imageFile 选择 multipart 或 x-www-form-urlencoded ，向 /admin-api/documents/search 发送请求。
+ 响应数据转为前端渲染结构，更新 store，界面自动刷新。