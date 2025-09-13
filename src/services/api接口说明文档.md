服务器地址为：`http://localhost:48080`



## 检索文档列表（支持多种搜索类型，搜索类型: keyword(关键词搜索,默认), vector(向量搜索), hybrid(混合搜索)）


**接口地址**:`/admin-api/rag/documents/search`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword||query|false|string||
|offset||query|false|integer(int32)||
|limit||query|false|integer(int32)||
|userId||query|false|integer(int64)||
|shareId||query|false|integer(int64)||
|createrId||query|false|integer(int64)||
|fileCategory||query|false|string||
|groupId||query|false|string||
|docType||query|false|string||
|timeDis||query|false|string||
|startDate||query|false|string||
|endDate||query|false|string||
|fileSize||query|false|string||
|minSize||query|false|integer(int64)||
|maxSize||query|false|integer(int64)||
|searchStatus||query|false|integer(int32)||
|fileAiTag||query|false|string||
|fileSysTag||query|false|string||
|folder||query|false|boolean||
|hasHistory||query|false|boolean||
|extname||query|false|string||
|searchType||query|false|string||
|searchMode||query|false|string||
|scoreThreshold||query|false|number(double)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultSearchResult|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||SearchResult|SearchResult|
|&emsp;&emsp;total||integer(int64)||
|&emsp;&emsp;types||object||
|&emsp;&emsp;fileList||array|CommonFile|
|&emsp;&emsp;&emsp;&emsp;fileId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;parentId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fsFileId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;trashId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;taskId||string||
|&emsp;&emsp;&emsp;&emsp;parentIds||string||
|&emsp;&emsp;&emsp;&emsp;layer||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;filePath||string||
|&emsp;&emsp;&emsp;&emsp;fileName||string||
|&emsp;&emsp;&emsp;&emsp;fileExt||string||
|&emsp;&emsp;&emsp;&emsp;fsFileName||string||
|&emsp;&emsp;&emsp;&emsp;fsFileThumb||string||
|&emsp;&emsp;&emsp;&emsp;fileSize||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;folder||boolean||
|&emsp;&emsp;&emsp;&emsp;docType||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;fileVersion||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fileAction||string||
|&emsp;&emsp;&emsp;&emsp;delStatus||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;createrId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;createrName||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateUserId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;updateUserName||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;searchStatus||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;shareId||array|integer|
|&emsp;&emsp;&emsp;&emsp;topDeptFolder||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;deptId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;groupId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;nasId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;nasFileId||string||
|&emsp;&emsp;&emsp;&emsp;rootPath||string||
|&emsp;&emsp;&emsp;&emsp;subPath||string||
|&emsp;&emsp;&emsp;&emsp;hot||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fileCategory||string||
|&emsp;&emsp;&emsp;&emsp;fileLang||string||
|&emsp;&emsp;&emsp;&emsp;fileThemeLibrary||string||
|&emsp;&emsp;&emsp;&emsp;fileSummary||string||
|&emsp;&emsp;&emsp;&emsp;fileSummaryTranslate||string||
|&emsp;&emsp;&emsp;&emsp;fileAiTag||string||
|&emsp;&emsp;&emsp;&emsp;fileSysTag||string||
|&emsp;&emsp;&emsp;&emsp;fileEntities||string||
|&emsp;&emsp;&emsp;&emsp;fileMarks||string||
|&emsp;&emsp;&emsp;&emsp;fileTranslate||string||
|&emsp;&emsp;&emsp;&emsp;userCustomAttributes||string||
|&emsp;&emsp;&emsp;&emsp;fileContents||string||
|&emsp;&emsp;&emsp;&emsp;fileImageContents||string||
|&emsp;&emsp;&emsp;&emsp;dctermsCreated||string||
|&emsp;&emsp;&emsp;&emsp;dctermsModified||string||
|&emsp;&emsp;&emsp;&emsp;dcCreator||string||
|&emsp;&emsp;&emsp;&emsp;numberOfPages||string||
|&emsp;&emsp;&emsp;&emsp;fileGlossary||string||
|&emsp;&emsp;&emsp;&emsp;isImage||boolean||
|&emsp;&emsp;&emsp;&emsp;imageFeatures||ImageFeatures|ImageFeatures|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;colorHistogram||array|number|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;phash||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;deepFeatures||array|number|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;siftFeatures||array|number|
|&emsp;&emsp;&emsp;&emsp;imageOcrText||string||
|&emsp;&emsp;&emsp;&emsp;fileType||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;packageId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;strategyLevel||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;historyVersion||boolean||
|&emsp;&emsp;&emsp;&emsp;highlightFileName||array|string|
|&emsp;&emsp;&emsp;&emsp;score||number(double)||
|&emsp;&emsp;searchTime||integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"total": 0,
		"types": {},
		"fileList": [
			{
				"fileId": 0,
				"parentId": 0,
				"fsFileId": 0,
				"trashId": 0,
				"taskId": "",
				"parentIds": "",
				"layer": 0,
				"filePath": "",
				"fileName": "",
				"fileExt": "",
				"fsFileName": "",
				"fsFileThumb": "",
				"fileSize": 0,
				"folder": true,
				"docType": 0,
				"fileVersion": 0,
				"fileAction": "",
				"delStatus": 0,
				"createrId": 0,
				"createrName": "",
				"createTime": "",
				"updateUserId": 0,
				"updateUserName": "",
				"updateTime": "",
				"searchStatus": 0,
				"shareId": [],
				"topDeptFolder": 0,
				"deptId": 0,
				"userId": 0,
				"groupId": 0,
				"nasId": 0,
				"nasFileId": "",
				"rootPath": "",
				"subPath": "",
				"hot": 0,
				"fileCategory": "",
				"fileLang": "",
				"fileThemeLibrary": "",
				"fileSummary": "",
				"fileSummaryTranslate": "",
				"fileAiTag": "",
				"fileSysTag": "",
				"fileEntities": "",
				"fileMarks": "",
				"fileTranslate": "",
				"userCustomAttributes": "",
				"fileContents": "",
				"fileImageContents": "",
				"dctermsCreated": "",
				"dctermsModified": "",
				"dcCreator": "",
				"numberOfPages": "",
				"fileGlossary": "",
				"isImage": true,
				"imageFeatures": {
					"colorHistogram": [],
					"phash": "",
					"deepFeatures": [],
					"siftFeatures": []
				},
				"imageOcrText": "",
				"fileType": 0,
				"packageId": 0,
				"strategyLevel": 0,
				"historyVersion": true,
				"highlightFileName": [],
				"score": 0
			}
		],
		"searchTime": 0
	},
	"msg": ""
}
```





## 获取用户列表（filterUsers）


**接口地址**:`/admin-api/rag/documents/users`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListFilterUserResult|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|FilterUserResult|
|&emsp;&emsp;userName||string||
|&emsp;&emsp;userId||integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"userName": "",
			"userId": 0
		}
	],
	"msg": ""
}
```




## 获取聚合列表-条件统计（filters-condition）


**接口地址**:`/admin-api/rag/documents/aggregations/stats`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded,multipart/form-data`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|keyword||query|false|string||
|offset||query|false|integer(int32)||
|limit||query|false|integer(int32)||
|userId||query|false|integer(int64)||
|shareId||query|false|integer(int64)||
|createrId||query|false|integer(int64)||
|fileCategory||query|false|string||
|groupId||query|false|string||
|docType||query|false|string||
|timeDis||query|false|string||
|startDate||query|false|string||
|endDate||query|false|string||
|fileSize||query|false|string||
|minSize||query|false|integer(int64)||
|maxSize||query|false|integer(int64)||
|searchStatus||query|false|integer(int32)||
|fileAiTag||query|false|string||
|fileSysTag||query|false|string||
|folder||query|false|boolean||
|hasHistory||query|false|boolean||
|extname||query|false|string||
|searchType||query|false|string||
|searchMode||query|false|string||
|scoreThreshold||query|false|number(double)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||
|file||query|false|file||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringListFilterResult|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||FilterResult|FilterResult|
|&emsp;&emsp;key||string||
|&emsp;&emsp;count||integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"additionalProperties1": {
			"key": "",
			"count": 0
		}
	},
	"msg": ""
}
```



## 获取文档基础信息


**接口地址**:`/admin-api/rag/documents/basicinfo`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "esid": "",
  "fc": "",
  "fi": 0,
  "fsi": 0,
  "nsi": "",
  "nsubp": "",
  "nsp": "",
  "nfi": "",
  "nti": "",
  "processTypes": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|indexDocRQ|IndexDocRQ|body|true|IndexDocRQ|IndexDocRQ|
|&emsp;&emsp;esid|||false|string||
|&emsp;&emsp;fc|||false|string||
|&emsp;&emsp;fi|||false|integer(int64)||
|&emsp;&emsp;fsi|||false|integer(int64)||
|&emsp;&emsp;nsi|||false|string||
|&emsp;&emsp;nsubp|||false|string||
|&emsp;&emsp;nsp|||false|string||
|&emsp;&emsp;nfi|||false|string||
|&emsp;&emsp;nti|||false|string||
|&emsp;&emsp;processTypes|||false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultCommonFile|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||CommonFile|CommonFile|
|&emsp;&emsp;fileId||integer(int64)||
|&emsp;&emsp;parentId||integer(int64)||
|&emsp;&emsp;fsFileId||integer(int64)||
|&emsp;&emsp;trashId||integer(int64)||
|&emsp;&emsp;taskId||string||
|&emsp;&emsp;parentIds||string||
|&emsp;&emsp;layer||integer(int64)||
|&emsp;&emsp;filePath||string||
|&emsp;&emsp;fileName||string||
|&emsp;&emsp;fileExt||string||
|&emsp;&emsp;fsFileName||string||
|&emsp;&emsp;fsFileThumb||string||
|&emsp;&emsp;fileSize||integer(int64)||
|&emsp;&emsp;folder||boolean||
|&emsp;&emsp;docType||integer(int32)||
|&emsp;&emsp;fileVersion||integer(int64)||
|&emsp;&emsp;fileAction||string||
|&emsp;&emsp;delStatus||integer(int32)||
|&emsp;&emsp;createrId||integer(int64)||
|&emsp;&emsp;createrName||string||
|&emsp;&emsp;createTime||string||
|&emsp;&emsp;updateUserId||integer(int64)||
|&emsp;&emsp;updateUserName||string||
|&emsp;&emsp;updateTime||string||
|&emsp;&emsp;searchStatus||integer(int32)||
|&emsp;&emsp;shareId||array|integer(int64)|
|&emsp;&emsp;topDeptFolder||integer(int64)||
|&emsp;&emsp;deptId||integer(int64)||
|&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;groupId||integer(int64)||
|&emsp;&emsp;nasId||integer(int64)||
|&emsp;&emsp;nasFileId||string||
|&emsp;&emsp;rootPath||string||
|&emsp;&emsp;subPath||string||
|&emsp;&emsp;hot||integer(int64)||
|&emsp;&emsp;fileCategory||string||
|&emsp;&emsp;fileLang||string||
|&emsp;&emsp;fileThemeLibrary||string||
|&emsp;&emsp;fileSummary||string||
|&emsp;&emsp;fileSummaryTranslate||string||
|&emsp;&emsp;fileAiTag||string||
|&emsp;&emsp;fileSysTag||string||
|&emsp;&emsp;fileEntities||string||
|&emsp;&emsp;fileMarks||string||
|&emsp;&emsp;fileTranslate||string||
|&emsp;&emsp;userCustomAttributes||string||
|&emsp;&emsp;fileContents||string||
|&emsp;&emsp;fileImageContents||string||
|&emsp;&emsp;dctermsCreated||string||
|&emsp;&emsp;dctermsModified||string||
|&emsp;&emsp;dcCreator||string||
|&emsp;&emsp;numberOfPages||string||
|&emsp;&emsp;fileGlossary||string||
|&emsp;&emsp;isImage||boolean||
|&emsp;&emsp;imageFeatures||ImageFeatures|ImageFeatures|
|&emsp;&emsp;&emsp;&emsp;colorHistogram||array|number|
|&emsp;&emsp;&emsp;&emsp;phash||string||
|&emsp;&emsp;&emsp;&emsp;deepFeatures||array|number|
|&emsp;&emsp;&emsp;&emsp;siftFeatures||array|number|
|&emsp;&emsp;imageOcrText||string||
|&emsp;&emsp;fileType||integer(int32)||
|&emsp;&emsp;packageId||integer(int64)||
|&emsp;&emsp;strategyLevel||integer(int32)||
|&emsp;&emsp;historyVersion||boolean||
|&emsp;&emsp;highlightFileName||array|string|
|&emsp;&emsp;score||number(double)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"fileId": 0,
		"parentId": 0,
		"fsFileId": 0,
		"trashId": 0,
		"taskId": "",
		"parentIds": "",
		"layer": 0,
		"filePath": "",
		"fileName": "",
		"fileExt": "",
		"fsFileName": "",
		"fsFileThumb": "",
		"fileSize": 0,
		"folder": true,
		"docType": 0,
		"fileVersion": 0,
		"fileAction": "",
		"delStatus": 0,
		"createrId": 0,
		"createrName": "",
		"createTime": "",
		"updateUserId": 0,
		"updateUserName": "",
		"updateTime": "",
		"searchStatus": 0,
		"shareId": [],
		"topDeptFolder": 0,
		"deptId": 0,
		"userId": 0,
		"groupId": 0,
		"nasId": 0,
		"nasFileId": "",
		"rootPath": "",
		"subPath": "",
		"hot": 0,
		"fileCategory": "",
		"fileLang": "",
		"fileThemeLibrary": "",
		"fileSummary": "",
		"fileSummaryTranslate": "",
		"fileAiTag": "",
		"fileSysTag": "",
		"fileEntities": "",
		"fileMarks": "",
		"fileTranslate": "",
		"userCustomAttributes": "",
		"fileContents": "",
		"fileImageContents": "",
		"dctermsCreated": "",
		"dctermsModified": "",
		"dcCreator": "",
		"numberOfPages": "",
		"fileGlossary": "",
		"isImage": true,
		"imageFeatures": {
			"colorHistogram": [],
			"phash": "",
			"deepFeatures": [],
			"siftFeatures": []
		},
		"imageOcrText": "",
		"fileType": 0,
		"packageId": 0,
		"strategyLevel": 0,
		"historyVersion": true,
		"highlightFileName": [],
		"score": 0
	},
	"msg": ""
}
```



## 文本标签生成


**接口地址**:`/admin-api/rag/ai/text/tags`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "text": "",
  "texts": [],
  "esId": "",
  "modelId": 0,
  "roleId": 0,
  "userPrompt": "",
  "targetLang": "",
  "candidateCategories": [],
  "outputFormat": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|textProcessBaseReq|TextProcessBaseReq|body|true|TextProcessBaseReq|TextProcessBaseReq|
|&emsp;&emsp;text|单文本内容||false|string||
|&emsp;&emsp;texts|批量文本||false|array|string|
|&emsp;&emsp;esId|核心索引文档 ES ID，用于写入富化索引，可选||false|string||
|&emsp;&emsp;modelId|AI 模型 ID，可选。不填则走角色关联或默认模型||false|integer(int64)||
|&emsp;&emsp;roleId|AI 系统角色ID，可选||false|integer(int64)||
|&emsp;&emsp;userPrompt|用户自定义提示词，追加到系统提示后||false|string||
|&emsp;&emsp;targetLang|目标语言，用于翻译或多语言摘要||false|string||
|&emsp;&emsp;candidateCategories|候选分类标签列表||false|array|string|
|&emsp;&emsp;outputFormat|返回格式：plain/json/tag_list||false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
  "code": 0,
  "data": {
    "keywords": [
      {
        "weight": 1,
        "tag": "王你当海"
      },
      {
        "weight": 0.8333,
        "tag": "迀出已公四"
      },
      {
        "weight": 0.6667,
        "tag": "泰国总理"
      },
      {
        "weight": 0.5,
        "tag": "代子稩功"
      },
      {
        "weight": 0.1667,
        "tag": "宪法法院"
      },
      {
        "weight": 0,
        "tag": "佩通坦"
      }
    ]
  },
  "msg": ""
}
```



## 获取已缓存标签（不触发生成）


**接口地址**:`/admin-api/rag/ai/text/tags/{esId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||path|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"msg": ""
}
```



## 手动更新标签（写入 enrich，不调用模型）


**接口地址**:`/admin-api/rag/ai/text/tags/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "esId": "",
  "keywords": []
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|tagsUpdateReq|TagsUpdateReq|body|true|TagsUpdateReq|TagsUpdateReq|
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;keywords|||false|array|object|
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 文本摘要


**接口地址**:`/admin-api/rag/ai/text/summary`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "text": "",
  "texts": [],
  "esId": "",
  "modelId": 0,
  "roleId": 0,
  "userPrompt": "",
  "targetLang": "",
  "candidateCategories": [],
  "outputFormat": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|textProcessBaseReq|TextProcessBaseReq|body|true|TextProcessBaseReq|TextProcessBaseReq|
|&emsp;&emsp;text|单文本内容||false|string||
|&emsp;&emsp;texts|批量文本||false|array|string|
|&emsp;&emsp;esId|核心索引文档 ES ID，用于写入富化索引，可选||false|string||
|&emsp;&emsp;modelId|AI 模型 ID，可选。不填则走角色关联或默认模型||false|integer(int64)||
|&emsp;&emsp;roleId|AI 系统角色ID，可选||false|integer(int64)||
|&emsp;&emsp;userPrompt|用户自定义提示词，追加到系统提示后||false|string||
|&emsp;&emsp;targetLang|目标语言，用于翻译或多语言摘要||false|string||
|&emsp;&emsp;candidateCategories|候选分类标签列表||false|array|string|
|&emsp;&emsp;outputFormat|返回格式：plain/json/tag_list||false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
  "code": 0,
  "data": {
    "summary": "{\n  \"summary\": \"泰国宪法法院裁决佩通坦·钦那瓦被停职总理，解除其总理职务。佩通坦是泰国最年轻的首位女总理，她被停职后于7月宣誓就任文化部长，随后出庭接受质询并提交最后陈词。这种决定可能影响政局，泰国政府将面临重组或触发提前大选，导致政治动荡和经济不稳定。\",\n  \"key_points\": [\n    \"佩通坦被停职总理，解除其总理职务\",\n    \"她是泰国最年轻的首位女总理，也是泰党党首\",\n    \"这种决定可能影响政局，泰国政府将面临重组或触发提前大选\"\n  ]\n}"
  },
  "msg": ""
}
```



## 获取已缓存摘要（不触发生成）


**接口地址**:`/admin-api/rag/ai/text/summary/{esId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||path|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"msg": ""
}
```



## 手动更新摘要（直接写入enrich与主索引，不调用模型）


**接口地址**:`/admin-api/rag/ai/text/summary/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "esId": "",
  "summarySource": "",
  "summary": "",
  "summaryTarget": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|summaryUpdateReq|SummaryUpdateReq|body|true|SummaryUpdateReq|SummaryUpdateReq|
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;summarySource|||false|string||
|&emsp;&emsp;summary|||false|string||
|&emsp;&emsp;summaryTarget|||false|string||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 实体识别


**接口地址**:`/admin-api/rag/ai/text/ner`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "text": "",
  "texts": [],
  "esId": "",
  "modelId": 0,
  "roleId": 0,
  "userPrompt": "",
  "targetLang": "",
  "candidateCategories": [],
  "outputFormat": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|textProcessBaseReq|TextProcessBaseReq|body|true|TextProcessBaseReq|TextProcessBaseReq|
|&emsp;&emsp;text|单文本内容||false|string||
|&emsp;&emsp;texts|批量文本||false|array|string|
|&emsp;&emsp;esId|核心索引文档 ES ID，用于写入富化索引，可选||false|string||
|&emsp;&emsp;modelId|AI 模型 ID，可选。不填则走角色关联或默认模型||false|integer(int64)||
|&emsp;&emsp;roleId|AI 系统角色ID，可选||false|integer(int64)||
|&emsp;&emsp;userPrompt|用户自定义提示词，追加到系统提示后||false|string||
|&emsp;&emsp;targetLang|目标语言，用于翻译或多语言摘要||false|string||
|&emsp;&emsp;candidateCategories|候选分类标签列表||false|array|string|
|&emsp;&emsp;outputFormat|返回格式：plain/json/tag_list||false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array||
|msg||string||


**响应示例**:
```javascript
{
  "code": 0,
  "data": [
    {
      "text": "佩通坦·钦那瓦",
      "type": "PER"
    },
    {
      "text": "泰国宪法法院",
      "type": "ORG"
    },
    {
      "text": "泰国",
      "type": "LOC"
    }
  ],
  "msg": ""
}
```



## 获取已缓存实体（不触发生成）


**接口地址**:`/admin-api/rag/ai/text/ner/{esId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||path|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [],
	"msg": ""
}
```



## 手动更新实体（写入 enrich，不调用模型）


**接口地址**:`/admin-api/rag/ai/text/ner/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "esId": "",
  "ner": []
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|nerUpdateReq|NerUpdateReq|body|true|NerUpdateReq|NerUpdateReq|
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;ner|||false|array|object|
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 文本翻译 (LLM)


**接口地址**:`/admin-api/rag/ai/text/translate`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "text": "",
  "texts": [],
  "esId": "",
  "modelId": 0,
  "roleId": 0,
  "userPrompt": "",
  "targetLang": "",
  "candidateCategories": [],
  "outputFormat": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|textProcessBaseReq|TextProcessBaseReq|body|true|TextProcessBaseReq|TextProcessBaseReq|
|&emsp;&emsp;text|单文本内容||false|string||
|&emsp;&emsp;texts|批量文本||false|array|string|
|&emsp;&emsp;esId|核心索引文档 ES ID，用于写入富化索引，可选||false|string||
|&emsp;&emsp;modelId|AI 模型 ID，可选。不填则走角色关联或默认模型||false|integer(int64)||
|&emsp;&emsp;roleId|AI 系统角色ID，可选||false|integer(int64)||
|&emsp;&emsp;userPrompt|用户自定义提示词，追加到系统提示后||false|string||
|&emsp;&emsp;targetLang|目标语言，用于翻译或多语言摘要||false|string||
|&emsp;&emsp;candidateCategories|候选分类标签列表||false|array|string|
|&emsp;&emsp;outputFormat|返回格式：plain/json/tag_list||false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"msg": ""
}
```



## 手动更新翻译（写入 enrich，不调用模型）


**接口地址**:`/admin-api/rag/ai/text/translate/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "esId": "",
  "translated": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|translationUpdateReq|TranslationUpdateReq|body|true|TranslationUpdateReq|TranslationUpdateReq|
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;translated|||false|string||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 获取已缓存翻译（不触发生成）


**接口地址**:`/admin-api/rag/ai/text/translate/{esId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||path|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"msg": ""
}
```




## 分页查询


**接口地址**:`/admin-api/rag/ai/translate/glossary/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|pageNo|页码，从 1 开始|query|true|integer(int32)||
|pageSize|每页条数，最大值为 100|query|true|integer(int32)||
|type|类型|query|false|string||
|originalText|原文模糊|query|false|string||
|language|目标语言|query|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultPageResultGlossaryEntryRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultGlossaryEntryRespVO|PageResultGlossaryEntryRespVO|
|&emsp;&emsp;list|数据|array|GlossaryEntryRespVO|
|&emsp;&emsp;&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;&emsp;&emsp;originalText||string||
|&emsp;&emsp;&emsp;&emsp;translatedText||string||
|&emsp;&emsp;&emsp;&emsp;language||string||
|&emsp;&emsp;&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;createTime|创建时间|string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateTime|更新时间|string(date-time)||
|&emsp;&emsp;total|总量|integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"list": [
			{
				"id": 0,
				"type": "",
				"originalText": "",
				"translatedText": "",
				"language": "",
				"status": 0,
				"createTime": "",
				"updateTime": ""
			}
		],
		"total": 0
	},
	"msg": ""
}
```



## 创建条目


**接口地址**:`/admin-api/rag/ai/translate/glossary/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "type": "",
  "originalText": "",
  "translatedText": "",
  "language": "",
  "status": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|glossaryEntrySaveReqVO|GlossaryEntrySaveReqVO|body|true|GlossaryEntrySaveReqVO|GlossaryEntrySaveReqVO|
|&emsp;&emsp;id|ID, 更新时必填||false|integer(int64)||
|&emsp;&emsp;type|类型 terminology|memory|corpus||true|string||
|&emsp;&emsp;originalText|原文||true|string||
|&emsp;&emsp;translatedText|译文||true|string||
|&emsp;&emsp;language|目标语言||true|string||
|&emsp;&emsp;status|状态 1=启用 0=禁用||true|integer(int32)||
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
|data||integer(int64)|integer(int64)|
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"msg": ""
}
```



## 更新条目


**接口地址**:`/admin-api/rag/ai/translate/glossary/update`


**请求方式**:`PUT`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "id": 0,
  "type": "",
  "originalText": "",
  "translatedText": "",
  "language": "",
  "status": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|glossaryEntrySaveReqVO|GlossaryEntrySaveReqVO|body|true|GlossaryEntrySaveReqVO|GlossaryEntrySaveReqVO|
|&emsp;&emsp;id|ID, 更新时必填||false|integer(int64)||
|&emsp;&emsp;type|类型 terminology|memory|corpus||true|string||
|&emsp;&emsp;originalText|原文||true|string||
|&emsp;&emsp;translatedText|译文||true|string||
|&emsp;&emsp;language|目标语言||true|string||
|&emsp;&emsp;status|状态 1=启用 0=禁用||true|integer(int32)||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 删除条目


**接口地址**:`/admin-api/rag/ai/translate/glossary/delete`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|integer(int64)||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```








## 创建文件-百科会话


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "userId": 0,
  "title": "",
  "esId": "",
  "roleId": 0,
  "modelId": 0,
  "temperature": 0,
  "maxTokens": 0,
  "maxContexts": 0,
  "userPrompt": "",
  "returnHistory": true,
  "newSession": true
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|fileChatSessionCreateReqVO|FileChatSessionCreateReqVO|body|true|FileChatSessionCreateReqVO|FileChatSessionCreateReqVO|
|&emsp;&emsp;userId|||false|integer(int64)||
|&emsp;&emsp;title|||false|string||
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;roleId|||false|integer(int64)||
|&emsp;&emsp;modelId|||false|integer(int64)||
|&emsp;&emsp;temperature|||false|number(double)||
|&emsp;&emsp;maxTokens|||false|integer(int32)||
|&emsp;&emsp;maxContexts|||false|integer(int32)||
|&emsp;&emsp;userPrompt|||false|string||
|&emsp;&emsp;returnHistory|||false|boolean||
|&emsp;&emsp;newSession|||false|boolean||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultFileChatSessionRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||FileChatSessionRespVO|FileChatSessionRespVO|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;title||string||
|&emsp;&emsp;esId||string||
|&emsp;&emsp;roleId||integer(int64)||
|&emsp;&emsp;modelId||integer(int64)||
|&emsp;&emsp;model||string||
|&emsp;&emsp;systemMessage||string||
|&emsp;&emsp;userPrompt||string||
|&emsp;&emsp;pinned||boolean||
|&emsp;&emsp;pinnedTime||string(date-time)||
|&emsp;&emsp;messageCount||integer(int32)||
|&emsp;&emsp;history||array|FileChatMessageSimpleVO|
|&emsp;&emsp;&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;useContext||boolean||
|&emsp;&emsp;&emsp;&emsp;segmentRefs||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string(date-time)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"id": 0,
		"title": "",
		"esId": "",
		"roleId": 0,
		"modelId": 0,
		"model": "",
		"systemMessage": "",
		"userPrompt": "",
		"pinned": true,
		"pinnedTime": "",
		"messageCount": 0,
		"history": [
			{
				"id": 0,
				"type": "",
				"content": "",
				"useContext": true,
				"segmentRefs": "",
				"createTime": ""
			}
		]
	},
	"msg": ""
}
```


## 发送消息(流式)


**接口地址**:`/admin-api/rag/ai/text/file-chat/stream`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`text/event-stream`


**接口描述**:


**请求示例**:


```javascript
{
  "sessionId": 0,
  "esId": "",
  "content": "",
  "useContext": true,
  "topK": 0,
  "maxContextChars": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|fileChatMessageSendReqVO|FileChatMessageSendReqVO|body|true|FileChatMessageSendReqVO|FileChatMessageSendReqVO|
|&emsp;&emsp;sessionId|||false|integer(int64)||
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;content|||false|string||
|&emsp;&emsp;useContext|||false|boolean||
|&emsp;&emsp;topK|||false|integer(int32)||
|&emsp;&emsp;maxContextChars|||false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|FileChatChunkRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|sessionId||integer(int64)|integer(int64)|
|partType||string||
|content||string||
|references||array|FileChatReference|
|&emsp;&emsp;id||string||
|&emsp;&emsp;score||number(double)||
|&emsp;&emsp;type||string||
|&emsp;&emsp;startOffset||integer(int32)||
|&emsp;&emsp;endOffset||integer(int32)||
|&emsp;&emsp;preview||string||


**响应示例**:
```javascript
[
	{
		"sessionId": 0,
		"partType": "",
		"content": "",
		"references": [
			{
				"id": "",
				"score": 0,
				"type": "",
				"startOffset": 0,
				"endOffset": 0,
				"preview": ""
			}
		]
	}
]
```



## 分页获取用户会话列表


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||query|false|integer(int64)||
|esId||query|false|string||
|pageNo||query|false|integer(int32)||
|pageSize||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```text
object
```






## 获取最近一次文件-百科会话（不存在则返回 null，可前端决定是否创建）


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/latest`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||query|false|integer(int64)||
|esId||query|false|string||
|returnHistory||query|false|boolean||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultFileChatSessionRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||FileChatSessionRespVO|FileChatSessionRespVO|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;title||string||
|&emsp;&emsp;esId||string||
|&emsp;&emsp;roleId||integer(int64)||
|&emsp;&emsp;modelId||integer(int64)||
|&emsp;&emsp;model||string||
|&emsp;&emsp;systemMessage||string||
|&emsp;&emsp;history||array|FileChatMessageSimpleVO|
|&emsp;&emsp;&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;type||string||
|&emsp;&emsp;&emsp;&emsp;content||string||
|&emsp;&emsp;&emsp;&emsp;useContext||boolean||
|&emsp;&emsp;&emsp;&emsp;segmentRefs||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string(date-time)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"id": 0,
		"title": "",
		"esId": "",
		"roleId": 0,
		"modelId": 0,
		"model": "",
		"systemMessage": "",
		"history": [
			{
				"id": 0,
				"type": "",
				"content": "",
				"useContext": true,
				"segmentRefs": "",
				"createTime": ""
			}
		]
	},
	"msg": ""
}
```



## 清空某文件(或百科)所有会话


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/clear`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||query|false|integer(int64)||
|esId||query|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```text
object
```



## 分页获取用户会话列表


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|userId||query|false|integer(int64)||
|esId||query|false|string||
|pageNo||query|false|integer(int32)||
|pageSize||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```text
object
```



## 更新会话用户提示词


**接口地址**:`/admin-api/rag/ai/text/file-chat/session/update-user-prompt`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|sessionId||query|true|integer(int64)||
|userPrompt||query|true|string||
|userId||query|false|integer(int64)||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```




## 列出主题分类列表


**接口地址**:`/admin-api/rag/ai/theme/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListThemeDO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|ThemeDO|
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;creator||string||
|&emsp;&emsp;updater||string||
|&emsp;&emsp;deleted||boolean||
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;name||string||
|&emsp;&emsp;code||string||
|&emsp;&emsp;description||string||
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;sort||integer(int32)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"createTime": "",
			"updateTime": "",
			"creator": "",
			"updater": "",
			"deleted": true,
			"id": 0,
			"name": "",
			"code": "",
			"description": "",
			"status": 0,
			"sort": 0
		}
	],
	"msg": ""
}
```




## 对文档进行主题分类(推荐)


**接口地址**:`/admin-api/rag/ai/theme/classify`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>esId 指向 enrich 索引记录；使用其 summary/tags/ner 字段进行主题匹配；若存在向量或可计算向量则加入 embedding 相似度</p>



**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||query|true|string||
|topN||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListThemeClassificationRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|ThemeClassificationRespVO|
|&emsp;&emsp;themeId||integer(int64)||
|&emsp;&emsp;themeName||string||
|&emsp;&emsp;scorePercent||number(double)||
|&emsp;&emsp;rawScore||number(double)||
|&emsp;&emsp;matchedKeywords||array|string|
|&emsp;&emsp;reason||string||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"themeId": 0,
			"themeName": "",
			"scorePercent": 0,
			"rawScore": 0,
			"matchedKeywords": [],
			"reason": ""
		}
	],
	"msg": ""
}
```





## 确认文档主题分类(添加)


**接口地址**:`/admin-api/rag/ai/theme/confirm`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>将主题对象增量写入 enrich 索引字段 theme（追加去重/合并）</p>



**请求示例**:


```javascript
{
  "esId": "",
  "theme": {
    "themeId": 0,
    "themeName": "",
    "scorePercent": 0,
    "rawScore": 0,
    "matchedKeywords": [],
    "reason": ""
  },
  "themes": [
    {
      "themeId": 0,
      "themeName": "",
      "scorePercent": 0,
      "rawScore": 0,
      "matchedKeywords": [],
      "reason": ""
    }
  ]
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|confirmThemeReq|ConfirmThemeReq|body|true|ConfirmThemeReq|ConfirmThemeReq|
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;theme|||false|ThemeClassificationRespVO|ThemeClassificationRespVO|
|&emsp;&emsp;&emsp;&emsp;themeId|||false|integer(int64)||
|&emsp;&emsp;&emsp;&emsp;themeName|||false|string||
|&emsp;&emsp;&emsp;&emsp;scorePercent|||false|number(double)||
|&emsp;&emsp;&emsp;&emsp;rawScore|||false|number(double)||
|&emsp;&emsp;&emsp;&emsp;matchedKeywords|||false|array|string|
|&emsp;&emsp;&emsp;&emsp;reason|||false|string||
|&emsp;&emsp;themes|||false|array|ThemeClassificationRespVO|
|&emsp;&emsp;&emsp;&emsp;themeId|||false|integer(int64)||
|&emsp;&emsp;&emsp;&emsp;themeName|||false|string||
|&emsp;&emsp;&emsp;&emsp;scorePercent|||false|number(double)||
|&emsp;&emsp;&emsp;&emsp;rawScore|||false|number(double)||
|&emsp;&emsp;&emsp;&emsp;matchedKeywords|||false|array|string|
|&emsp;&emsp;&emsp;&emsp;reason|||false|string||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 获取已保存的主题匹配结果


**接口地址**:`/admin-api/rag/ai/theme/matches/{esId}`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||path|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {},
	"msg": ""
}
```


## 创建主题


**接口地址**:`/admin-api/rag/ai/theme/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


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
  "name": "",
  "code": "",
  "description": "",
  "status": 0,
  "sort": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|themeDO|ThemeDO|body|true|ThemeDO|ThemeDO|
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;creator|||false|string||
|&emsp;&emsp;updater|||false|string||
|&emsp;&emsp;deleted|||false|boolean||
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;name|||false|string||
|&emsp;&emsp;code|||false|string||
|&emsp;&emsp;description|||false|string||
|&emsp;&emsp;status|||false|integer(int32)||
|&emsp;&emsp;sort|||false|integer(int32)||
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
|data||integer(int64)|integer(int64)|
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"msg": ""
}
```



## 删除主题


**接口地址**:`/admin-api/rag/ai/theme/delete`


**请求方式**:`DELETE`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||query|true|integer(int64)||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 创建主题标签


**接口地址**:`/admin-api/rag/ai/theme/tag/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


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
  "themeId": 0,
  "keyword": "",
  "weight": 0,
  "synonyms": ""
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|themeTagDO|ThemeTagDO|body|true|ThemeTagDO|ThemeTagDO|
|&emsp;&emsp;createTime|||false|string(date-time)||
|&emsp;&emsp;updateTime|||false|string(date-time)||
|&emsp;&emsp;creator|||false|string||
|&emsp;&emsp;updater|||false|string||
|&emsp;&emsp;deleted|||false|boolean||
|&emsp;&emsp;id|||false|integer(int64)||
|&emsp;&emsp;themeId|||false|integer(int64)||
|&emsp;&emsp;keyword|||false|string||
|&emsp;&emsp;weight|||false|number(double)||
|&emsp;&emsp;synonyms|||false|string||
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
|data||integer(int64)|integer(int64)|
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"msg": ""
}
```


## 列出某主题标签


**接口地址**:`/admin-api/rag/ai/theme/{id}/tags`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|id||path|true|integer(int64)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListThemeTagDO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|ThemeTagDO|
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;creator||string||
|&emsp;&emsp;updater||string||
|&emsp;&emsp;deleted||boolean||
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;themeId||integer(int64)||
|&emsp;&emsp;keyword||string||
|&emsp;&emsp;weight||number(double)||
|&emsp;&emsp;synonyms||string||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"createTime": "",
			"updateTime": "",
			"creator": "",
			"updater": "",
			"deleted": true,
			"id": 0,
			"themeId": 0,
			"keyword": "",
			"weight": 0,
			"synonyms": ""
		}
	],
	"msg": ""
}
```



## 分页获取主题（附带标签列表）


**接口地址**:`/admin-api/rag/ai/theme/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|status||query|false|integer(int32)||
|pageNo||query|false|integer(int32)||
|pageSize||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultPageResultThemeWithTagsRespVO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultThemeWithTagsRespVO|PageResultThemeWithTagsRespVO|
|&emsp;&emsp;list|数据|array|ThemeWithTagsRespVO|
|&emsp;&emsp;&emsp;&emsp;id|主题ID|integer(int64)||
|&emsp;&emsp;&emsp;&emsp;name|主题名称|string||
|&emsp;&emsp;&emsp;&emsp;code|主题编码|string||
|&emsp;&emsp;&emsp;&emsp;description|描述|string||
|&emsp;&emsp;&emsp;&emsp;status|状态 0/1|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;sort|排序|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;tags|标签列表|array|ThemeTagDO|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;creator||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;updater||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;deleted||boolean||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;themeId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;keyword||string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;weight||number(double)||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;synonyms||string||
|&emsp;&emsp;total|总量|integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"list": [
			{
				"id": 0,
				"name": "",
				"code": "",
				"description": "",
				"status": 0,
				"sort": 0,
				"tags": [
					{
						"createTime": "",
						"updateTime": "",
						"creator": "",
						"updater": "",
						"deleted": true,
						"id": 0,
						"themeId": 0,
						"keyword": "",
						"weight": 0,
						"synonyms": ""
					}
				]
			}
		],
		"total": 0
	},
	"msg": ""
}
```



## 自定义表单结构抽取


**接口地址**:`/admin-api/rag/ai/text/extract/form`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:<p>传 formId 时自动加载已保存结构；也可直接传 structure；默认使用角色 80013</p>



**请求示例**:


```javascript
{
  "text": "",
  "texts": [],
  "esId": "",
  "modelId": 0,
  "roleId": 0,
  "userPrompt": "",
  "targetLang": "",
  "sourceLang": "",
  "candidateCategories": [],
  "outputFormat": "",
  "formId": 0,
  "formName": "",
  "structure": {
    "formName": "",
    "fields": [
      {
        "name": "",
        "type": "",
        "example": {},
        "required": true
      }
    ]
  },
  "saveToEnrich": true,
  "userId": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|formExtractionReq|FormExtractionReq|body|true|FormExtractionReq|FormExtractionReq|
|&emsp;&emsp;text|单文本内容||false|string||
|&emsp;&emsp;texts|批量文本||false|array|string|
|&emsp;&emsp;esId|核心索引文档 ES ID，用于写入富化索引，可选||false|string||
|&emsp;&emsp;modelId|AI 模型 ID，可选。不填则走角色关联或默认模型||false|integer(int64)||
|&emsp;&emsp;roleId|AI 系统角色ID，可选||false|integer(int64)||
|&emsp;&emsp;userPrompt|用户自定义提示词，追加到系统提示后||false|string||
|&emsp;&emsp;targetLang|目标语言，用于翻译或多语言摘要||false|string||
|&emsp;&emsp;sourceLang|源语言，可选。不填可由模型自判断。示例: en / zh / ja ...||false|string||
|&emsp;&emsp;candidateCategories|候选分类标签列表||false|array|string|
|&emsp;&emsp;outputFormat|返回格式：plain/json/tag_list||false|string||
|&emsp;&emsp;formId|||false|integer(int64)||
|&emsp;&emsp;formName|||false|string||
|&emsp;&emsp;structure|||false|CustomFormStructureDTO|CustomFormStructureDTO|
|&emsp;&emsp;&emsp;&emsp;formName|||false|string||
|&emsp;&emsp;&emsp;&emsp;fields|||false|array|FormFieldDTO|
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;name|||false|string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;type|||false|string||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;example|||false|object||
|&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;required|||false|boolean||
|&emsp;&emsp;saveToEnrich|||false|boolean||
|&emsp;&emsp;userId|||false|integer(int64)||
|X-User-Id||header|false|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultFormExtractionResp|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||FormExtractionResp|FormExtractionResp|
|&emsp;&emsp;formId||integer(int64)||
|&emsp;&emsp;formName||string||
|&emsp;&emsp;fields||array|FieldResult|
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;value||object||
|&emsp;&emsp;&emsp;&emsp;confidence||number(double)||
|&emsp;&emsp;&emsp;&emsp;notFound||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"formId": 0,
		"formName": "",
		"fields": [
			{
				"name": "",
				"value": {},
				"confidence": 0,
				"notFound": true
			}
		]
	},
	"msg": ""
}
```



## 分页查询表单 (本人 + 公共)


**接口地址**:`/admin-api/rag/ai/form/page`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|X-User-Id||header|false|string||
|name||query|false|string||
|status||query|false|integer(int32)||
|systemFlag||query|false|integer(int32)||
|ownerUserId||query|false|integer(int64)||
|pageNo||query|false|integer(int32)||
|pageSize||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultPageResultCustomFormDO|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultCustomFormDO|PageResultCustomFormDO|
|&emsp;&emsp;list|数据|array|CustomFormDO|
|&emsp;&emsp;&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;&emsp;&emsp;updateTime||string(date-time)||
|&emsp;&emsp;&emsp;&emsp;creator||string||
|&emsp;&emsp;&emsp;&emsp;updater||string||
|&emsp;&emsp;&emsp;&emsp;deleted||boolean||
|&emsp;&emsp;&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;systemFlag||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;name||string||
|&emsp;&emsp;&emsp;&emsp;description||string||
|&emsp;&emsp;&emsp;&emsp;structure||string||
|&emsp;&emsp;&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;version||integer(int32)||
|&emsp;&emsp;total|总量|integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"list": [
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
				"status": 0,
				"version": 0
			}
		],
		"total": 0
	},
	"msg": ""
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
|&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;version||integer(int32)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
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
		"status": 0,
		"version": 0
	},
	"msg": ""
}
```



## 创建表单


**接口地址**:`/admin-api/rag/ai/form/create`


**请求方式**:`POST`


**请求数据类型**:`application/json`


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
|data||integer(int64)|integer(int64)|
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"msg": ""
}
```



## 更新表单


**接口地址**:`/admin-api/rag/ai/form/update`


**请求方式**:`POST`


**请求数据类型**:`application/json`


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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 克隆表单为当前用户私有


**接口地址**:`/admin-api/rag/ai/form/clone`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
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
|data||integer(int64)|integer(int64)|
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": 0,
	"msg": ""
}
```




## 保存一次确认后的抽取结果到历史


**接口地址**:`/admin-api/rag/ai/text/extract/form/history/save`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "formId": 0,
  "formName": "",
  "esId": "",
  "fields": [
    {
      "name": "",
      "value": {},
      "confidence": 0,
      "notFound": true,
      "offset": 0,
      "snippet": ""
    }
  ],
  "userId": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|formExtractionHistorySaveReq|FormExtractionHistorySaveReq|body|true|FormExtractionHistorySaveReq|FormExtractionHistorySaveReq|
|&emsp;&emsp;formId|||false|integer(int64)||
|&emsp;&emsp;formName|||false|string||
|&emsp;&emsp;esId|||false|string||
|&emsp;&emsp;fields|||false|array|FieldResult|
|&emsp;&emsp;&emsp;&emsp;name|||false|string||
|&emsp;&emsp;&emsp;&emsp;value|||false|object||
|&emsp;&emsp;&emsp;&emsp;confidence|||false|number(double)||
|&emsp;&emsp;&emsp;&emsp;notFound|||false|boolean||
|&emsp;&emsp;&emsp;&emsp;offset|||false|integer(int32)||
|&emsp;&emsp;&emsp;&emsp;snippet|||false|string||
|&emsp;&emsp;userId|||false|integer(int64)||
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
|data||boolean||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": true,
	"msg": ""
}
```



## 查询表单抽取历史(最近)


**接口地址**:`/admin-api/rag/ai/text/extract/form/history/list`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>可选 formId / esId 过滤，limit 默认 50</p>



**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|X-User-Id||header|false|string||
|formId||query|false|integer(int64)||
|esId||query|false|string||
|limit||query|false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListFormExtractionHistoryQueryResp|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array|FormExtractionHistoryQueryResp|
|&emsp;&emsp;id||integer(int64)||
|&emsp;&emsp;formId||integer(int64)||
|&emsp;&emsp;formName||string||
|&emsp;&emsp;esId||string||
|&emsp;&emsp;fieldFoundCount||integer(int32)||
|&emsp;&emsp;fieldTotalCount||integer(int32)||
|&emsp;&emsp;avgConfidence||number(double)||
|&emsp;&emsp;createTime||string(date-time)||
|&emsp;&emsp;fields||object||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [
		{
			"id": 0,
			"formId": 0,
			"formName": "",
			"esId": "",
			"fieldFoundCount": 0,
			"fieldTotalCount": 0,
			"avgConfidence": 0,
			"createTime": "",
			"fields": {}
		}
	],
	"msg": ""
}
```






## RAG-关联文档推荐


**接口地址**:`/admin-api/rag/ai/recommend/related`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:<p>基于目标文档(enrich esId)返回关联文档列表; useLLM=true 时使用角色 80012 进行重排</p>



**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||query|true|string||
|topN||query|false|integer(int32)||
|useLLM||query|false|boolean||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultListMapStringObject|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||array||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": [],
	"msg": ""
}
```





## 获取标签云


**接口地址**:`/admin-api/rag/tag-cloud/getKeywordsCloud`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK||


**响应参数**:


暂无


**响应示例**:
```text
string
```


## 通过标签查找文件


**接口地址**:`/admin-api/rag/tag-cloud/files/by-tags`


**请求方式**:`POST`


**请求数据类型**:`application/json`


**响应数据类型**:`*/*`


**接口描述**:


**请求示例**:


```javascript
{
  "tags": [],
  "page": 0,
  "pageSize": 0,
  "matchMode": "",
  "weightMode": "",
  "minimumShouldMatch": 0
}
```


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|tagFilterReq|TagFilterReq|body|true|TagFilterReq|TagFilterReq|
|&emsp;&emsp;tags|||false|array|string|
|&emsp;&emsp;page|||false|integer(int32)||
|&emsp;&emsp;pageSize|||false|integer(int32)||
|&emsp;&emsp;matchMode|||false|string||
|&emsp;&emsp;weightMode|||false|string||
|&emsp;&emsp;minimumShouldMatch|||false|integer(int32)||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultPageResultCommonFile|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||PageResultCommonFile|PageResultCommonFile|
|&emsp;&emsp;list|数据|array|CommonFile|
|&emsp;&emsp;&emsp;&emsp;fileId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;parentId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;parentIds||string||
|&emsp;&emsp;&emsp;&emsp;fileName||string||
|&emsp;&emsp;&emsp;&emsp;filePath||string||
|&emsp;&emsp;&emsp;&emsp;fileSize||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;folder||boolean||
|&emsp;&emsp;&emsp;&emsp;fileVersion||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fileAction||string||
|&emsp;&emsp;&emsp;&emsp;createrId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;createrName||string||
|&emsp;&emsp;&emsp;&emsp;createTime||string||
|&emsp;&emsp;&emsp;&emsp;updateUserId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;updateUserName||string||
|&emsp;&emsp;&emsp;&emsp;updateTime||string||
|&emsp;&emsp;&emsp;&emsp;fsFileId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;thumb||string||
|&emsp;&emsp;&emsp;&emsp;delStatus||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;searchStatus||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;docType||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;taskId||string||
|&emsp;&emsp;&emsp;&emsp;layer||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;trashId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fsFileName||string||
|&emsp;&emsp;&emsp;&emsp;fsFileThumb||string||
|&emsp;&emsp;&emsp;&emsp;nasId||string||
|&emsp;&emsp;&emsp;&emsp;nasFileId||string||
|&emsp;&emsp;&emsp;&emsp;rootPath||string||
|&emsp;&emsp;&emsp;&emsp;subPath||string||
|&emsp;&emsp;&emsp;&emsp;lastModified||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fileExt||string||
|&emsp;&emsp;&emsp;&emsp;topDeptFolder||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;deptId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;userId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;groupId||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;shareId||array|integer|
|&emsp;&emsp;&emsp;&emsp;hot||integer(int64)||
|&emsp;&emsp;&emsp;&emsp;fileCategory||string||
|&emsp;&emsp;&emsp;&emsp;fileLang||string||
|&emsp;&emsp;&emsp;&emsp;fileThemeLibrary||string||
|&emsp;&emsp;&emsp;&emsp;fileSummary||string||
|&emsp;&emsp;&emsp;&emsp;fileSummaryTranslate||string||
|&emsp;&emsp;&emsp;&emsp;fileAiTag||string||
|&emsp;&emsp;&emsp;&emsp;fileSysTag||string||
|&emsp;&emsp;&emsp;&emsp;fileEntities||string||
|&emsp;&emsp;&emsp;&emsp;fileMarks||string||
|&emsp;&emsp;&emsp;&emsp;fileTranslate||string||
|&emsp;&emsp;&emsp;&emsp;userCustomAttributes||string||
|&emsp;&emsp;&emsp;&emsp;fileContents||string||
|&emsp;&emsp;&emsp;&emsp;dctermsCreated||string||
|&emsp;&emsp;&emsp;&emsp;dctermsModified||string||
|&emsp;&emsp;&emsp;&emsp;dcCreator||string||
|&emsp;&emsp;&emsp;&emsp;numberOfPages||string||
|&emsp;&emsp;&emsp;&emsp;fileGlossary||string||
|&emsp;&emsp;&emsp;&emsp;isImage||boolean||
|&emsp;&emsp;&emsp;&emsp;imageOcrText||string||
|&emsp;&emsp;&emsp;&emsp;historyVersion||boolean||
|&emsp;&emsp;&emsp;&emsp;status||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;fileType||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;strategyLevel||integer(int32)||
|&emsp;&emsp;&emsp;&emsp;highlightFileName||array|string|
|&emsp;&emsp;&emsp;&emsp;score||number(double)||
|&emsp;&emsp;&emsp;&emsp;matchSource||string||
|&emsp;&emsp;total|总量|integer(int64)||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": {
		"list": [
			{
				"fileId": 0,
				"parentId": 0,
				"parentIds": "",
				"fileName": "",
				"filePath": "",
				"fileSize": 0,
				"folder": true,
				"fileVersion": 0,
				"fileAction": "",
				"createrId": 0,
				"createrName": "",
				"createTime": "",
				"updateUserId": 0,
				"updateUserName": "",
				"updateTime": "",
				"fsFileId": 0,
				"thumb": "",
				"delStatus": 0,
				"searchStatus": 0,
				"docType": 0,
				"taskId": "",
				"layer": 0,
				"trashId": 0,
				"fsFileName": "",
				"fsFileThumb": "",
				"nasId": "",
				"nasFileId": "",
				"rootPath": "",
				"subPath": "",
				"lastModified": 0,
				"fileExt": "",
				"topDeptFolder": 0,
				"deptId": 0,
				"userId": 0,
				"groupId": 0,
				"shareId": [],
				"hot": 0,
				"fileCategory": "",
				"fileLang": "",
				"fileThemeLibrary": "",
				"fileSummary": "",
				"fileSummaryTranslate": "",
				"fileAiTag": "",
				"fileSysTag": "",
				"fileEntities": "",
				"fileMarks": "",
				"fileTranslate": "",
				"userCustomAttributes": "",
				"fileContents": "",
				"dctermsCreated": "",
				"dctermsModified": "",
				"dcCreator": "",
				"numberOfPages": "",
				"fileGlossary": "",
				"isImage": true,
				"imageOcrText": "",
				"historyVersion": true,
				"status": 0,
				"fileType": 0,
				"strategyLevel": 0,
				"highlightFileName": [],
				"score": 0,
				"matchSource": ""
			}
		],
		"total": 0
	},
	"msg": ""
}
```




## 更新标签云


**接口地址**:`/admin-api/rag/tag-cloud/updateKeywordsCloud`


**请求方式**:`GET`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultString|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||string||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": "",
	"msg": ""
}
```




## OCR识别


**接口地址**:`/admin-api/rag/ocr/recognize`


**请求方式**:`POST`


**请求数据类型**:`application/x-www-form-urlencoded`


**响应数据类型**:`*/*`


**接口描述**:


**请求参数**:


**请求参数**:


| 参数名称 | 参数说明 | 请求类型    | 是否必须 | 数据类型 | schema |
| -------- | -------- | ----- | -------- | -------- | ------ |
|esId||query|true|string||
|tenant-id|租户编号|header|false|integer(int32)||
|Authorization|认证 Token|header|false|string||


**响应状态**:


| 状态码 | 说明 | schema |
| -------- | -------- | ----- | 
|200|OK|CommonResultString|


**响应参数**:


| 参数名称 | 参数说明 | 类型 | schema |
| -------- | -------- | ----- |----- | 
|code||integer(int32)|integer(int32)|
|data||string||
|msg||string||


**响应示例**:
```javascript
{
	"code": 0,
	"data": "",
	"msg": ""
}
```