
请帮我实现：

我引入了一个新的表单抽取组件位置在  extractions/newforms 中， 这个组件由 newforms 的页面和 templates/ 下面的模板， 还有 services/formsApiService 组成，他默认使用的localstorage  存储表单的数据。 具体配置文件在 config/appConfig.js 中。

现在整个表单的后端api调用服务就是 formsApiService.js 我需要按照下面的后端form接口文档进行修改，与后端api进行对接，并且默认不再使用localstorage，而是直接调用后台的api， 也不需要在appConfig.js中进行配置。

extractions/newforms 中的字段比较简单和后端api 对应不上，请按照我的声明进行字段信息对应如下

structure 对应的是

const newForm = {

      id: Date.now().toString(),

      name: form.name || '未命名表单',

      description: form.description || '',

      schema: form.schema || [],

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString()

    }

中的  schema， 是一个结构体；

structureResult 对应的是：schema 的数据结果 就是表单的数据result表格中的一样的结构；

其他newForm中缺少的字段可以按照接口的返回的对象建立精准的模型，按这个后端返回结果设计数据模型。后端返回form表单记录数据模型如下：

```javascript
{
  "createTime": "",
  "updateTime": "",
  "creator": "",
  "updater": "",
  "deleted": true,
  "id": 0,
  "userId": 0, // 如果为空就是公开表单
  "systemFlag": 0, 
  "name": "",
  "description": "",
  "structure": "",
  "structureResult": "",
  "esIndexName": "", //对应的存储在es中的索引的名字，es中主要存储structure 表单的值
  "status": 0, 
  "version": 0
}


# 后端form接口文档

## 创建表单


**接口地址**:`/admin-api/rag/ai/form/create`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "createTime": "",
  "updateTime": "",
  "creator": "",
  "updater": "",
  "deleted": true,
  "id": 0,
  "userId": 0,
  "systemFlag": 0,
  "name": "",
  "description": "",
  "structure": "",
  "structureResult": "",
  "esIndexName": "",
  "status": 0,
  "version": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|customFormDO|CustomFormDO|body|true|CustomFormDO|CustomFormDO|
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;creator|||false|string||
|&emsp;&emsp;updater|||false|string||
|&emsp;&emsp;deleted|||false|boolean||
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;userId|||false|integer(int64)||
|&emsp;&emsp;systemFlag|||false|integer(int32)||
|&emsp;&emsp;name|||false|string||
|&emsp;&emsp;description|||false|string||
|&emsp;&emsp;structure|||false|string||
|&emsp;&emsp;structureResult|||false|string||
|&emsp;&emsp;esIndexName|||false|string||
|&emsp;&emsp;status|||false|integer(int32)||
|&emsp;&emsp;version|||false|integer(int32)||
|X-User-Id||header|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultLong|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||integer(int64)|integer(int64)|


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": 0
}
```




## 更新表单


**接口地址**:`/admin-api/rag/ai/form/update`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "createTime": "",
  "updateTime": "",
  "creator": "",
  "updater": "",
  "deleted": true,
  "id": 0,
  "userId": 0,
  "systemFlag": 0,
  "name": "",
  "description": "",
  "structure": "",
  "structureResult": "",
  "esIndexName": "",
  "status": 0,
  "version": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|customFormDO|CustomFormDO|body|true|CustomFormDO|CustomFormDO|
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;creator|||false|string||
|&emsp;&emsp;updater|||false|string||
|&emsp;&emsp;deleted|||false|boolean||
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;userId|||false|integer(int64)||
|&emsp;&emsp;systemFlag|||false|integer(int32)||
|&emsp;&emsp;name|||false|string||
|&emsp;&emsp;description|||false|string||
|&emsp;&emsp;structure|||false|string||
|&emsp;&emsp;structureResult|||false|string||
|&emsp;&emsp;esIndexName|||false|string||
|&emsp;&emsp;status|||false|integer(int32)||
|&emsp;&emsp;version|||false|integer(int32)||
|X-User-Id||header|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```


## 获取表单


**接口地址**:`/admin-api/rag/ai/form/get`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|integer(int64)||
|X-User-Id||header|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultCustomFormDO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||CustomFormDO|CustomFormDO|
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;creator||string||
|&emsp;&emsp;updater||string||
|&emsp;&emsp;deleted||boolean||
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;systemFlag||integer(int32)||
|&emsp;&emsp;name||string||
|&emsp;&emsp;description||string||
|&emsp;&emsp;structure||string||
|&emsp;&emsp;structureResult||string||
|&emsp;&emsp;esIndexName||string||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;version||integer(int32)||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": {
		"createTime": "",
		"updateTime": "",
		"creator": "",
		"updater": "",
		"deleted": true,
		"id": 0,
		"userId": 0,
		"systemFlag": 0,
		"name": "",
		"description": "",
		"structure": "",
		"structureResult": "",
		"esIndexName": "",
		"status": 0,
		"version": 0
	}
}
```




## 删除表单


**接口地址**:`/admin-api/rag/ai/form/delete`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|integer(int64)||
|X-User-Id||header|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultBoolean|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|msg||string||
|data||boolean||


**响应示例**:
```javascript
{
	"code": 0,
	"msg": "",
	"data": true
}
```