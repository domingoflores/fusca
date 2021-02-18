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
		"apm.cd.button.back" : "戻る",
		"apm.cd.label.concurrencydetails" : "同時実行詳細",
		"apm.cd.label.detailedconcurrency" : "詳細同時実行",
		"apm.cd.label.exceededconcurrency" : "超過同時実行",
		"apm.cd.label.instancedetails" : "インスタンス詳細",
		"apm.cd.label.max" : "最大 - {0}",
		"apm.cd.label.sec" : "秒",
		"apm.cd.label.secs" : "秒",
		"apm.cd.label.viewrequests" : "表示リクエスト",
		"apm.cd.label.webservices" : "ウェブサービス",
		"apm.cm.label._101andabove" : "101%以上",
		"apm.cm.label.concurrencylimit" : "同時実行制限",
		"apm.cm.label.concurrencymonitor" : "同時実行モニター",
		"apm.cm.label.concurrencyusage" : "同時使用量",
		"apm.cm.label.generalconcurrency" : "一般同時実行",
		"apm.cm.label.highestexceededconcurrency" : "最大超過同時実行",
		"apm.cm.label.note" : "注意",
		"apm.cm.label.peakconcurrency" : "ピーク同時実行",
		"apm.cm.label.percentvaluesareapproximate" : "割合値は概算です。",
		"apm.cm.label.requestexceedinglimit" : "制限を超過したリクエスト",
		"apm.cm.label.requestswithinlimit" : "制限内のリクエスト（%）",
		"apm.cm.label.totalexceededconcurrency" : "合計超過同時実行",
		"apm.cm.label.valuesareexact" : "値は正確です。",
		"apm.common.alert.daterange._30days" : "日付範囲は30日以内にしてください。",
		"apm.common.alert.daterange._3days" : "日付範囲は3日以上にしてください。",
		"apm.common.alert.enablefeatures" : "［カスタムレコード］、［クライアントSuiteScript］、［サーバSuiteScript］の機能を有効にする必要があります。機能を有効にしてもう一度お試しください。",
		"apm.common.alert.endaterequired" : "終了日は必須です",
		"apm.common.alert.entervalidenddate" : "有効な終了日を入力してください。",
		"apm.common.alert.entervalidstartdate" : "有効な開始日を入力してください。",
		"apm.common.alert.errorinsearch" : "検索でエラーが発生しました",
		"apm.common.alert.errorinsuitelet" : "Suiteletでエラーが発生しました",
		"apm.common.alert.invalidenddate" : "無効な終了日",
		"apm.common.alert.invalidstartdate" : "無効な開始日",
		"apm.common.alert.nocontent" : "コンテンツなし",
		"apm.common.alert.startdateearlierthanenddate" : "開始日は終了日より早い日付に設定してください。",
		"apm.common.alert.startdaterequired" : "開始日は必須です",
		"apm.common.button.cancel" : "キャンセル",
		"apm.common.button.done" : "完了",
		"apm.common.button.refresh" : "更新",
		"apm.common.button.reset" : "リセット",
		"apm.common.button.set" : "設定",
		"apm.common.highcharts.drilluptext" : "戻る",
		"apm.common.highcharts.nodata" : "表示するデータなし",
		"apm.common.highcharts.resetzoom" : "ズームをリセット",
		"apm.common.highcharts.resetzoomtitle" : "ズームレベルを1:1にリセット",
		"apm.common.label._95th" : "95番目",
		"apm.common.label._95thpercentile" : "95パーセンタイル",
		"apm.common.label.all" : "すべて",
		"apm.common.label.asof" : "{0}現在",
		"apm.common.label.client" : "クライアント",
		"apm.common.label.close" : "終了",
		"apm.common.label.companyid" : "会社ID",
		"apm.common.label.completed" : "完了",
		"apm.common.label.concurrency" : "同時実行",
		"apm.common.label.concurrencycount" : "同時実行回数",
		"apm.common.label.context" : "コンテキスト",
		"apm.common.label.csvimport" : "CSVインポート",
		"apm.common.label.custom" : "カスタム",
		"apm.common.label.customdaterange" : "カスタム日付範囲",
		"apm.common.label.customerdebugsettings" : "顧客デバッグ設定",
		"apm.common.label.dashboard" : "ダッシュボード",
		"apm.common.label.daterange" : "日付範囲",
		"apm.common.label.datetime" : "日時",
		"apm.common.label.deploymentname" : "デプロイメント名",
		"apm.common.label.edit" : "編集",
		"apm.common.label.elevatedpriority" : "上位の優先度",
		"apm.common.label.email" : "電子メール",
		"apm.common.label.enddate" : "終了日",
		"apm.common.label.enddatetime" : "終了日時",
		"apm.common.label.endtimerequired" : "終了時刻は必須です",
		"apm.common.label.errorrate" : "エラー率",
		"apm.common.label.exceededconcurrencycount" : "超過同時実行回数",
		"apm.common.label.executioncontext" : "実行コンテキスト",
		"apm.common.label.executiontime" : "実行時刻",
		"apm.common.label.exportcsv" : "エクスポート - CSV",
		"apm.common.label.failed" : "失敗",
		"apm.common.label.failedrequests" : "失敗したリクエスト",
		"apm.common.label.filters" : "フィルタ",
		"apm.common.label.from" : "開始日",
		"apm.common.label.histogram" : "ヒストグラム",
		"apm.common.label.hr" : "時間",
		"apm.common.label.hrs" : "時間",
		"apm.common.label.instancecount" : "インスタンス数",
		"apm.common.label.integration" : "統合",
		"apm.common.label.last12hours" : "過去12時間",
		"apm.common.label.last14days" : "過去14日間",
		"apm.common.label.last1hour" : "過去1時間",
		"apm.common.label.last24hours" : "過去24時間",
		"apm.common.label.last30days" : "過去30日間",
		"apm.common.label.last3days" : "過去3日間",
		"apm.common.label.last3hours" : "過去3時間",
		"apm.common.label.last6hours" : "過去6時間",
		"apm.common.label.last7days" : "過去7日間",
		"apm.common.label.loading" : "読み込み中",
		"apm.common.label.mapreduce" : "マップ／レデュース",
		"apm.common.label.median" : "中央値",
		"apm.common.label.min" : "分",
		"apm.common.label.mins" : "分",
		"apm.common.label.mostusers" : "最大ユーザ数",
		"apm.common.label.name" : "名前",
		"apm.common.label.network" : "ネットワーク",
		"apm.common.label.new" : "新規",
		"apm.common.label.nodataavailable" : "利用可能なデータはありません",
		"apm.common.label.nodrilldowndata" : "返されたドリルダウンデータはありません",
		"apm.common.label.none" : "なし",
		"apm.common.label.norecordstoshow" : "表示するレコードはありません",
		"apm.common.label.notiledatavailable" : "このタイルには利用可能なデータがありません",
		"apm.common.label.numberoflogs" : "ログ数",
		"apm.common.label.numberofusers" : "ユーザ数",
		"apm.common.label.operation" : "オペレーション",
		"apm.common.label.overview" : "概要",
		"apm.common.label.pageinit" : "ページ初期化",
		"apm.common.label.percentage" : "割合",
		"apm.common.label.queue" : "キュー",
		"apm.common.label.recordoperations" : "レコードオペレーション",
		"apm.common.label.records" : "レコード",
		"apm.common.label.recordsperminute" : "1分あたりのレコード数",
		"apm.common.label.recordtype" : "レコードの種類",
		"apm.common.label.rejectedaccountconcurrency" : "却下されたアカウント同時実行",
		"apm.common.label.rejecteduserconcurrency" : "却下されたユーザ同時実行",
		"apm.common.label.requests" : "リクエスト",
		"apm.common.label.responsetime" : "応答時間",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "ロール",
		"apm.common.label.roles" : "ロール",
		"apm.common.label.save" : "保存",
		"apm.common.label.scheduled" : "定期",
		"apm.common.label.scriptname" : "スクリプト名",
		"apm.common.label.selectionaffectallportlets" : "全ポートレットに影響する選択項目",
		"apm.common.label.server" : "サーバ",
		"apm.common.label.setup" : "設定",
		"apm.common.label.sorting" : "ソート順",
		"apm.common.label.startdate" : "開始日",
		"apm.common.label.startdatetime" : "開始日時",
		"apm.common.label.status" : "ステータス",
		"apm.common.label.timeline" : "タイムライン",
		"apm.common.label.timeout" : "タイムアウトになりました",
		"apm.common.label.timeoutrate" : "タイムアウト率",
		"apm.common.label.to" : "まで",
		"apm.common.label.total" : "合計",
		"apm.common.label.totalrecords" : "合計レコード数",
		"apm.common.label.totalrequests" : "合計リクエスト数",
		"apm.common.label.totaltime" : "合計時間",
		"apm.common.label.type" : "種類",
		"apm.common.label.urlrequests" : "URLリクエスト",
		"apm.common.label.user" : "ユーザ",
		"apm.common.label.userevent" : "ユーザイベント",
		"apm.common.label.users" : "ユーザ",
		"apm.common.label.view" : "表示",
		"apm.common.label.viewdetails" : "詳細を表示",
		"apm.common.label.viewfrhtdetails" : "FRHT詳細を表示",
		"apm.common.label.viewing" : "表示中",
		"apm.common.label.waittime" : "待ち時間",
		"apm.common.label.webservice" : "Webサービス",
		"apm.common.month.april" : "4月",
		"apm.common.month.august" : "8月",
		"apm.common.month.december" : "12月",
		"apm.common.month.february" : "2月",
		"apm.common.month.january" : "1月",
		"apm.common.month.july" : "7月",
		"apm.common.month.june" : "6月",
		"apm.common.month.march" : "3月",
		"apm.common.month.may" : "5月",
		"apm.common.month.november" : "11月",
		"apm.common.month.october" : "10月",
		"apm.common.month.september" : "9月",
		"apm.common.priority.high" : "高",
		"apm.common.priority.low" : "低",
		"apm.common.priority.standard" : "標準",
		"apm.common.shortmonth.april" : "4月",
		"apm.common.shortmonth.august" : "8月",
		"apm.common.shortmonth.december" : "12月",
		"apm.common.shortmonth.february" : "2月",
		"apm.common.shortmonth.january" : "1月",
		"apm.common.shortmonth.july" : "7月",
		"apm.common.shortmonth.june" : "6月",
		"apm.common.shortmonth.march" : "3月",
		"apm.common.shortmonth.may" : "5月",
		"apm.common.shortmonth.november" : "11月",
		"apm.common.shortmonth.october" : "10月",
		"apm.common.shortmonth.september" : "9月",
		"apm.common.shortweekday.friday" : "F",
		"apm.common.shortweekday.monday" : "M",
		"apm.common.shortweekday.saturday" : "S",
		"apm.common.shortweekday.sunday" : "S",
		"apm.common.shortweekday.thursday" : "T",
		"apm.common.shortweekday.tuesday" : "T",
		"apm.common.shortweekday.wednesday" : "W",
		"apm.common.time.am" : "AM",
		"apm.common.time.pm" : "PM",
		"apm.common.tooltip.percentfromtotal" : "合計からの割合（%）",
		"apm.common.weekday.friday" : "金曜日",
		"apm.common.weekday.monday" : "月曜日",
		"apm.common.weekday.saturday" : "土曜日",
		"apm.common.weekday.sunday" : "日曜日",
		"apm.common.weekday.thursday" : "木曜日",
		"apm.common.weekday.tuesday" : "火曜日",
		"apm.common.weekday.wednesday" : "水曜日",
		"apm.db.alert.entervalidhistograminterval" : "有効なヒストグラム間隔を入力してください",
		"apm.db.alert.entervalidresponsetime" : "有効な応答時間を入力してください",
		"apm.db.alert.operationrequired" : "オペレーションは必須です",
		"apm.db.alert.recordtyperequired" : "レコードの種類は必須です",
		"apm.db.alert.starttimerequired" : "開始時刻は必須です",
		"apm.db.alert.watchlist10items" : "監視リストには最大10アイテムのみ設定できます。",
		"apm.db.label.adddatetime" : "日時を追加",
		"apm.db.label.addwatchlist" : "監視リストを追加",
		"apm.db.label.chartpreferences" : "チャート設定",
		"apm.db.label.customdatetime" : "カスタム日時",
		"apm.db.label.duplicaterecordtypeoperation" : "レコードの種類とオペレーションを複製する",
		"apm.db.label.endtime" : "終了時刻",
		"apm.db.label.export" : "エクスポート",
		"apm.db.label.general" : "一般",
		"apm.db.label.highestresponsetime" : "最長応答時間",
		"apm.db.label.mostutilized" : "最大利用数",
		"apm.db.label.outof" : "{0}/{1}",
		"apm.db.label.recordinstance" : "レコードインスタンス",
		"apm.db.label.recordinstances" : "レコードインスタンス",
		"apm.db.label.recordpages" : "レコードページ",
		"apm.db.label.recordtiles" : "レコードタイル",
		"apm.db.label.removeall" : "すべて削除",
		"apm.db.label.setuprecordpages" : "レコードページを設定",
		"apm.db.label.showallrecordtiles" : "すべてのレコードタイルを表示",
		"apm.db.label.showwatchlistonly" : "監視リストのみ表示",
		"apm.db.label.starttime" : "開始時刻",
		"apm.db.label.throughput" : "スループット",
		"apm.db.label.unknown" : "不明",
		"apm.db.label.usereventworkflow" : "ユーザイベントとワークフロー",
		"apm.db.label.watchlist" : "監視リスト",
		"apm.db.responsetimechart.clientnetworkserver" : "クライアント、ネットワーク、サーバ",
		"apm.db.setup.interval" : "間隔",
		"apm.ns.client.fieldchanged" : "fieldChanged",
		"apm.ns.client.lineinit" : "lineInit",
		"apm.ns.client.postsourcing" : "postSourcing",
		"apm.ns.client.recalc" : "再計算（Recalc）",
		"apm.ns.client.saverecord" : "saveRecord",
		"apm.ns.client.validatedelete" : "validateDelete",
		"apm.ns.client.validatefield" : "validateField",
		"apm.ns.client.validateinsert" : "validateInsert",
		"apm.ns.client.validateline" : "validateLine",
		"apm.ns.common.add" : "追加",
		"apm.ns.context.backend" : "バックエンド",
		"apm.ns.context.customfielddefault" : "カスタムフィールドのデフォルト",
		"apm.ns.context.emailalert" : "電子メールのアラート",
		"apm.ns.context.emailscheduled" : "予約済電子メール",
		"apm.ns.context.machine" : "装置",
		"apm.ns.context.other" : "その他",
		"apm.ns.context.reminder" : "リマインダ",
		"apm.ns.context.snapshot" : "スナップショット",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "WEBサイト",
		"apm.ns.context.workflow" : "ワークフロー",
		"apm.ns.status.finished" : "終了",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "削除",
		"apm.ns.wsa.update" : "更新",
		"apm.ptd.label.clientheader" : "クライアント：ヘッダ",
		"apm.ptd.label.clientinit" : "クライアント：初期",
		"apm.ptd.label.clientrender" : "クライアント：描画",
		"apm.ptd.label.deploymentid" : "デプロイメントID",
		"apm.ptd.label.page" : "ページ",
		"apm.ptd.label.pagetimedetails" : "ページ時間詳細",
		"apm.ptd.label.script" : "スクリプト",
		"apm.ptd.label.scriptaftersubmit" : "スクリプト：aftersubmit：{0}",
		"apm.ptd.label.scriptbeforeload" : "スクリプト：beforeload：{0}",
		"apm.ptd.label.scriptbeforesubmit" : "スクリプト：beforesubmit：{0}",
		"apm.ptd.label.scriptpageinit" : "スクリプト：pageinit：{0}",
		"apm.ptd.label.scripttypeworkflow" : "スクリプトの種類／ワークフロー",
		"apm.ptd.label.searches" : "検索",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScriptとワークフローの詳細",
		"apm.ptd.label.time" : "時間",
		"apm.ptd.label.usage" : "使用状況",
		"apm.ptd.label.userevent" : "ユーザイベント",
		"apm.pts.description._95thpercentile" : "観察の95パーセントを下回る値（またはスコア）が見つかる可能性があります",
		"apm.pts.description.average" : "平均数",
		"apm.pts.description.median" : "（ソートされた数値リストでの）中央値",
		"apm.pts.description.standarddeviation" : "数値のばらつきを測定",
		"apm.pts.label.aggregation" : "集計",
		"apm.pts.label.and" : "および",
		"apm.pts.label.between" : "間",
		"apm.pts.label.bundle" : "バンドル",
		"apm.pts.label.columnname" : "列名",
		"apm.pts.label.description" : "説明",
		"apm.pts.label.details" : "詳細",
		"apm.pts.label.greaterthan" : "次より大きい",
		"apm.pts.label.lessthan" : "次の値未満",
		"apm.pts.label.meanaverage" : "平均",
		"apm.pts.label.netsuitesystem" : "NetSuiteシステム",
		"apm.pts.label.pagetimesummary" : "ページ時間概要",
		"apm.pts.label.performancelogs" : "パフォーマンスログ",
		"apm.pts.label.responsetimeinseconds" : "応答時間（秒）",
		"apm.pts.label.scriptworkflowtimebreakdown" : "スクリプト／ワークフロー時間内訳",
		"apm.pts.label.setupsummary" : "設定概要",
		"apm.pts.label.show" : "表示",
		"apm.pts.label.standarddeviation" : "標準偏差",
		"apm.pts.label.summary" : "概要",
		"apm.scpm.alert.startdate30dayscurrentdate" : "開始日は現在の日付から30日以内にしてください。",
		"apm.scpm.label.available" : "利用可能",
		"apm.scpm.label.availabletime" : "利用可能時間",
		"apm.scpm.label.aveexecutiontime" : "平均実行時刻",
		"apm.scpm.label.averagewaittime" : "平均待ち時間",
		"apm.scpm.label.avewaittime" : "平均待ち時間",
		"apm.scpm.label.cancelled" : "キャンセル済み",
		"apm.scpm.label.complete" : "完了",
		"apm.scpm.label.deferred" : "遅延",
		"apm.scpm.label.elevated" : "引き上げ済み",
		"apm.scpm.label.elevationinterval" : "引き上げ間隔",
		"apm.scpm.label.jobs" : "ジョブ",
		"apm.scpm.label.jobscompleted" : "ジョブ完了",
		"apm.scpm.label.jobsfailed" : "ジョブ失敗",
		"apm.scpm.label.jobstatus" : "ジョブステータス",
		"apm.scpm.label.noofreservedprocessors" : "予約済み決済ベンダー数。",
		"apm.scpm.label.original" : "元",
		"apm.scpm.label.pending" : "保留中",
		"apm.scpm.label.priority" : "優先度",
		"apm.scpm.label.priorityelevation" : "優先度の引き上げ",
		"apm.scpm.label.processing" : "処理中",
		"apm.scpm.label.processorconcurrency" : "決済ベンダーの同時実行",
		"apm.scpm.label.processorreservation" : "決済ベンダーの予約",
		"apm.scpm.label.processors" : "決済ベンダー",
		"apm.scpm.label.processorsettings" : "決済ベンダーの設定",
		"apm.scpm.label.processorutilization" : "決済ベンダーの稼働率",
		"apm.scpm.label.queueprocessordetails" : "キュー／決済ベンダーの詳細",
		"apm.scpm.label.queues" : "キュー",
		"apm.scpm.label.reservedprocessorsinuse" : "使用中の予約済み決済ベンダー数",
		"apm.scpm.label.retry" : "再試行",
		"apm.scpm.label.reuseidleprocessors" : "遊休決済ベンダーを再利用",
		"apm.scpm.label.totalnoofprocessors" : "決済ベンダーの合計数",
		"apm.scpm.label.totalwaittime" : "合計待ち時間",
		"apm.scpm.label.utilization" : "稼働率",
		"apm.scpm.label.utilized" : "利用済",
		"apm.scpm.label.utilizedtime" : "利用済時間",
		"apm.scpm.label.waittimebypriority" : "優先度別の待ち時間",
		"apm.setup.label.apmsetup" : "APMの設定",
		"apm.setup.label.employee" : "従業員",
		"apm.setup.label.employees" : "従業員",
		"apm.setup.label.setuppermissionlabel" : "アプリケーションパフォーマンス管理SuiteAppの権限を設定",
		"apm.setup.top10mostutilized" : "利用回数トップ10",
		"apm.spa.label.highestexecutiontime" : "最高実行時刻",
		"apm.spa.label.mostrequested" : "最大リクエスト数",
		"apm.spa.label.mosttimeouts" : "最大タイムアウト数",
		"apm.spa.label.savedsearches" : "保存検索結果",
		"apm.spa.label.searchperformanceanalysis" : "検索パフォーマンスの分析",
		"apm.spd.alert.searchloadingwait" : "検索を読み込み中です。しばらくお待ちください。",
		"apm.spd.label.date" : "日付",
		"apm.spd.label.isfalse" : "偽",
		"apm.spd.label.istrue" : "真",
		"apm.spd.label.savedsearch" : "保存検索結果",
		"apm.spd.label.savedsearchbycontext" : "コンテキスト別の保存検索結果",
		"apm.spd.label.savedsearchdetails" : "保存検索結果の詳細",
		"apm.spd.label.savedsearchlogs" : "保存検索結果ログ",
		"apm.spd.label.searchperformancedetails" : "検索パフォーマンス詳細",
		"apm.spjd.label.alldeployments" : "すべてのデプロイメント",
		"apm.spjd.label.alltasktypes" : "すべてのタスク種類",
		"apm.spjd.label.datecreated" : "作成日",
		"apm.spjd.label.deployment" : "デプロイメント",
		"apm.spjd.label.jobdetails" : "ジョブ詳細",
		"apm.spjd.label.jobdetailstimeline" : "ジョブ詳細タイムライン",
		"apm.spjd.label.mapreduceexecutiontime" : "マップ／レデュース実行時刻",
		"apm.spjd.label.mapreducestage" : "マップ／レデュースステージ",
		"apm.spjd.label.mapreducewaittime" : "マップ／レデュース待ち時間",
		"apm.spjd.label.originalpriority" : "元の優先度",
		"apm.spjd.label.scheduledexecutiontime" : "予約実行時刻",
		"apm.spjd.label.scheduledwaittime" : "予約待ち時間",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "SuiteCloudプロセッサのジョブ詳細",
		"apm.spjd.label.taskid" : "タスクID",
		"apm.spjd.label.tasktype" : "タスクの種類",
		"apm.spm.label.suitecloudprocessormonitor" : "SuiteCloudプロセッサモニター",
		"apm.ssa.alert.enterclienteventtype" : "クライアントイベントの種類を選択してください。",
		"apm.ssa.alert.enterscriptid" : "スクリプトIDを入力してください。",
		"apm.ssa.alert.enterscripttype" : "スクリプトの種類を選択してください。",
		"apm.ssa.alert.selectscriptname" : "スクリプト名を選択してください。",
		"apm.ssa.label.clienteventtype" : "クライアントイベントの種類",
		"apm.ssa.label.errorcount" : "エラー回数",
		"apm.ssa.label.performancechart" : "パフォーマンスチャート",
		"apm.ssa.label.recordid" : "レコードID",
		"apm.ssa.label.scriptid" : "スクリプトID",
		"apm.ssa.label.scripttype" : "スクリプトの種類",
		"apm.ssa.label.search" : "検索",
		"apm.ssa.label.searchcalls" : "通話を検索",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "SuiteScript分析",
		"apm.ssa.label.suitescriptdetails" : "SuiteScriptの詳細",
		"apm.ssa.label.suitescriptexecutionovertime" : "時間超過したSuiteScriptの実行",
		"apm.ssa.label.usagecount" : "使用回数",
		"apm.ssa.label.usereventaftersubmit" : "ユーザイベント（送信後）",
		"apm.ssa.label.usereventbeforeload" : "ユーザイベント（ロード前）",
		"apm.ssa.label.usereventbeforesubmit" : "ユーザイベント（送信前）",
		"apm.ssa.label.userinterface" : "ユーザインターフェイス",
		"apm.ssa.label.value" : "値",
		"apm.ssa.label.viewlogs" : "ログを表示する",
		"apm.ssa.label.webstore" : "Webストア",
		"apm.wsa.apiversion.notreleased" : "リリースなし",
		"apm.wsa.apiversion.notsupported" : "サポートなし",
		"apm.wsa.apiversion.supported" : "サポートあり",
		"apm.wsa.apiversionusage.retired" : "廃止",
		"apm.wsa.label.apiversionusage" : "APIバージョン使用状況",
		"apm.wsa.label.executiontimeperrecordtype" : "レコードの種類ごとの実行時刻",
		"apm.wsa.label.instancecountperrecordtype" : "レコードの種類ごとのインスタンス数",
		"apm.wsa.label.requestcount" : "リクエスト数",
		"apm.wsa.label.statusbreakdown" : "ステータス内訳",
		"apm.wsa.label.topwebservicesoperations" : "上位Webサービスオペレーション",
		"apm.wsa.label.topwebservicesrecordprocessing" : "上位Webサービスレコード処理中",
		"apm.wsa.label.webservicesanalysis" : "Webサービス分析",
		"apm.wsa.label.webservicesoperationstatus" : "Webサービスオペレーションステータス",
		"apm.wsa.label.webservicesrecordprocessing" : "Webサービスレコード処理中",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "Webサービスレコード処理中ステータス",
		"apm.wsod.label.performancedetails" : "パフォーマンスの詳細",
		"apm.wsod.label.timerange" : "時間範囲",
		"apm.wsod.label.toprecordsperformance" : "上位レコードのパフォーマンス",
		"apm.wsod.label.webservicesoperationdetails" : "Webサービスオペレーションの詳細",
		"apm.wsod.label.webservicesoperationlogs" : "Webサービスオペレーションのログ",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "Webサービスレコード処理中のログ",
		"apm.common.label.performance" : "パフォーマンス",

    	//NEW
        "apm.r2019a.profilerdetails": "プロファイラ詳細",
        "apm.r2019a.viewprofilerdetails": "プロファイラ詳細を表示",
        "apm.r2019a.averageexecutiontime": "平均実行時間",
        "apm.r2019a.medianexecutiontime": "実行時間の中央値",
        "apm.r2019a.average": "平均",
        "apm.r2019a.important": "重要",
        "apm.r2019a.concurrencynote1": "「一般同時実行」ポートレットがその値を計算するには、同時実行制限が必要です。",
        "apm.r2019a.concurrencynote2": "同時実行制限の値を利用できない場合（-）、「一般同時実行」ポートレットは一般的な実行制限を仮定します。このため、信頼できない値が表示される場合があります。",
        "apm.r2019a.profiler": "プロファイラ",
        "apm.r2019a.timingdetails": "タイミングの詳細",
        "apm.r2019a.datetime": "日付と時刻",
        "apm.r2019a.workflows": "ワークフロー",
        "apm.r2019a.recordsfromscriptsworkflows": "スクリプト/ワークフローのレコード",
        "apm.r2019a.requesturls": "URLをリクエスト",
        "apm.r2019a.entrypoint": "エントリーポイント",
        "apm.r2019a.triggertype": "トリガータイプ",
        "apm.r2019a.method": "方法",
        "apm.r2019a.webserviceoperation": "Webサービスオペレーション",
        "apm.r2019a.apiversion": "APIバージョン",
        "apm.r2019a.profileroperationid": "プロファイラオペレーションID",
        "apm.r2019a.starttimeanddate": "開始時刻と日付",
        "apm.r2019a.scripts": "スクリプト",
        "apm.r2019a.profilertype": "プロファイラタイプ",
        "apm.r2019a.record": "レコード",
        "apm.r2019a.requesturl": "URLをリクエスト",
        "apm.r2019a.unclassified": "未分類",
        "apm.r2019a.url": "URL",
        "apm.r2019a.apicalls": "API呼び出し",
        "apm.r2019a.profilerdetailsalert": "現時点では、APMの「プロファイラ詳細」はクライアントスクリプトの情報を表示できません。「プロファイラ詳細」を開くには、戻って別のスクリプトを選択してください。",
        "apm.r2019a.top": "トップ",
        "apm.r2019a.actionhistoryon": "{0}{1}の{2}からのアクション履歴",
        "apm.r2019a.fromtopacifictime": "{0}{1}から{2}（太平洋標準時間）",
        "apm.r2019a.onpacifictime": "{0}{1}の{2}（太平洋標準時間）",
        "apm.r2019a.actions": "アクション",
        "apm.r2019a.alldevices": "すべてのデバイス",
        "apm.r2019a.alllocations": "すべての所在地",
        "apm.r2019a.allsubsidiaries": "すべての連結子会社",
        "apm.r2019a.allusers": "すべてのユーザー",
        "apm.r2019a.asofat": "{0}{1}現在",
        "apm.r2019a.averageduration": "平均期間",
        "apm.r2019a.clickanddragtozoom": "クリックアンドドラッグで拡大する",
        "apm.r2019a.moreinformation": "詳細については、こちらをクリック",
        "apm.r2019a.clientscripturl": "クライアントスクリプトURL",
        "apm.r2019a.customcsurlrequests": "カスタムクライアントスクリプトURLのリクエスト",
        "apm.r2019a.customizationaverage": "カスタマイゼーション平均",
        "apm.r2019a.lastupdatedon": "カスタマイゼーションデータ（最終更新：{0}{1}）",
        "apm.r2019a.notavailable": "カスタマイゼーションデータを入手できません",
        "apm.r2019a.customizationperformance": "カスタマイゼーションパフォーマンス",
        "apm.r2019a.customizationtime": "カスタマイゼーション時間",
        "apm.r2019a.device": "デバイス",
        "apm.r2019a.devicelistisloading": "デバイスリストを読み込んでいます。しばらくお待ちください。",
        "apm.r2019a.devicename": "デバイス名",
        "apm.r2019a.devices": "デバイス",
        "apm.r2019a.enddatetime": "終了時刻と日付",
        "apm.r2019a.event": "イベント",
        "apm.r2019a.executioncount": "実行数のカウント",
        "apm.r2019a.filter": "フィルター",
        "apm.r2019a.instances": "インスタンス",
        "apm.r2019a.location": "所在地",
        "apm.r2019a.locationid": "所在地ID",
        "apm.r2019a.locationlistisloading": "所在地リストを読み込んでいます。しばらくお待ちください。",
        "apm.r2019a.locations": "所在地",
        "apm.r2019a.logid": "ログID",
        "apm.r2019a.mostfrequent": "最多",
        "apm.r2019a.nonbundle": "非バンドル",
        "apm.r2019a.nonbundledcomponents": "非バンドルのコンポーネント",
        "apm.r2019a.operations": "オペレーション",
        "apm.r2019a.overheadtime": "オーバーヘッド時間",
        "apm.r2019a.pacifictime": "太平洋標準時間",
        "apm.r2019a.performancedataprocessing": "パフォーマンスデータは現在も処理中です。完全なデータを表示するには、「ユーザーイベントスクリプト」列と「ワークフロー」列が表示されてから、このアイコンをクリックします。",
        "apm.r2019a.enteravalidtotalduration": "有効な合計期間を入力してください",
        "apm.r2019a.enteravalidusereventtime": "有効なユーザーイベント時間を入力してください",
        "apm.r2019a.enteravalidworkflowtime": "有効なワークフロー時間を入力してください",
        "apm.r2019a.scisappothers": "SCISアプリ+その他",
        "apm.r2019a.scisbundle": "SCISバンドル",
        "apm.r2019a.servertime": "サーバー時間",
        "apm.r2019a.scispermissions": "SuiteCommerce InStore APM SuiteAppのロール権限を設定します。",
        "apm.r2019a.startdatetime": "開始時刻と日付",
        "apm.r2019a.subsidiary": "連結子会社",
        "apm.r2019a.subsidiaryid": "連結子会社ID",
        "apm.r2019a.subsidiarylistisloading": "連結子会社リストを読み込んでいます。しばらくお待ちください。",
        "apm.r2019a.scisactionhistorydetail": "SuiteCommerce InStoreアクション履歴の詳細",
        "apm.r2019a.scisperformancediagnostics": "SuiteCommerce InStoreパフォーマンス診断",
        "apm.r2019a.scisperformancesetup": "SuiteCommerce InStoreパフォーマンス設定",
        "apm.r2019a.timebybundle": "バンドルごとの時間",
        "apm.r2019a.timesources": "時間ソース",
        "apm.r2019a.total95th": "合計の95パーセンタイル",
        "apm.r2019a.totalaverage": "合計平均",
        "apm.r2019a.totalduration": "合計期間",
        "apm.r2019a.totaldurationandcustomizationperformance": "「合計期間」と「長期のカスタマイゼーションパフォーマンス」（太平洋標準時間）",
        "apm.r2019a.totalmedian": "合計中央値",
        "apm.r2019a.uninstalledbundle": "アンインストールされたバンドル",
        "apm.r2019a.usereventscripts": "ユーザーイベントスクリプト",
        "apm.r2019a.usereventtime": "ユーザーイベント時間",
        "apm.r2019a.userlistisloading": "ユーザーリストを読み込んでいます。しばらくお待ちください。",
        "apm.r2019a.valuesarestillprocessing": "ダッシュ（-）付きの値は現在も処理中です。値が表示されてから、詳細を確認します。",
        "apm.r2019a.viewchart": "チャートを表示",
        "apm.r2019a.workflowname": "ワークフロー名",
        "apm.r2019a.workflowtime": "ワークフロー時間",
        "apm.r2019a.youcannotopenthispage": "Application Performance（APM）SuiteAppがインストールされていないため、ページを開けません。APM SuiteAppをインストールしてから、もう一度お試しください。",
        "apm.r2019a.fieldhelp": "フィールドヘルプ",
        "apm.r2019a.whatsthis": "ヘルプ",
        "apm.r2019a.daterangefieldhelp": "SCISパフォーマンスデータを表示するには、期間を選択します。日付範囲は30日間を超えることはできません。",
        "apm.r2019a.locationfieldhelp": "特定の小売店で記録されたパフォーマンスデータを注視するには、所在地を選択します。",
        "apm.r2019a.subsidiaryfieldhelp": "特定の連結子会社でのアクションに基づくパフォーマンスデータを表示するには、連結子会社を選択します。それ以外の場合は、すべての連結子会社を選択します。",
        "apm.r2019a.devicefieldhelp": "SCISを実行している特定のデバイスまたはすべてのデバイスでキャプチャされたパフォーマンスデータを表示します。",
        "apm.r2019a.employeefieldhelp": "特定の店員が提出したトランザクションに関連するパフォーマンスデータを表示するには、従業員名を選択してください。",
        "apm.r2019a.sortfieldhelp": "「アクション」タイルは、「最多」と「最長実行時間」でソートできます。「最多」は、最も頻繁に起きるアクションを表示します。実行時間が最も長い「アクション」は、合計期間が最も長くなります。"
    };

    return translation;
});