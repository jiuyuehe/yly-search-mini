服务器地址为：`http://localhost:8080`

## 检索文档列表（支持多种搜索类型，搜索类型: keyword(关键词搜索,默认), vector(向量搜索), hybrid(混合搜索)）


**接口地址**:`/admin-api/documents/search`


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