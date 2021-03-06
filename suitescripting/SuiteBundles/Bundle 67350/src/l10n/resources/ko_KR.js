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
		"apm.cd.button.back" : "뒤로",
		"apm.cd.label.concurrencydetails" : "동시 실행 상세정보",
		"apm.cd.label.detailedconcurrency" : "상세 동시 실행",
		"apm.cd.label.exceededconcurrency" : "초과 동시 실행",
		"apm.cd.label.instancedetails" : "인스턴스 상세정보",
		"apm.cd.label.max" : "최대값 - {0}",
		"apm.cd.label.sec" : "초",
		"apm.cd.label.secs" : "초",
		"apm.cd.label.viewrequests" : "요청 보기",
		"apm.cd.label.webservices" : "웹 서비스",
		"apm.cm.label._101andabove" : "101% 이상",
		"apm.cm.label.concurrencylimit" : "동시 실행 제한",
		"apm.cm.label.concurrencymonitor" : "동시 실행 모니터링",
		"apm.cm.label.concurrencyusage" : "동시 실행 사용량",
		"apm.cm.label.generalconcurrency" : "일반 동시 실행",
		"apm.cm.label.highestexceededconcurrency" : "최대 초과 동시 실행",
		"apm.cm.label.note" : "참고",
		"apm.cm.label.peakconcurrency" : "피크 동시 실행",
		"apm.cm.label.percentvaluesareapproximate" : "백분율 값은 근사치입니다.",
		"apm.cm.label.requestexceedinglimit" : "제한을 초과하는 요청",
		"apm.cm.label.requestswithinlimit" : "제한 범위(%) 내 요청",
		"apm.cm.label.totalexceededconcurrency" : "초과 동시 실행 합계",
		"apm.cm.label.valuesareexact" : "값이 정확합니다.",
		"apm.common.alert.daterange._30days" : "날짜 범위는 30일을 초과하지 않아야 합니다.",
		"apm.common.alert.daterange._3days" : "날짜 범위는 3일보다 작지 않아야 합니다.",
		"apm.common.alert.enablefeatures" : "[사용자 지정 레코드], [클라이언트 SuiteScript] 및 [서버 SuiteScript] 기능을 활성화해야 합니다. 이 기능을 활성화한 후 다시 시도하십시오.",
		"apm.common.alert.endaterequired" : "종료 날짜는 필수입니다.",
		"apm.common.alert.entervalidenddate" : "유효한 종료 날짜를 입력하십시오.",
		"apm.common.alert.entervalidstartdate" : "유효한 시작 날짜를 입력하십시오.",
		"apm.common.alert.errorinsearch" : "검색에서 오류가 발생했습니다.",
		"apm.common.alert.errorinsuitelet" : "Suitelet에서 오류가 발생했습니다.",
		"apm.common.alert.invalidenddate" : "잘못된 종료 날짜",
		"apm.common.alert.invalidstartdate" : "잘못된 시작 날짜",
		"apm.common.alert.nocontent" : "내용 없음",
		"apm.common.alert.startdateearlierthanenddate" : "시작 날짜는 종료 날짜 이전이어야 합니다.",
		"apm.common.alert.startdaterequired" : "시작 날짜는 필수입니다.",
		"apm.common.button.cancel" : "취소",
		"apm.common.button.done" : "완료",
		"apm.common.button.refresh" : "새로 고침",
		"apm.common.button.reset" : "재설정",
		"apm.common.button.set" : "설정",
		"apm.common.highcharts.drilluptext" : "다음으로 돌아가기",
		"apm.common.highcharts.nodata" : "표시할 데이터 없음",
		"apm.common.highcharts.resetzoom" : "확대/축소 재설정",
		"apm.common.highcharts.resetzoomtitle" : "확대/축소 수준 1:1로 재설정",
		"apm.common.label._95th" : "95번째",
		"apm.common.label._95thpercentile" : "95번째 백분위수",
		"apm.common.label.all" : "모두",
		"apm.common.label.asof" : "{0} 기준",
		"apm.common.label.client" : "고객",
		"apm.common.label.close" : "닫기",
		"apm.common.label.companyid" : "회사 ID",
		"apm.common.label.completed" : "완료됨",
		"apm.common.label.concurrency" : "동시 실행",
		"apm.common.label.concurrencycount" : "동시 실행 카운트",
		"apm.common.label.context" : "컨텍스트",
		"apm.common.label.csvimport" : "CSV 가져오기",
		"apm.common.label.custom" : "사용자 지정",
		"apm.common.label.customdaterange" : "사용자 지정 날짜 범위",
		"apm.common.label.customerdebugsettings" : "고객 디버그 설정",
		"apm.common.label.dashboard" : "대시보드",
		"apm.common.label.daterange" : "날짜 범위",
		"apm.common.label.datetime" : "날짜 및 시간",
		"apm.common.label.deploymentname" : "배치 이름",
		"apm.common.label.edit" : "편집",
		"apm.common.label.elevatedpriority" : "격상된 우선순위",
		"apm.common.label.email" : "이메일",
		"apm.common.label.enddate" : "종료 날짜",
		"apm.common.label.enddatetime" : "종료 날짜/시간",
		"apm.common.label.endtimerequired" : "종료 시간은 필수입니다.",
		"apm.common.label.errorrate" : "오류율",
		"apm.common.label.exceededconcurrencycount" : "초과 동시 실행 카운트",
		"apm.common.label.executioncontext" : "실행 컨텍스트",
		"apm.common.label.executiontime" : "실행 시간",
		"apm.common.label.exportcsv" : "내보내기 - CSV",
		"apm.common.label.failed" : "실패",
		"apm.common.label.failedrequests" : "실패한 요청",
		"apm.common.label.filters" : "필터",
		"apm.common.label.from" : "시작",
		"apm.common.label.histogram" : "히스토그램",
		"apm.common.label.hr" : "시",
		"apm.common.label.hrs" : "시",
		"apm.common.label.instancecount" : "인스턴스 카운트",
		"apm.common.label.integration" : "통합",
		"apm.common.label.last12hours" : "지난 12시간",
		"apm.common.label.last14days" : "지난 14일",
		"apm.common.label.last1hour" : "지난 1시간",
		"apm.common.label.last24hours" : "지난 24시간",
		"apm.common.label.last30days" : "지난 30일",
		"apm.common.label.last3days" : "지난 3일",
		"apm.common.label.last3hours" : "지난 3시간",
		"apm.common.label.last6hours" : "지난 6시간",
		"apm.common.label.last7days" : "지난 7일",
		"apm.common.label.loading" : "로드 중",
		"apm.common.label.mapreduce" : "맵/감소",
		"apm.common.label.median" : "중간값",
		"apm.common.label.min" : "분",
		"apm.common.label.mins" : "분",
		"apm.common.label.mostusers" : "대부분의 사용자",
		"apm.common.label.name" : "이름",
		"apm.common.label.network" : "네트워크",
		"apm.common.label.new" : "새로 만들기",
		"apm.common.label.nodataavailable" : "사용 가능 데이터 없음",
		"apm.common.label.nodrilldowndata" : "반환된 드릴다운 데이터 없음",
		"apm.common.label.none" : "없음",
		"apm.common.label.norecordstoshow" : "표시할 레코드 없음",
		"apm.common.label.notiledatavailable" : "이 타일에 사용할 수 있는 데이터 없음",
		"apm.common.label.numberoflogs" : "로그 수",
		"apm.common.label.numberofusers" : "사용자 수",
		"apm.common.label.operation" : "작업",
		"apm.common.label.overview" : "개요",
		"apm.common.label.pageinit" : "pageinit",
		"apm.common.label.percentage" : "백분율",
		"apm.common.label.queue" : "대기열",
		"apm.common.label.recordoperations" : "레코드 작업",
		"apm.common.label.records" : "레코드",
		"apm.common.label.recordsperminute" : "분당 레코드",
		"apm.common.label.recordtype" : "레코드 유형",
		"apm.common.label.rejectedaccountconcurrency" : "거부된 계정 동시 실행",
		"apm.common.label.rejecteduserconcurrency" : "거부된 사용자 동시 실행",
		"apm.common.label.requests" : "요청",
		"apm.common.label.responsetime" : "응답 시간",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "역할",
		"apm.common.label.roles" : "역할",
		"apm.common.label.save" : "저장",
		"apm.common.label.scheduled" : "예약됨",
		"apm.common.label.scriptname" : "스크립트 이름",
		"apm.common.label.selectionaffectallportlets" : "모든 포틀릿에 영향을 주는 선택 항목",
		"apm.common.label.server" : "서버",
		"apm.common.label.setup" : "설정",
		"apm.common.label.sorting" : "정렬",
		"apm.common.label.startdate" : "시작 날짜",
		"apm.common.label.startdatetime" : "시작 날짜/시간",
		"apm.common.label.status" : "상태",
		"apm.common.label.timeline" : "타임라인",
		"apm.common.label.timeout" : "시간 초과됨",
		"apm.common.label.timeoutrate" : "시간 초과 비율",
		"apm.common.label.to" : "종료",
		"apm.common.label.total" : "합계",
		"apm.common.label.totalrecords" : "전체 레코드 수",
		"apm.common.label.totalrequests" : "전체 요청 수",
		"apm.common.label.totaltime" : "전체 시간",
		"apm.common.label.type" : "유형",
		"apm.common.label.urlrequests" : "URL 요청",
		"apm.common.label.user" : "사용자",
		"apm.common.label.userevent" : "사용자 이벤트",
		"apm.common.label.users" : "사용자",
		"apm.common.label.view" : "보기",
		"apm.common.label.viewdetails" : "상세정보 보기",
		"apm.common.label.viewfrhtdetails" : "FRHT 상세정보 보기",
		"apm.common.label.viewing" : "보기",
		"apm.common.label.waittime" : "대기 시간",
		"apm.common.label.webservice" : "웹 서비스",
		"apm.common.month.april" : "4월",
		"apm.common.month.august" : "8월",
		"apm.common.month.december" : "12월",
		"apm.common.month.february" : "2월",
		"apm.common.month.january" : "1월",
		"apm.common.month.july" : "7월",
		"apm.common.month.june" : "6월",
		"apm.common.month.march" : "3월",
		"apm.common.month.may" : "5월",
		"apm.common.month.november" : "11월",
		"apm.common.month.october" : "10월",
		"apm.common.month.september" : "9월",
		"apm.common.priority.high" : "높음",
		"apm.common.priority.low" : "낮음",
		"apm.common.priority.standard" : "표준",
		"apm.common.shortmonth.april" : "4월",
		"apm.common.shortmonth.august" : "8월",
		"apm.common.shortmonth.december" : "12월",
		"apm.common.shortmonth.february" : "2월",
		"apm.common.shortmonth.january" : "1월",
		"apm.common.shortmonth.july" : "7월",
		"apm.common.shortmonth.june" : "6월",
		"apm.common.shortmonth.march" : "3월",
		"apm.common.shortmonth.may" : "5월",
		"apm.common.shortmonth.november" : "11월",
		"apm.common.shortmonth.october" : "10월",
		"apm.common.shortmonth.september" : "9월",
		"apm.common.shortweekday.friday" : "F",
		"apm.common.shortweekday.monday" : "M",
		"apm.common.shortweekday.saturday" : "S",
		"apm.common.shortweekday.sunday" : "S",
		"apm.common.shortweekday.thursday" : "T",
		"apm.common.shortweekday.tuesday" : "T",
		"apm.common.shortweekday.wednesday" : "W",
		"apm.common.time.am" : "오전",
		"apm.common.time.pm" : "오후",
		"apm.common.tooltip.percentfromtotal" : "총계의 %",
		"apm.common.weekday.friday" : "금요일",
		"apm.common.weekday.monday" : "월요일",
		"apm.common.weekday.saturday" : "토요일",
		"apm.common.weekday.sunday" : "일요일",
		"apm.common.weekday.thursday" : "목요일",
		"apm.common.weekday.tuesday" : "화요일",
		"apm.common.weekday.wednesday" : "수요일",
		"apm.db.alert.entervalidhistograminterval" : "유효한 히스토그램 간격을 입력하십시오.",
		"apm.db.alert.entervalidresponsetime" : "유효한 응답 시간을 입력하십시오.",
		"apm.db.alert.operationrequired" : "작업은 필수입니다.",
		"apm.db.alert.recordtyperequired" : "레코드 유형은 필수입니다.",
		"apm.db.alert.starttimerequired" : "시작 시간은 필수입니다.",
		"apm.db.alert.watchlist10items" : "감시 목록에는 품목을 최대 10개만 포함할 수 있습니다.",
		"apm.db.label.adddatetime" : "날짜 및 시간 추가",
		"apm.db.label.addwatchlist" : "감시 목록 추가",
		"apm.db.label.chartpreferences" : "차트 기본 설정",
		"apm.db.label.customdatetime" : "사용자 지정 날짜 및 시간",
		"apm.db.label.duplicaterecordtypeoperation" : "중복 레코드 유형 및 작업",
		"apm.db.label.endtime" : "종료 시간",
		"apm.db.label.export" : "내보내기",
		"apm.db.label.general" : "일반",
		"apm.db.label.highestresponsetime" : "최고 응답 시간",
		"apm.db.label.mostutilized" : "가장 많이 이용됨",
		"apm.db.label.outof" : "{1} 중 {0}",
		"apm.db.label.recordinstance" : "레코드 인스턴스",
		"apm.db.label.recordinstances" : "레코드 인스턴스",
		"apm.db.label.recordpages" : "레코드 페이지",
		"apm.db.label.recordtiles" : "레코드 타일",
		"apm.db.label.removeall" : "모두 제거",
		"apm.db.label.setuprecordpages" : "레코드 페이지 설정",
		"apm.db.label.showallrecordtiles" : "모든 레코드 타일 표시",
		"apm.db.label.showwatchlistonly" : "감시 목록만 표시",
		"apm.db.label.starttime" : "시작 시간",
		"apm.db.label.throughput" : "처리량",
		"apm.db.label.unknown" : "알 수 없음",
		"apm.db.label.usereventworkflow" : "사용자 이벤트 및 워크플로우",
		"apm.db.label.watchlist" : "감시 목록",
		"apm.db.responsetimechart.clientnetworkserver" : "클라이언트, 네트워크 및 서버",
		"apm.db.setup.interval" : "간격",
		"apm.ns.client.fieldchanged" : "필드 변경됨",
		"apm.ns.client.lineinit" : "라인 초기화",
		"apm.ns.client.postsourcing" : "소싱 게시",
		"apm.ns.client.recalc" : "재계산",
		"apm.ns.client.saverecord" : "레코드 저장",
		"apm.ns.client.validatedelete" : "삭제 검증",
		"apm.ns.client.validatefield" : "필드 검증",
		"apm.ns.client.validateinsert" : "삽입 검증",
		"apm.ns.client.validateline" : "라인 검증",
		"apm.ns.common.add" : "추가",
		"apm.ns.context.backend" : "백엔드",
		"apm.ns.context.customfielddefault" : "사용자 지정 필드 기본값",
		"apm.ns.context.emailalert" : "이메일 경고",
		"apm.ns.context.emailscheduled" : "이메일 예약됨",
		"apm.ns.context.machine" : "머신",
		"apm.ns.context.other" : "기타",
		"apm.ns.context.reminder" : "알림",
		"apm.ns.context.snapshot" : "스냅샷",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "웹 사이트",
		"apm.ns.context.workflow" : "워크플로우",
		"apm.ns.status.finished" : "마침",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "삭제",
		"apm.ns.wsa.update" : "업데이트",
		"apm.ptd.label.clientheader" : "클라이언트: 머리글",
		"apm.ptd.label.clientinit" : "클라이언트: 초기화",
		"apm.ptd.label.clientrender" : "클라이언트: 렌더링",
		"apm.ptd.label.deploymentid" : "배포 ID",
		"apm.ptd.label.page" : "페이지",
		"apm.ptd.label.pagetimedetails" : "페이지 시간 상세정보",
		"apm.ptd.label.script" : "스크립트",
		"apm.ptd.label.scriptaftersubmit" : "스크립트: aftersubmit: {0}",
		"apm.ptd.label.scriptbeforeload" : "스크립트: beforeload: {0}",
		"apm.ptd.label.scriptbeforesubmit" : "스크립트: beforesubmit: {0}",
		"apm.ptd.label.scriptpageinit" : "스크립트: pageinit: {0}",
		"apm.ptd.label.scripttypeworkflow" : "스크립트 유형/워크플로우",
		"apm.ptd.label.searches" : "검색",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScript 및 워크플로우 상세정보",
		"apm.ptd.label.time" : "시간",
		"apm.ptd.label.usage" : "사용량",
		"apm.ptd.label.userevent" : "사용자 이벤트",
		"apm.pts.description._95thpercentile" : "그 아래에서 관찰의 95%를 찾을 수 있는 값(또는 점수)",
		"apm.pts.description.average" : "수의 평균",
		"apm.pts.description.median" : "중간 수(수의 정렬된 목록에서)",
		"apm.pts.description.standarddeviation" : "수 분산 방식 측정",
		"apm.pts.label.aggregation" : "집계",
		"apm.pts.label.and" : "및",
		"apm.pts.label.between" : "사이",
		"apm.pts.label.bundle" : "번들",
		"apm.pts.label.columnname" : "열 이름",
		"apm.pts.label.description" : "설명",
		"apm.pts.label.details" : "상세정보",
		"apm.pts.label.greaterthan" : "다음보다 큼",
		"apm.pts.label.lessthan" : "다음보다 작음",
		"apm.pts.label.meanaverage" : "평균",
		"apm.pts.label.netsuitesystem" : "NetSuite 시스템",
		"apm.pts.label.pagetimesummary" : "페이지 시간 요약",
		"apm.pts.label.performancelogs" : "성과 로그",
		"apm.pts.label.responsetimeinseconds" : "응답 시간(초)",
		"apm.pts.label.scriptworkflowtimebreakdown" : "스크립트/워크플로우 시간 분석",
		"apm.pts.label.setupsummary" : "설정 요약",
		"apm.pts.label.show" : "표시",
		"apm.pts.label.standarddeviation" : "표준 편차",
		"apm.pts.label.summary" : "요약",
		"apm.scpm.alert.startdate30dayscurrentdate" : "시작 날짜는 현재 날짜로부터 30일을 초과하지 않아야 합니다.",
		"apm.scpm.label.available" : "사용 가능",
		"apm.scpm.label.availabletime" : "사용 가능한 시간",
		"apm.scpm.label.aveexecutiontime" : "평균 실행 시간",
		"apm.scpm.label.averagewaittime" : "평균 대기 시간",
		"apm.scpm.label.avewaittime" : "평균 대기 시간",
		"apm.scpm.label.cancelled" : "취소됨",
		"apm.scpm.label.complete" : "완료",
		"apm.scpm.label.deferred" : "이연됨",
		"apm.scpm.label.elevated" : "격상됨",
		"apm.scpm.label.elevationinterval" : "격상 간격",
		"apm.scpm.label.jobs" : "업무",
		"apm.scpm.label.jobscompleted" : "업무 완료",
		"apm.scpm.label.jobsfailed" : "업무 실패",
		"apm.scpm.label.jobstatus" : "업무 상태",
		"apm.scpm.label.noofreservedprocessors" : "예약된 프로세서 수입니다.",
		"apm.scpm.label.original" : "원본",
		"apm.scpm.label.pending" : "대기 중",
		"apm.scpm.label.priority" : "우선순위",
		"apm.scpm.label.priorityelevation" : "우선순위 격상",
		"apm.scpm.label.processing" : "처리 중",
		"apm.scpm.label.processorconcurrency" : "프로세서 동시 실행",
		"apm.scpm.label.processorreservation" : "프로세서 예약",
		"apm.scpm.label.processors" : "프로세서",
		"apm.scpm.label.processorsettings" : "프로세서 설정",
		"apm.scpm.label.processorutilization" : "프로세서 이용률",
		"apm.scpm.label.queueprocessordetails" : "대기열/프로세서 상세정보",
		"apm.scpm.label.queues" : "대기열",
		"apm.scpm.label.reservedprocessorsinuse" : "예약된 프로세서 사용 중",
		"apm.scpm.label.retry" : "다시 시도",
		"apm.scpm.label.reuseidleprocessors" : "유휴 프로세서 재사용",
		"apm.scpm.label.totalnoofprocessors" : "총 프로세서 수",
		"apm.scpm.label.totalwaittime" : "총 대기 시간",
		"apm.scpm.label.utilization" : "이용률",
		"apm.scpm.label.utilized" : "이용됨",
		"apm.scpm.label.utilizedtime" : "이용 시간",
		"apm.scpm.label.waittimebypriority" : "우선순위별 대기 시간",
		"apm.setup.label.apmsetup" : "APM 설정",
		"apm.setup.label.employee" : "직원",
		"apm.setup.label.employees" : "직원",
		"apm.setup.label.setuppermissionlabel" : "애플리케이션 성능 관리 SuiteApp에 대한 권한 설정",
		"apm.setup.top10mostutilized" : "가장 많이 이용된 10개",
		"apm.spa.label.highestexecutiontime" : "최고 실행 시간",
		"apm.spa.label.mostrequested" : "가장 많이 요청됨",
		"apm.spa.label.mosttimeouts" : "최대 시간 초과",
		"apm.spa.label.savedsearches" : "저장 검색",
		"apm.spa.label.searchperformanceanalysis" : "검색 성능 분석",
		"apm.spd.alert.searchloadingwait" : "검색을 로드하는 중입니다. 잠시 기다려 주십시오.",
		"apm.spd.label.date" : "날짜",
		"apm.spd.label.isfalse" : "false",
		"apm.spd.label.istrue" : "true",
		"apm.spd.label.savedsearch" : "저장 검색",
		"apm.spd.label.savedsearchbycontext" : "컨텍스트별 저장 검색",
		"apm.spd.label.savedsearchdetails" : "저장 검색 상세정보",
		"apm.spd.label.savedsearchlogs" : "저장 검색 로그",
		"apm.spd.label.searchperformancedetails" : "검색 성능 상세정보",
		"apm.spjd.label.alldeployments" : "모든 배치",
		"apm.spjd.label.alltasktypes" : "모든 작업 유형",
		"apm.spjd.label.datecreated" : "생성 날짜",
		"apm.spjd.label.deployment" : "배치",
		"apm.spjd.label.jobdetails" : "업무 상세정보",
		"apm.spjd.label.jobdetailstimeline" : "업무 상세정보 타임라인",
		"apm.spjd.label.mapreduceexecutiontime" : "매핑/감소 실행 시간",
		"apm.spjd.label.mapreducestage" : "매핑/감소 단계",
		"apm.spjd.label.mapreducewaittime" : "매핑/감소 대기 시간",
		"apm.spjd.label.originalpriority" : "원래 우선순위",
		"apm.spjd.label.scheduledexecutiontime" : "예약된 실행 시간",
		"apm.spjd.label.scheduledwaittime" : "예약된 대기 시간",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "SuiteCloud 프로세서 업무 상세정보",
		"apm.spjd.label.taskid" : "작업 ID",
		"apm.spjd.label.tasktype" : "작업 유형",
		"apm.spm.label.suitecloudprocessormonitor" : "SuiteCloud 프로세서 모니터",
		"apm.ssa.alert.enterclienteventtype" : "클라이언트 이벤트 유형을 선택하십시오.",
		"apm.ssa.alert.enterscriptid" : "스크립트 ID를 입력하십시오.",
		"apm.ssa.alert.enterscripttype" : "스크립트 유형을 선택하십시오.",
		"apm.ssa.alert.selectscriptname" : "스크립트 이름을 선택하십시오.",
		"apm.ssa.label.clienteventtype" : "클라이언트 이벤트 유형",
		"apm.ssa.label.errorcount" : "오류 카운트",
		"apm.ssa.label.performancechart" : "성과 차트",
		"apm.ssa.label.recordid" : "레코드 ID",
		"apm.ssa.label.scriptid" : "스크립트 ID",
		"apm.ssa.label.scripttype" : "스크립트 유형",
		"apm.ssa.label.search" : "검색",
		"apm.ssa.label.searchcalls" : "통화 검색",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "SuiteScript 분석",
		"apm.ssa.label.suitescriptdetails" : "SuiteScript 상세정보",
		"apm.ssa.label.suitescriptexecutionovertime" : "시간에 따른 SuiteScript 실행",
		"apm.ssa.label.usagecount" : "사용량 카운트",
		"apm.ssa.label.usereventaftersubmit" : "사용자 이벤트(제출 후)",
		"apm.ssa.label.usereventbeforeload" : "사용자 이벤트(로드 전)",
		"apm.ssa.label.usereventbeforesubmit" : "사용자 이벤트(제출 전)",
		"apm.ssa.label.userinterface" : "사용자 인터페이스",
		"apm.ssa.label.value" : "값",
		"apm.ssa.label.viewlogs" : "로그 보기",
		"apm.ssa.label.webstore" : "웹 스토어",
		"apm.wsa.apiversion.notreleased" : "릴리즈되지 않음",
		"apm.wsa.apiversion.notsupported" : "지원되지 않음",
		"apm.wsa.apiversion.supported" : "지원됨",
		"apm.wsa.apiversionusage.retired" : "사용 중단됨",
		"apm.wsa.label.apiversionusage" : "API 버전 사용량",
		"apm.wsa.label.executiontimeperrecordtype" : "레코드 유형당 실행 시간",
		"apm.wsa.label.instancecountperrecordtype" : "레코드 유형당 인스턴스 카운트",
		"apm.wsa.label.requestcount" : "요청 카운트",
		"apm.wsa.label.statusbreakdown" : "상태 분석",
		"apm.wsa.label.topwebservicesoperations" : "최상위 웹 서비스 작업",
		"apm.wsa.label.topwebservicesrecordprocessing" : "최상위 웹 서비스 레코드 처리 중",
		"apm.wsa.label.webservicesanalysis" : "웹 서비스 분석",
		"apm.wsa.label.webservicesoperationstatus" : "웹 서비스 작업 상태",
		"apm.wsa.label.webservicesrecordprocessing" : "웹 서비스 레코드 처리 중",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "웹 서비스 레코드 처리 상태",
		"apm.wsod.label.performancedetails" : "성과 상세정보",
		"apm.wsod.label.timerange" : "시간 범위",
		"apm.wsod.label.toprecordsperformance" : "최상위 레코드 성과",
		"apm.wsod.label.webservicesoperationdetails" : "웹 서비스 작업 상세정보",
		"apm.wsod.label.webservicesoperationlogs" : "웹 서비스 작업 로그",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "웹 서비스 레코드 처리 로그",
		"apm.common.label.performance" : "성과",

    	//NEW
        "apm.r2019a.profilerdetails": "프로파일러 상세정보",
        "apm.r2019a.viewprofilerdetails": "프로파일러 상세정보 보기",
        "apm.r2019a.averageexecutiontime": "평균 실행 시간",
        "apm.r2019a.medianexecutiontime": "중간 실행 시간",
        "apm.r2019a.average": "평균",
        "apm.r2019a.important": "중요",
        "apm.r2019a.concurrencynote1": "일반 동시성 포틀릿 값을 계산하려면 동시성 제한이 필요합니다.",
        "apm.r2019a.concurrencynote2": "동시성 제한의 값을 사용할 수 없을 경우(-) 일반 동시성 포틀릿이 일반적인 제한을 가정하며, 이로 인해 신뢰할 수 없는 값이 표시될 수 있습니다.",
        "apm.r2019a.profiler": "프로파일러",
        "apm.r2019a.timingdetails": "타이밍 상세정보",
        "apm.r2019a.datetime": "날짜 및 시간",
        "apm.r2019a.workflows": "워크플로우",
        "apm.r2019a.recordsfromscriptsworkflows": "스크립트/워크플로우의 레코드",
        "apm.r2019a.requesturls": "요청 URL",
        "apm.r2019a.entrypoint": "엔트리 포인트",
        "apm.r2019a.triggertype": "트리거 유형",
        "apm.r2019a.method": "방법",
        "apm.r2019a.webserviceoperation": "WebService 작업",
        "apm.r2019a.apiversion": "API 버전",
        "apm.r2019a.profileroperationid": "프로파일러 작업 ID",
        "apm.r2019a.starttimeanddate": "시작 시간 및 날짜",
        "apm.r2019a.scripts": "스크립트",
        "apm.r2019a.profilertype": "프로파일러 유형",
        "apm.r2019a.record": "레코드",
        "apm.r2019a.requesturl": "요청 URL",
        "apm.r2019a.unclassified": "분류 안 됨",
        "apm.r2019a.url": "URL",
        "apm.r2019a.apicalls": "API 호출",
        "apm.r2019a.profilerdetailsalert": "현재 APM의 프로파일러 상세정보는 고객 스크립트에 대한 정보를 표시하지 못합니다. 프로파일러 상세정보를 열려면 뒤로 돌아가서 다른 스크립트를 선택하십시오.",
        "apm.r2019a.top": "상단",
        "apm.r2019a.actionhistoryon": "{1} {2}부터의 {0} 조치 내역",
        "apm.r2019a.fromtopacifictime": "{0} {1}부터 {2}(태평양 표준시)",
        "apm.r2019a.onpacifictime": "{0}: {1} {2}(태평양 표준시)",
        "apm.r2019a.actions": "조치",
        "apm.r2019a.alldevices": "모든 장치",
        "apm.r2019a.alllocations": "모든 위치",
        "apm.r2019a.allsubsidiaries": "모든 자회사",
        "apm.r2019a.allusers": "모든 사용자",
        "apm.r2019a.asofat": "{0} {1} 기준",
        "apm.r2019a.averageduration": "평균 기간",
        "apm.r2019a.clickanddragtozoom": "확대/축소하려면 클릭한 후 드래그하십시오.",
        "apm.r2019a.moreinformation": "자세한 내용을 보려면 여기를 클릭하십시오.",
        "apm.r2019a.clientscripturl": "고객 스크립트 URL",
        "apm.r2019a.customcsurlrequests": "사용자 정의 고객 스크립트 URL 요청",
        "apm.r2019a.customizationaverage": "사용자 정의 평균",
        "apm.r2019a.lastupdatedon": "사용자 정의 데이터가 {0} {1}에 마지막으로 업데이트됨",
        "apm.r2019a.notavailable": "사용자 정의 데이터를 사용할 수 없음",
        "apm.r2019a.customizationperformance": "사용자 정의 성능",
        "apm.r2019a.customizationtime": "사용자 정의 시간",
        "apm.r2019a.device": "장치",
        "apm.r2019a.devicelistisloading": "장치 목록을 로드하는 중입니다. 잠시 기다려 주십시오.",
        "apm.r2019a.devicename": "장치 이름",
        "apm.r2019a.devices": "장치",
        "apm.r2019a.enddatetime": "종료 날짜 및 시간",
        "apm.r2019a.event": "이벤트",
        "apm.r2019a.executioncount": "실행 카운트",
        "apm.r2019a.filter": "필터",
        "apm.r2019a.instances": "인스턴스",
        "apm.r2019a.location": "위치",
        "apm.r2019a.locationid": "위치 ID",
        "apm.r2019a.locationlistisloading": "위치 목록을 로드하는 중입니다. 잠시 기다려 주십시오.",
        "apm.r2019a.locations": "위치",
        "apm.r2019a.logid": "로그 ID",
        "apm.r2019a.mostfrequent": "가장 빈번함",
        "apm.r2019a.nonbundle": "번들 아님",
        "apm.r2019a.nonbundledcomponents": "번들 구성 요소 아님",
        "apm.r2019a.operations": "작업",
        "apm.r2019a.overheadtime": "오버헤드 시간",
        "apm.r2019a.pacifictime": "태평양 표준시",
        "apm.r2019a.performancedataprocessing": "성능 데이터가 아직 처리 중입니다. 전체 데이터를 확인하려면 이 아이콘을 클릭하기 전에 사용자 이벤트 스크립트 및 워크플로우 열에 값이 표시될 때까지 기다려 주십시오.",
        "apm.r2019a.enteravalidtotalduration": "유효한 총 기간을 입력하십시오.",
        "apm.r2019a.enteravalidusereventtime": "유효한 사용자 이벤트 시간을 입력하십시오.",
        "apm.r2019a.enteravalidworkflowtime": "유효한 워크플로우 시간을 입력하십시오.",
        "apm.r2019a.scisappothers": "SCIS 앱 + 기타",
        "apm.r2019a.scisbundle": "SCIS 번들",
        "apm.r2019a.servertime": "서버 시간",
        "apm.r2019a.scispermissions": "역할에 대한 SuiteCommerce InStore APM SuiteApp 권한을 설정하십시오.",
        "apm.r2019a.startdatetime": "시작 날짜 및 시간",
        "apm.r2019a.subsidiary": "자회사",
        "apm.r2019a.subsidiaryid": "자회사 ID",
        "apm.r2019a.subsidiarylistisloading": "자회사 목록을 로드하는 중입니다. 잠시 기다려 주십시오.",
        "apm.r2019a.scisactionhistorydetail": "SuiteCommerce InStore 조치 내역 상세정보",
        "apm.r2019a.scisperformancediagnostics": "SuiteCommerce InStore 성능 진단",
        "apm.r2019a.scisperformancesetup": "SuiteCommerce InStore 성능 설정",
        "apm.r2019a.timebybundle": "번들별 시간",
        "apm.r2019a.timesources": "시간 출처",
        "apm.r2019a.total95th": "총 95번째",
        "apm.r2019a.totalaverage": "총 평균",
        "apm.r2019a.totalduration": "총 기간",
        "apm.r2019a.totaldurationandcustomizationperformance": "시간 경과에 따른 총 기간 및 사용자 정의 성능(태평양 표준시)",
        "apm.r2019a.totalmedian": "총 중간값",
        "apm.r2019a.uninstalledbundle": "설치되지 않은 번들",
        "apm.r2019a.usereventscripts": "사용자 이벤트 스크립트",
        "apm.r2019a.usereventtime": "사용자 이벤트 시간",
        "apm.r2019a.userlistisloading": "사용자 목록을 로드하는 중입니다. 잠시 기다려 주십시오.",
        "apm.r2019a.valuesarestillprocessing": "대시(-)가 있는 값은 아직 처리 중입니다. 상세정보를 보기 전에 값이 표시될 때까지 기다려 주십시오.",
        "apm.r2019a.viewchart": "차트 보기",
        "apm.r2019a.workflowname": "워크플로우 이름",
        "apm.r2019a.workflowtime": "워크플로우 시간",
        "apm.r2019a.youcannotopenthispage": "APM(Application Performance) SuiteApp이 설치되어 있지 않으므로 이 페이지를 열 수 없습니다. APM SuiteApp을 설치한 다음 다시 시도하십시오.",
        "apm.r2019a.fieldhelp": "필드 도움말",
        "apm.r2019a.whatsthis": "설명",
        "apm.r2019a.daterangefieldhelp": "SCIS 성능 데이터를 확인하려는 기간을 선택하십시오. 날짜 범위는 30일을 넘을 수 없습니다.",
        "apm.r2019a.locationfieldhelp": "특정 소매점에서 기록된 성능 데이터에 초점을 맞추려면 해당 위치를 선택하십시오.",
        "apm.r2019a.subsidiaryfieldhelp": "특정 자회사 또는 모든 자회사에서 발생한 조치에 기초한 성능 데이터를 보려면 해당 자회사를 선택하십시오.",
        "apm.r2019a.devicefieldhelp": "특정 장치 또는 SCIS를 실행하는 모든 장치에서 캡처된 성능 데이터를 확인하십시오.",
        "apm.r2019a.employeefieldhelp": "특정 영업 담당자가 제출한 거래와 관련된 성능 데이터를 보려면 해당 직원 이름을 선택하십시오.",
        "apm.r2019a.sortfieldhelp": "가장 빈번함 및 최고 실행 시간을 기준으로 조치 타일을 정렬할 수 있습니다. 가장 빈번함은 가장 자주 발생하는 조치를 보여줍니다. 실행 시간이 가장 높은 조치는 총 기간이 가장 깁니다."
    };

    return translation;
});