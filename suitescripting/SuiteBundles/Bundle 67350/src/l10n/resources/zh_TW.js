/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       11 Jun 2018     jmarimla         Initial
 * 2.00       19 Jun 2018     justaris         Added Strings
 * 3.00       29 Jun 2018     jmarimla         Added Strings
 * 4.00       06 Jul 2018     jmarimla         Added Strings
 * 5.00       17 Jul 2018     rwong            Added Strings
 * 6.00       26 Jul 2018     jmarimla         Added Strings
 * 7.00       30 Jul 2018     justaris         Added Strings
 * 8.00       26 Oct 2018     jmarimla         Added Strings
 * 9.00       07 Dec 2018     jmarimla         Added Strings
 * 10.00      22 Aug 2019     erepollo         Added Strings
 *
 */
/**
 * @NModuleScope Public
 */
define(function() {
    var translation = {
		//latest update from masterlist: 07 Dec 2018 7:00AM
		
    	//REQUESTED	
		"apm.cd.button.back" : "返回",
		"apm.cd.label.concurrencydetails" : "並行詳細資料",
		"apm.cd.label.detailedconcurrency" : "詳細並行",
		"apm.cd.label.exceededconcurrency" : "已超出並行",
		"apm.cd.label.instancedetails" : "例項詳細資料",
		"apm.cd.label.max" : "上限 - {0}",
		"apm.cd.label.sec" : "秒",
		"apm.cd.label.secs" : "秒",
		"apm.cd.label.viewrequests" : "檢視要求",
		"apm.cd.label.webservices" : "網上服務",
		"apm.cm.label._101andabove" : "101% (含) 以上",
		"apm.cm.label.concurrencylimit" : "並行限制",
		"apm.cm.label.concurrencymonitor" : "並行監控",
		"apm.cm.label.concurrencyusage" : "並行用量",
		"apm.cm.label.generalconcurrency" : "一般並行",
		"apm.cm.label.highestexceededconcurrency" : "最高的已超出並行",
		"apm.cm.label.note" : "附註",
		"apm.cm.label.peakconcurrency" : "尖峰並行",
		"apm.cm.label.percentvaluesareapproximate" : "百分比值為約數。",
		"apm.cm.label.requestexceedinglimit" : "要求超出限制",
		"apm.cm.label.requestswithinlimit" : "要求於限制 (%) 內",
		"apm.cm.label.totalexceededconcurrency" : "已超出並行總計",
		"apm.cm.label.valuesareexact" : "值為準確值。",
		"apm.common.alert.daterange._30days" : "日期範圍不應超出 30 天",
		"apm.common.alert.daterange._3days" : "日期範圍不應低於 3 天",
		"apm.common.alert.enablefeatures" : "必須啟用 [自訂記錄]、[用戸端 SuiteScript] 和 [伺服器 SuiteScript] 功能。 請啟用這些功能並重試。",
		"apm.common.alert.endaterequired" : "結束日期為必填",
		"apm.common.alert.entervalidenddate" : "請輸入有效的結束日期。",
		"apm.common.alert.entervalidstartdate" : "請輸入有效的開始日期。",
		"apm.common.alert.errorinsearch" : "搜尋發生錯誤",
		"apm.common.alert.errorinsuitelet" : "Suitelet 發生錯誤",
		"apm.common.alert.invalidenddate" : "無效結束日期",
		"apm.common.alert.invalidstartdate" : "無效開始日期",
		"apm.common.alert.nocontent" : "沒有內容",
		"apm.common.alert.startdateearlierthanenddate" : "開始日期必須早於結束日期。",
		"apm.common.alert.startdaterequired" : "開始日期為必要",
		"apm.common.button.cancel" : "取消",
		"apm.common.button.done" : "完成",
		"apm.common.button.refresh" : "重新整理",
		"apm.common.button.reset" : "重設",
		"apm.common.button.set" : "設定",
		"apm.common.highcharts.drilluptext" : "返回",
		"apm.common.highcharts.nodata" : "沒有要顯示的資料",
		"apm.common.highcharts.resetzoom" : "重設縮放",
		"apm.common.highcharts.resetzoomtitle" : "重設縮放層級 1:1",
		"apm.common.label._95th" : "第 95",
		"apm.common.label._95thpercentile" : "第 95 個百分位數",
		"apm.common.label.all" : "全部",
		"apm.common.label.asof" : "同 {0}",
		"apm.common.label.client" : "客戶",
		"apm.common.label.close" : "關閉",
		"apm.common.label.companyid" : "公司 ID",
		"apm.common.label.completed" : "已完成",
		"apm.common.label.concurrency" : "並行",
		"apm.common.label.concurrencycount" : "並行計數",
		"apm.common.label.context" : "內容",
		"apm.common.label.csvimport" : "CSV 匯入",
		"apm.common.label.custom" : "自訂",
		"apm.common.label.customdaterange" : "自訂日期範圍",
		"apm.common.label.customerdebugsettings" : "顧客除錯設定",
		"apm.common.label.dashboard" : "儀表板",
		"apm.common.label.daterange" : "日期範圍",
		"apm.common.label.datetime" : "日期和時間",
		"apm.common.label.deploymentname" : "部署名稱",
		"apm.common.label.edit" : "編輯",
		"apm.common.label.elevatedpriority" : "優先權已提升",
		"apm.common.label.email" : "電子郵件",
		"apm.common.label.enddate" : "結束日期",
		"apm.common.label.enddatetime" : "結束日期/時間",
		"apm.common.label.endtimerequired" : "結束時間為必填",
		"apm.common.label.errorrate" : "錯誤率",
		"apm.common.label.exceededconcurrencycount" : "已超出並行計數",
		"apm.common.label.executioncontext" : "執行內容",
		"apm.common.label.executiontime" : "執行時間",
		"apm.common.label.exportcsv" : "匯出 - CSV",
		"apm.common.label.failed" : "失敗",
		"apm.common.label.failedrequests" : "失敗的要求",
		"apm.common.label.filters" : "篩選器",
		"apm.common.label.from" : "開始於",
		"apm.common.label.histogram" : "直方圖",
		"apm.common.label.hr" : "小時",
		"apm.common.label.hrs" : "小時",
		"apm.common.label.instancecount" : "例項計數",
		"apm.common.label.integration" : "整合",
		"apm.common.label.last12hours" : "過去 12 小時",
		"apm.common.label.last14days" : "過去 14 天",
		"apm.common.label.last1hour" : "過去 1 小時",
		"apm.common.label.last24hours" : "過去　24 小時",
		"apm.common.label.last30days" : "過去 30 天",
		"apm.common.label.last3days" : "過去 3 天",
		"apm.common.label.last3hours" : "過去 3 小時",
		"apm.common.label.last6hours" : "過去 6 小時",
		"apm.common.label.last7days" : "過去 7 天",
		"apm.common.label.loading" : "正在載入",
		"apm.common.label.mapreduce" : "對映/減少",
		"apm.common.label.median" : "中位數",
		"apm.common.label.min" : "分鐘",
		"apm.common.label.mins" : "分鐘",
		"apm.common.label.mostusers" : "大部分使用者",
		"apm.common.label.name" : "名稱",
		"apm.common.label.network" : "網路",
		"apm.common.label.new" : "新增",
		"apm.common.label.nodataavailable" : "無可用資料",
		"apm.common.label.nodrilldowndata" : "沒有送回進一步查看資料",
		"apm.common.label.none" : "無",
		"apm.common.label.norecordstoshow" : "沒有記錄可顯示",
		"apm.common.label.notiledatavailable" : "此區塊無可用資料",
		"apm.common.label.numberoflogs" : "記錄數目",
		"apm.common.label.numberofusers" : "使用者數目",
		"apm.common.label.operation" : "操作",
		"apm.common.label.overview" : "概觀",
		"apm.common.label.pageinit" : "pageinit",
		"apm.common.label.percentage" : "百分率",
		"apm.common.label.queue" : "佇列",
		"apm.common.label.recordoperations" : "記錄操作",
		"apm.common.label.records" : "記錄",
		"apm.common.label.recordsperminute" : "每分鐘記錄",
		"apm.common.label.recordtype" : "記錄類型",
		"apm.common.label.rejectedaccountconcurrency" : "已拒絕的帳戶並行",
		"apm.common.label.rejecteduserconcurrency" : "已拒絕的使用者並行",
		"apm.common.label.requests" : "要求",
		"apm.common.label.responsetime" : "回應時間",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "角色",
		"apm.common.label.roles" : "角色",
		"apm.common.label.save" : "儲存",
		"apm.common.label.scheduled" : "已排程",
		"apm.common.label.scriptname" : "指令碼名稱",
		"apm.common.label.selectionaffectallportlets" : "所選項目會影響所有 Portlet",
		"apm.common.label.server" : "伺服器",
		"apm.common.label.setup" : "設定",
		"apm.common.label.sorting" : "排序",
		"apm.common.label.startdate" : "開始日期",
		"apm.common.label.startdatetime" : "開始日期/時間",
		"apm.common.label.status" : "狀態",
		"apm.common.label.timeline" : "時間軸",
		"apm.common.label.timeout" : "已逾時",
		"apm.common.label.timeoutrate" : "逾時率",
		"apm.common.label.to" : "至",
		"apm.common.label.total" : "總計",
		"apm.common.label.totalrecords" : "記錄總計",
		"apm.common.label.totalrequests" : "要求總計",
		"apm.common.label.totaltime" : "時間總計",
		"apm.common.label.type" : "類型",
		"apm.common.label.urlrequests" : "URL 要求",
		"apm.common.label.user" : "使用者",
		"apm.common.label.userevent" : "使用者事件",
		"apm.common.label.users" : "使用者",
		"apm.common.label.view" : "檢視",
		"apm.common.label.viewdetails" : "檢視詳細資料",
		"apm.common.label.viewfrhtdetails" : "檢視 FRHT 詳細資料",
		"apm.common.label.viewing" : "檢視",
		"apm.common.label.waittime" : "等待時間",
		"apm.common.label.webservice" : "網上服務",
		"apm.common.month.april" : "四月",
		"apm.common.month.august" : "八月",
		"apm.common.month.december" : "十二月",
		"apm.common.month.february" : "二月",
		"apm.common.month.january" : "一月",
		"apm.common.month.july" : "七月",
		"apm.common.month.june" : "六月",
		"apm.common.month.march" : "三月",
		"apm.common.month.may" : "五月",
		"apm.common.month.november" : "十一月",
		"apm.common.month.october" : "十月",
		"apm.common.month.september" : "九月",
		"apm.common.priority.high" : "高",
		"apm.common.priority.low" : "低",
		"apm.common.priority.standard" : "標準",
		"apm.common.shortmonth.april" : "四月",
		"apm.common.shortmonth.august" : "八月",
		"apm.common.shortmonth.december" : "十二月",
		"apm.common.shortmonth.february" : "二月",
		"apm.common.shortmonth.january" : "一月",
		"apm.common.shortmonth.july" : "七月",
		"apm.common.shortmonth.june" : "六月",
		"apm.common.shortmonth.march" : "三月",
		"apm.common.shortmonth.may" : "五月",
		"apm.common.shortmonth.november" : "十一月",
		"apm.common.shortmonth.october" : "十月",
		"apm.common.shortmonth.september" : "九月",
		"apm.common.shortweekday.friday" : "F",
		"apm.common.shortweekday.monday" : "M",
		"apm.common.shortweekday.saturday" : "S",
		"apm.common.shortweekday.sunday" : "S",
		"apm.common.shortweekday.thursday" : "T",
		"apm.common.shortweekday.tuesday" : "T",
		"apm.common.shortweekday.wednesday" : "W",
		"apm.common.time.am" : "上午",
		"apm.common.time.pm" : "下午",
		"apm.common.tooltip.percentfromtotal" : "% (佔總計)",
		"apm.common.weekday.friday" : "星期五",
		"apm.common.weekday.monday" : "星期一",
		"apm.common.weekday.saturday" : "星期六",
		"apm.common.weekday.sunday" : "星期天",
		"apm.common.weekday.thursday" : "星期四",
		"apm.common.weekday.tuesday" : "星期二",
		"apm.common.weekday.wednesday" : "星期三",
		"apm.db.alert.entervalidhistograminterval" : "請輸入有效的直方圖間隔",
		"apm.db.alert.entervalidresponsetime" : "請輸入有效的回應時間",
		"apm.db.alert.operationrequired" : "操作為必填",
		"apm.db.alert.recordtyperequired" : "記錄類型為必填",
		"apm.db.alert.starttimerequired" : "開始時間為必填",
		"apm.db.alert.watchlist10items" : "觀察清單最多只可有 10 個項目。",
		"apm.db.label.adddatetime" : "新增日期和時間",
		"apm.db.label.addwatchlist" : "新增觀察清單",
		"apm.db.label.chartpreferences" : "圖表偏好",
		"apm.db.label.customdatetime" : "自訂日期和時間",
		"apm.db.label.duplicaterecordtypeoperation" : "重複記錄類型和操作",
		"apm.db.label.endtime" : "結束時間",
		"apm.db.label.export" : "匯出",
		"apm.db.label.general" : "一般",
		"apm.db.label.highestresponsetime" : "最高回應時間",
		"apm.db.label.mostutilized" : "最多使用",
		"apm.db.label.outof" : "{1} 個中的 {0} 個",
		"apm.db.label.recordinstance" : "記錄例項",
		"apm.db.label.recordinstances" : "記錄例項",
		"apm.db.label.recordpages" : "記錄頁面",
		"apm.db.label.recordtiles" : "記錄區塊",
		"apm.db.label.removeall" : "移除全部",
		"apm.db.label.setuprecordpages" : "設定記錄頁面",
		"apm.db.label.showallrecordtiles" : "顯示所有記錄區塊",
		"apm.db.label.showwatchlistonly" : "只顯示觀察清單",
		"apm.db.label.starttime" : "開始時間",
		"apm.db.label.throughput" : "傳輸量",
		"apm.db.label.unknown" : "不明",
		"apm.db.label.usereventworkflow" : "使用者事件和工作流程",
		"apm.db.label.watchlist" : "觀察清單",
		"apm.db.responsetimechart.clientnetworkserver" : "客戶、網路和伺服器",
		"apm.db.setup.interval" : "間隔",
		"apm.ns.client.fieldchanged" : "fieldChanged",
		"apm.ns.client.lineinit" : "lineInit",
		"apm.ns.client.postsourcing" : "postSourcing",
		"apm.ns.client.recalc" : "recalc",
		"apm.ns.client.saverecord" : "saveRecord",
		"apm.ns.client.validatedelete" : "validateDelete",
		"apm.ns.client.validatefield" : "validateField",
		"apm.ns.client.validateinsert" : "validateInsert",
		"apm.ns.client.validateline" : "validateLine",
		"apm.ns.common.add" : "新增",
		"apm.ns.context.backend" : "後端",
		"apm.ns.context.customfielddefault" : "自訂欄位預設",
		"apm.ns.context.emailalert" : "電子郵件警示",
		"apm.ns.context.emailscheduled" : "已排程電子郵件",
		"apm.ns.context.machine" : "機器",
		"apm.ns.context.other" : "其他",
		"apm.ns.context.reminder" : "提醒",
		"apm.ns.context.snapshot" : "快照",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "網站",
		"apm.ns.context.workflow" : "工作流程",
		"apm.ns.status.finished" : "已完成",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "刪除",
		"apm.ns.wsa.update" : "更新",
		"apm.ptd.label.clientheader" : "客戶： 標題",
		"apm.ptd.label.clientinit" : "客戶： Init",
		"apm.ptd.label.clientrender" : "客戶： 轉譯",
		"apm.ptd.label.deploymentid" : "部署 ID",
		"apm.ptd.label.page" : "頁面",
		"apm.ptd.label.pagetimedetails" : "頁面時間詳細資料",
		"apm.ptd.label.script" : "指令碼",
		"apm.ptd.label.scriptaftersubmit" : "指令碼：aftersubmit: {0}",
		"apm.ptd.label.scriptbeforeload" : "指令碼：beforeload: {0}",
		"apm.ptd.label.scriptbeforesubmit" : "指令碼：beforesubmit: {0}",
		"apm.ptd.label.scriptpageinit" : "指令碼：pageinit: {0}",
		"apm.ptd.label.scripttypeworkflow" : "指令碼類型/工作流程",
		"apm.ptd.label.searches" : "搜尋",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScript 和工作流程詳細資料",
		"apm.ptd.label.time" : "時間",
		"apm.ptd.label.usage" : "用量",
		"apm.ptd.label.userevent" : "USEREVENT",
		"apm.pts.description._95thpercentile" : "在這個值 (或分數) 下可以找到 95% 的觀察",
		"apm.pts.description.average" : "數字平均值",
		"apm.pts.description.median" : "中間的數字 (在已順序的數字中)",
		"apm.pts.description.standarddeviation" : "數字分佈的測量方式",
		"apm.pts.label.aggregation" : "匯總",
		"apm.pts.label.and" : "和",
		"apm.pts.label.between" : "介於",
		"apm.pts.label.bundle" : "搭售品",
		"apm.pts.label.columnname" : "欄名",
		"apm.pts.label.description" : "說明",
		"apm.pts.label.details" : "詳細資料",
		"apm.pts.label.greaterthan" : "大於",
		"apm.pts.label.lessthan" : "少於",
		"apm.pts.label.meanaverage" : "平均數",
		"apm.pts.label.netsuitesystem" : "NetSuite 系統",
		"apm.pts.label.pagetimesummary" : "頁面時間摘要",
		"apm.pts.label.performancelogs" : "效能記錄",
		"apm.pts.label.responsetimeinseconds" : "回應時間 (秒)",
		"apm.pts.label.scriptworkflowtimebreakdown" : "指令碼/工作流程時間細分",
		"apm.pts.label.setupsummary" : "設定摘要",
		"apm.pts.label.show" : "顯示",
		"apm.pts.label.standarddeviation" : "標準差",
		"apm.pts.label.summary" : "摘要",
		"apm.scpm.alert.startdate30dayscurrentdate" : "開始日期不應超出目前日期後 30 天。",
		"apm.scpm.label.available" : "可用",
		"apm.scpm.label.availabletime" : "可用時間",
		"apm.scpm.label.aveexecutiontime" : "平均執行時間",
		"apm.scpm.label.averagewaittime" : "平均等待時間",
		"apm.scpm.label.avewaittime" : "平均等待時間",
		"apm.scpm.label.cancelled" : "已取消",
		"apm.scpm.label.complete" : "已完成",
		"apm.scpm.label.deferred" : "已延期",
		"apm.scpm.label.elevated" : "已提升",
		"apm.scpm.label.elevationinterval" : "提升間隔",
		"apm.scpm.label.jobs" : "工作",
		"apm.scpm.label.jobscompleted" : "已完成工作",
		"apm.scpm.label.jobsfailed" : "已失敗工作",
		"apm.scpm.label.jobstatus" : "工作狀態",
		"apm.scpm.label.noofreservedprocessors" : "留用處理器數目",
		"apm.scpm.label.original" : "原始",
		"apm.scpm.label.pending" : "等待中",
		"apm.scpm.label.priority" : "優先權",
		"apm.scpm.label.priorityelevation" : "優先權提升",
		"apm.scpm.label.processing" : "正在處理",
		"apm.scpm.label.processorconcurrency" : "處理器並行",
		"apm.scpm.label.processorreservation" : "處理器留用",
		"apm.scpm.label.processors" : "處理器",
		"apm.scpm.label.processorsettings" : "處理器設定",
		"apm.scpm.label.processorutilization" : "處理器利用",
		"apm.scpm.label.queueprocessordetails" : "佇列/處理器詳細資料",
		"apm.scpm.label.queues" : "佇列",
		"apm.scpm.label.reservedprocessorsinuse" : "使用中的留用處理器",
		"apm.scpm.label.retry" : "重試",
		"apm.scpm.label.reuseidleprocessors" : "重新使用閒置處理器",
		"apm.scpm.label.totalnoofprocessors" : "處理器總數",
		"apm.scpm.label.totalwaittime" : "等待時間總計",
		"apm.scpm.label.utilization" : "使用率",
		"apm.scpm.label.utilized" : "已用",
		"apm.scpm.label.utilizedtime" : "已用時間",
		"apm.scpm.label.waittimebypriority" : "以優先權排列的等待時間",
		"apm.setup.label.apmsetup" : "APM 設定",
		"apm.setup.label.employee" : "員工",
		"apm.setup.label.employees" : "員工",
		"apm.setup.label.setuppermissionlabel" : "設定 Application Performance Management SuiteApp 的權限",
		"apm.setup.top10mostutilized" : "使用最多的前 10 名",
		"apm.spa.label.highestexecutiontime" : "最高執行時間",
		"apm.spa.label.mostrequested" : "要求次數最多",
		"apm.spa.label.mosttimeouts" : "逾時次數最多",
		"apm.spa.label.savedsearches" : "已儲存搜尋",
		"apm.spa.label.searchperformanceanalysis" : "搜尋效能分析",
		"apm.spd.alert.searchloadingwait" : "正在載入您的搜尋。 請稍候。",
		"apm.spd.label.date" : "日期",
		"apm.spd.label.isfalse" : "false",
		"apm.spd.label.istrue" : "true",
		"apm.spd.label.savedsearch" : "已儲存搜尋",
		"apm.spd.label.savedsearchbycontext" : "以內容排列的已儲存搜尋",
		"apm.spd.label.savedsearchdetails" : "已儲存搜尋詳細資料",
		"apm.spd.label.savedsearchlogs" : "已儲存搜尋記錄",
		"apm.spd.label.searchperformancedetails" : "搜尋效能詳細資料",
		"apm.spjd.label.alldeployments" : "所有部署",
		"apm.spjd.label.alltasktypes" : "所有任務類型",
		"apm.spjd.label.datecreated" : "建立日期",
		"apm.spjd.label.deployment" : "部署",
		"apm.spjd.label.jobdetails" : "工作詳細資料",
		"apm.spjd.label.jobdetailstimeline" : "工作詳細資料時間軸",
		"apm.spjd.label.mapreduceexecutiontime" : "對映/減少執行時間",
		"apm.spjd.label.mapreducestage" : "對映/減少階段",
		"apm.spjd.label.mapreducewaittime" : "對映/減少等待時間",
		"apm.spjd.label.originalpriority" : "原始優先順序",
		"apm.spjd.label.scheduledexecutiontime" : "已排程的執行時間",
		"apm.spjd.label.scheduledwaittime" : "已排程的等待時間",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "SuiteCloud 處理器工作詳細資料",
		"apm.spjd.label.taskid" : "任務 ID",
		"apm.spjd.label.tasktype" : "任務類型",
		"apm.spm.label.suitecloudprocessormonitor" : "SuiteCloud 處理器監控",
		"apm.ssa.alert.enterclienteventtype" : "請選擇客戶事件類型。",
		"apm.ssa.alert.enterscriptid" : "請輸入指令碼 ID。",
		"apm.ssa.alert.enterscripttype" : "請選擇指令碼類型。",
		"apm.ssa.alert.selectscriptname" : "請選擇指令碼名稱",
		"apm.ssa.label.clienteventtype" : "客戶事件類型",
		"apm.ssa.label.errorcount" : "錯誤計數",
		"apm.ssa.label.performancechart" : "效能圖表",
		"apm.ssa.label.recordid" : "記錄 ID",
		"apm.ssa.label.scriptid" : "指令碼 ID",
		"apm.ssa.label.scripttype" : "指令碼類型",
		"apm.ssa.label.search" : "搜尋",
		"apm.ssa.label.searchcalls" : "搜尋電話通話",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "SuiteScript 分析",
		"apm.ssa.label.suitescriptdetails" : "SuiteScript 詳細資料",
		"apm.ssa.label.suitescriptexecutionovertime" : "一段時間以來的 SuiteScript 執行",
		"apm.ssa.label.usagecount" : "用量計數",
		"apm.ssa.label.usereventaftersubmit" : "使用者事件 (提交後)",
		"apm.ssa.label.usereventbeforeload" : "使用者事件 (載入前)",
		"apm.ssa.label.usereventbeforesubmit" : "使用者事件 (提交前)",
		"apm.ssa.label.userinterface" : "使用者介面",
		"apm.ssa.label.value" : "值",
		"apm.ssa.label.viewlogs" : "檢視記錄",
		"apm.ssa.label.webstore" : "網路商店",
		"apm.wsa.apiversion.notreleased" : "未發行",
		"apm.wsa.apiversion.notsupported" : "不支援",
		"apm.wsa.apiversion.supported" : "支援",
		"apm.wsa.apiversionusage.retired" : "已退休",
		"apm.wsa.label.apiversionusage" : "API 版本用量",
		"apm.wsa.label.executiontimeperrecordtype" : "每個記錄類型的執行時間",
		"apm.wsa.label.instancecountperrecordtype" : "每個記錄類型的例項計數",
		"apm.wsa.label.requestcount" : "要求計數",
		"apm.wsa.label.statusbreakdown" : "狀態細分",
		"apm.wsa.label.topwebservicesoperations" : "熱門網上服務操作",
		"apm.wsa.label.topwebservicesrecordprocessing" : "熱門網上服務記錄處理",
		"apm.wsa.label.webservicesanalysis" : "網上服務分析",
		"apm.wsa.label.webservicesoperationstatus" : "網上服務操作狀態",
		"apm.wsa.label.webservicesrecordprocessing" : "網上服務記錄處理",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "網上服務記錄處理狀態",
		"apm.wsod.label.performancedetails" : "效能詳細資料",
		"apm.wsod.label.timerange" : "時間範圍",
		"apm.wsod.label.toprecordsperformance" : "最高記錄效能",
		"apm.wsod.label.webservicesoperationdetails" : "網上服務操作詳細資料",
		"apm.wsod.label.webservicesoperationlogs" : "網上服務操作記錄",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "網上服務記錄處理記錄",
		"apm.common.label.performance" : "效能",

    	//NEW
		"apm.r2019a.profilerdetails": "分析工具詳細資料",
		"apm.r2019a.viewprofilerdetails": "檢視分析工具詳細資料",
		"apm.r2019a.averageexecutiontime": "平均執行時間",
		"apm.r2019a.medianexecutiontime": "執行時間中位數",
		"apm.r2019a.average": "平均",
		"apm.r2019a.important": "重要",
		"apm.r2019a.concurrencynote1": "「一般並行」Portlet 需要並行限制才能計算其值。",
		"apm.r2019a.concurrencynote2": "如果沒有並行限制的值 (-)，「一般並行」Portlet 會假設一般的限制，可能導致顯示的值不可靠。",
		"apm.r2019a.profiler": "分析工具",
		"apm.r2019a.timingdetails": "時機詳細資料",
		"apm.r2019a.datetime": "日期和時間",
		"apm.r2019a.workflows": "工作流程",
		"apm.r2019a.recordsfromscriptsworkflows": "來自指令碼/工作流程的記錄",
		"apm.r2019a.requesturls": "要求 URL",
		"apm.r2019a.entrypoint": "進入點",
		"apm.r2019a.triggertype": "觸發器類型",
		"apm.r2019a.method": "方式",
		"apm.r2019a.webserviceoperation": "網路服務作業",
		"apm.r2019a.apiversion": "API 版本",
		"apm.r2019a.profileroperationid": "分析工具作業 ID",
		"apm.r2019a.starttimeanddate": "開始時間和日期",
		"apm.r2019a.scripts": "指令碼",
		"apm.r2019a.profilertype": "分析工具類型",
		"apm.r2019a.record": "記錄",
		"apm.r2019a.requesturl": "要求 URL",
		"apm.r2019a.unclassified": "未分類",
		"apm.r2019a.url": "URL",
		"apm.r2019a.apicalls": "API 呼叫",
		"apm.r2019a.profilerdetailsalert": "APM 的「分析工具詳細資料」目前無法顯示用戶端指令碼的資訊。若要開啟「分析工具詳細資料」，請返回並選擇另一個指令碼。",
		"apm.r2019a.top": "頂部",
		"apm.r2019a.actionhistoryon": "{0} 動作歷史記錄，於 {1} {2}",
		"apm.r2019a.fromtopacifictime": "{0} {1} 到 {2} (太平洋時間)",
		"apm.r2019a.onpacifictime": "{0}是在 {1} {2} (太平洋時間)",
		"apm.r2019a.actions": "動作",
		"apm.r2019a.alldevices": "所有裝置",
		"apm.r2019a.alllocations": "所有位置",
		"apm.r2019a.allsubsidiaries": "所有子公司",
		"apm.r2019a.allusers": "所有使用者",
		"apm.r2019a.asofat": "截至 {0} {1}",
		"apm.r2019a.averageduration": "平均時間長度",
		"apm.r2019a.clickanddragtozoom": "點擊並拖放即可放大縮小",
		"apm.r2019a.moreinformation": "點擊此處取得更多資訊",
		"apm.r2019a.clientscripturl": "用戶端指令碼 URL",
		"apm.r2019a.customcsurlrequests": "自訂用戶端指令碼 URL 要求",
		"apm.r2019a.customizationaverage": "自訂內容平均",
		"apm.r2019a.lastupdatedon": "上次更新自訂內容資料是在 {0} {1}",
		"apm.r2019a.notavailable": "沒有自訂內容資料",
		"apm.r2019a.customizationperformance": "自訂內容效能",
		"apm.r2019a.customizationtime": "自訂內容時間",
		"apm.r2019a.device": "裝置",
		"apm.r2019a.devicelistisloading": "正在載入裝置清單。請稍候。",
		"apm.r2019a.devicename": "裝置名稱",
		"apm.r2019a.devices": "裝置",
		"apm.r2019a.enddatetime": "結束日期和時間",
		"apm.r2019a.event": "事件",
		"apm.r2019a.executioncount": "執行次數",
		"apm.r2019a.filter": "篩選器",
		"apm.r2019a.instances": "執行個體",
		"apm.r2019a.location": "位置",
		"apm.r2019a.locationid": "位置 ID",
		"apm.r2019a.locationlistisloading": "正在載入位置清單。請稍候。",
		"apm.r2019a.locations": "位置",
		"apm.r2019a.logid": "記錄 ID",
		"apm.r2019a.mostfrequent": "最經常",
		"apm.r2019a.nonbundle": "非搭售品",
		"apm.r2019a.nonbundledcomponents": "非搭售品零件",
		"apm.r2019a.operations": "作業",
		"apm.r2019a.overheadtime": "額外負荷時間",
		"apm.r2019a.pacifictime": "太平洋時間",
		"apm.r2019a.performancedataprocessing": "仍然在處理效能資料。若要查看完整的資料，請等待「使用者事件指令碼」和「工作流程」欄的值出現，再點擊此圖示。",
		"apm.r2019a.enteravalidtotalduration": "請輸入有效的總時間長度",
		"apm.r2019a.enteravalidusereventtime": "請輸入有效的使用者事件時間",
		"apm.r2019a.enteravalidworkflowtime": "請輸入有效的工作流程時間",
		"apm.r2019a.scisappothers": "SCIS 應用程式 + 其他",
		"apm.r2019a.scisbundle": "SCIS 搭售品",
		"apm.r2019a.servertime": "伺服器時間",
		"apm.r2019a.scispermissions": "設定角色的 SuiteCommerce InStore APM SuiteApp 權限。",
		"apm.r2019a.startdatetime": "開始日期和時間",
		"apm.r2019a.subsidiary": "子公司",
		"apm.r2019a.subsidiaryid": "子公司 ID",
		"apm.r2019a.subsidiarylistisloading": "正在載入子公司清單。請稍候。",
		"apm.r2019a.scisactionhistorydetail": "SuiteCommerce InStore 動作歷史記錄詳細資料",
		"apm.r2019a.scisperformancediagnostics": "SuiteCommerce InStore 效能診斷資料",
		"apm.r2019a.scisperformancesetup": "SuiteCommerce InStore 效能設定",
		"apm.r2019a.timebybundle": "各搭售品的時間",
		"apm.r2019a.timesources": "時間來源",
		"apm.r2019a.total95th": "總第 95 個",
		"apm.r2019a.totalaverage": "總平均",
		"apm.r2019a.totalduration": "總時間長度",
		"apm.r2019a.totaldurationandcustomizationperformance": "這段時間以來的總時間長度和自訂內容效能 (太平洋時間)",
		"apm.r2019a.totalmedian": "總中位數",
		"apm.r2019a.uninstalledbundle": "未安裝的搭售品",
		"apm.r2019a.usereventscripts": "使用者事件指令碼",
		"apm.r2019a.usereventtime": "使用者事件時間",
		"apm.r2019a.userlistisloading": "正在載入使用者清單。請稍候。",
		"apm.r2019a.valuesarestillprocessing": "有破折號的值 (–) 仍在處理中。請等待值出現，再檢視詳細資料。",
		"apm.r2019a.viewchart": "檢視圖表",
		"apm.r2019a.workflowname": "工作流程名稱",
		"apm.r2019a.workflowtime": "工作流程時間",
		"apm.r2019a.youcannotopenthispage": "由於未安裝 Application Performance (APM) SuiteApp，因此您不能開啟此頁面。請安裝 APM SuiteApp，然後再試一次。",
		"apm.r2019a.fieldhelp": "欄位說明",
		"apm.r2019a.whatsthis": "這是什麼？",
		"apm.r2019a.daterangefieldhelp": "請選擇時間期間，以檢視 SCIS 效能資料。日期範圍不能超過 30 天。",
		"apm.r2019a.locationfieldhelp": "選擇地點即可集中查看從特定零售商店記錄的效能資料。",
		"apm.r2019a.subsidiaryfieldhelp": "選擇子公司即可檢視特定子公司 (所有子公司) 中發生動作的效能資料。",
		"apm.r2019a.devicefieldhelp": "檢視在執行 SCIS 的特定裝置或所有裝置上取得的效能資料。",
		"apm.r2019a.employeefieldhelp": "選擇員工姓名即可檢視特定銷售員提交的交易相關的效能資料。",
		"apm.r2019a.sortfieldhelp": "您可以根據「最經常」和「最長執行時間」排序「動作」磚。「最經常」顯示最常發生的動作。執行時間最長的動作有最長的總時間長度時間。"
    };

    return translation;
});