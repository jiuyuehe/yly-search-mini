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