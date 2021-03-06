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
		"apm.cd.button.back" : "ย้อนกลับ",
		"apm.cd.label.concurrencydetails" : "รายละเอียดการเกิดพร้อมกัน",
		"apm.cd.label.detailedconcurrency" : "การเกิดพร้อมกันโดยละเอียด",
		"apm.cd.label.exceededconcurrency" : "การเกิดพร้อมกันที่เกินจำกัด",
		"apm.cd.label.instancedetails" : "รายละเอียดตัวอย่าง",
		"apm.cd.label.max" : "สูงสุด - {0}",
		"apm.cd.label.sec" : "วิ",
		"apm.cd.label.secs" : "วิ",
		"apm.cd.label.viewrequests" : "ดูคำขอ",
		"apm.cd.label.webservices" : "เว็บเซอร์วิส",
		"apm.cm.label._101andabove" : "101% ขึ้นไป",
		"apm.cm.label.concurrencylimit" : "ข้อจำกัดการเกิดพร้อมกัน",
		"apm.cm.label.concurrencymonitor" : "ตัวตรวจสอบการเกิดพร้อมกัน",
		"apm.cm.label.concurrencyusage" : "การใช้การเกิดพร้อมกัน",
		"apm.cm.label.generalconcurrency" : "การเกิดพร้อมกันทั่วไป",
		"apm.cm.label.highestexceededconcurrency" : "การเกิดพร้อมกันที่เกินจำกัดสูงสุด",
		"apm.cm.label.note" : "บันทึก",
		"apm.cm.label.peakconcurrency" : "การเกิดพร้อมกันสูงสุด",
		"apm.cm.label.percentvaluesareapproximate" : "ค่าเปอร์เซ็นต์ คือ ค่าโดยประมาณ",
		"apm.cm.label.requestexceedinglimit" : "คำขอเกินข้อจำกัด",
		"apm.cm.label.requestswithinlimit" : "คำขออยู่ภายในข้อจำกัด (%)",
		"apm.cm.label.totalexceededconcurrency" : "การเกิดพร้อมกันที่เกินจำกัดทั้งหมด",
		"apm.cm.label.valuesareexact" : "ค่าถูกต้อง",
		"apm.common.alert.daterange._30days" : "ช่วงวันที่ไม่ควรเกินกว่า 30 วัน",
		"apm.common.alert.daterange._3days" : "ช่วงวันที่ไม่ควรต่ำกว่า 3 วัน",
		"apm.common.alert.enablefeatures" : "ต้องเปิดใช้งานคุณสมบัติ [Custom Records], [Client SuiteScript] และ [Server SuiteScript] โปรดเปิดใช้งานคุณสมบัติและลองอีกครั้ง",
		"apm.common.alert.endaterequired" : "ต้องมีวันที่สิ้นสุด",
		"apm.common.alert.entervalidenddate" : "โปรดป้อนวันที่สิ้นสุดที่ถูกต้อง",
		"apm.common.alert.entervalidstartdate" : "โปรดป้อนวันที่เริ่มต้นที่ถูกต้อง",
		"apm.common.alert.errorinsearch" : "เกิดข้อผิดพลาดในการค้นหา",
		"apm.common.alert.errorinsuitelet" : "เกิดข้อผิดพลาดใน Suitelet",
		"apm.common.alert.invalidenddate" : "วันที่สิ้นสุดไม่ถูกต้อง",
		"apm.common.alert.invalidstartdate" : "วันที่เริ่มต้นไม่ถูกต้อง",
		"apm.common.alert.nocontent" : "ไม่มีเนื้อหา",
		"apm.common.alert.startdateearlierthanenddate" : "วันที่เริ่มต้นจะต้องเป็นวันที่ก่อนวันที่สิ้นสุด",
		"apm.common.alert.startdaterequired" : "ต้องมีวันที่เริ่มต้น",
		"apm.common.button.cancel" : "ยกเลิก",
		"apm.common.button.done" : "เสร็จแล้ว",
		"apm.common.button.refresh" : "รีเฟรช",
		"apm.common.button.reset" : "รีเซ็ต",
		"apm.common.button.set" : "ตั้งค่า",
		"apm.common.highcharts.drilluptext" : "กลับไปยัง",
		"apm.common.highcharts.nodata" : "ไม่มีข้อมูลจะแสดง",
		"apm.common.highcharts.resetzoom" : "รีเซ็ตย่อ/ขยาย",
		"apm.common.highcharts.resetzoomtitle" : "รีเซ็ตย่อ/ขยาย ระดับ 1:1",
		"apm.common.label._95th" : "ที่ 95",
		"apm.common.label._95thpercentile" : "เปอร์เซ็นต์ไทล์ที่ 95",
		"apm.common.label.all" : "ทั้งหมด",
		"apm.common.label.asof" : "ณ {0}",
		"apm.common.label.client" : "ไคลเอ็นต์",
		"apm.common.label.close" : "ปิด",
		"apm.common.label.companyid" : "ID บริษัท",
		"apm.common.label.completed" : "เสร็จสิ้นแล้ว",
		"apm.common.label.concurrency" : "การเกิดพร้อมกัน",
		"apm.common.label.concurrencycount" : "จำนวนการเกิดพร้อมกัน",
		"apm.common.label.context" : "ข้อความ",
		"apm.common.label.csvimport" : "นำเข้าข้อมูล CSV",
		"apm.common.label.custom" : "ปรับแต่ง",
		"apm.common.label.customdaterange" : "ปรับแต่งช่วงวันที่",
		"apm.common.label.customerdebugsettings" : "การตั้งค่าการแก้จุดบกพร่องของลูกค้า",
		"apm.common.label.dashboard" : "แผงควบคุม",
		"apm.common.label.daterange" : "ช่วงวันที่",
		"apm.common.label.datetime" : "วันที่และเวลา",
		"apm.common.label.deploymentname" : "ชื่อการปรับใช้งาน",
		"apm.common.label.edit" : "แก้ไข",
		"apm.common.label.elevatedpriority" : "ยกระดับลำดับความสำคัญแล้ว",
		"apm.common.label.email" : "อีเมล",
		"apm.common.label.enddate" : "วันที่สิ้นสุด",
		"apm.common.label.enddatetime" : "เวลา/วันที่สิ้นสุด",
		"apm.common.label.endtimerequired" : "ต้องมีเวลาสิ้นสุด",
		"apm.common.label.errorrate" : "ข้อผิดพลาดอัตราราคา",
		"apm.common.label.exceededconcurrencycount" : "เกินจำนวนการเกิดพร้อมกัน",
		"apm.common.label.executioncontext" : "ข้อความการดำเนินการ",
		"apm.common.label.executiontime" : "เวลาดำเนินการ",
		"apm.common.label.exportcsv" : "ส่งออก - CSV",
		"apm.common.label.failed" : "ล้มเหลว",
		"apm.common.label.failedrequests" : "คำขอล้มเหลว",
		"apm.common.label.filters" : "ฟิลเตอร์",
		"apm.common.label.from" : "จาก",
		"apm.common.label.histogram" : "ฮิสโตแกรม",
		"apm.common.label.hr" : "ชม.",
		"apm.common.label.hrs" : "ชม.",
		"apm.common.label.instancecount" : "จำนวนตัวอย่าง",
		"apm.common.label.integration" : "การใช้งานร่วมกัน",
		"apm.common.label.last12hours" : "12 ชั่วโมงล่าสุด",
		"apm.common.label.last14days" : "14 วันล่าสุด",
		"apm.common.label.last1hour" : "1 ชั่วโมงล่าสุด",
		"apm.common.label.last24hours" : "24 ชั่วโมงล่าสุด",
		"apm.common.label.last30days" : "30 วันล่าสุด",
		"apm.common.label.last3days" : "3 วันล่าสุด",
		"apm.common.label.last3hours" : "3 ชั่วโมงล่าสุด",
		"apm.common.label.last6hours" : "6 ชั่วโมงล่าสุด",
		"apm.common.label.last7days" : "7 วันล่าสุด",
		"apm.common.label.loading" : "กำลังโหลด",
		"apm.common.label.mapreduce" : "แมป/ลดลง",
		"apm.common.label.median" : "ค่ากลาง",
		"apm.common.label.min" : "นาที",
		"apm.common.label.mins" : "นาที",
		"apm.common.label.mostusers" : "ผู้ใช้ส่วนใหญ่",
		"apm.common.label.name" : "ชื่อ",
		"apm.common.label.network" : "เครือข่าย",
		"apm.common.label.new" : "ใหม่",
		"apm.common.label.nodataavailable" : "ไม่มีข้อมูลพร้อมใช้งาน",
		"apm.common.label.nodrilldowndata" : "ไม่ได้รับข้อมูลแบบเจาะรายละเอียด",
		"apm.common.label.none" : "ไม่มี",
		"apm.common.label.norecordstoshow" : "ไม่มีไฟล์ข้อมูลที่จะแสดง",
		"apm.common.label.notiledatavailable" : "ไม่มีข้อมูลให้ใช้งานสำหรับไทล์นี้",
		"apm.common.label.numberoflogs" : "จำนวนของบันทึก",
		"apm.common.label.numberofusers" : "จำนวนผู้ใช้",
		"apm.common.label.operation" : "การดำเนินการ",
		"apm.common.label.overview" : "ภาพรวม",
		"apm.common.label.pageinit" : "pageinit",
		"apm.common.label.percentage" : "เปอร์เซ็นต์",
		"apm.common.label.queue" : "คิว",
		"apm.common.label.recordoperations" : "บันทึกการดำเนินการ",
		"apm.common.label.records" : "ไฟล์ข้อมูล",
		"apm.common.label.recordsperminute" : "ไฟล์ข้อมูลต่อนาที",
		"apm.common.label.recordtype" : "ประเภทไฟล์ข้อมูล",
		"apm.common.label.rejectedaccountconcurrency" : "ปฏิเสธการเกิดพร้อมกันของบัญชีแล้ว",
		"apm.common.label.rejecteduserconcurrency" : "ปฏิเสธการเกิดพร้อมกันของผู้ใช้แล้ว",
		"apm.common.label.requests" : "คำร้อง",
		"apm.common.label.responsetime" : "เวลาตอบสนอง",
		"apm.common.label.restlet" : "RESTlet",
		"apm.common.label.role" : "บทบาท",
		"apm.common.label.roles" : "บทบาท",
		"apm.common.label.save" : "บันทึก",
		"apm.common.label.scheduled" : "วางกำหนดการแล้ว",
		"apm.common.label.scriptname" : "ชื่อสคริปต์",
		"apm.common.label.selectionaffectallportlets" : "การเลือกมีผลกับทุกพอร์ตเล็ต",
		"apm.common.label.server" : "เซิร์ฟเวอร์",
		"apm.common.label.setup" : "ตั้งค่า",
		"apm.common.label.sorting" : "การเรียงลำดับ",
		"apm.common.label.startdate" : "วันที่เริ่มต้น",
		"apm.common.label.startdatetime" : "วันที่/เวลาเริ่มต้น",
		"apm.common.label.status" : "สถานะ",
		"apm.common.label.timeline" : "ไทม์ไลน์",
		"apm.common.label.timeout" : "หมดเวลา",
		"apm.common.label.timeoutrate" : "อัตราราคาหมดเวลา",
		"apm.common.label.to" : "ถึง",
		"apm.common.label.total" : "ทั้งหมด",
		"apm.common.label.totalrecords" : "ไฟล์ข้อมูลทั้งหมด",
		"apm.common.label.totalrequests" : "คำขอทั้งหมด",
		"apm.common.label.totaltime" : "เวลาทั้งหมด",
		"apm.common.label.type" : "ประเภท",
		"apm.common.label.urlrequests" : "คำขอ URL",
		"apm.common.label.user" : "ผู้ใช้",
		"apm.common.label.userevent" : "กิจกรรมผู้ใช้",
		"apm.common.label.users" : "ผู้ใช้",
		"apm.common.label.view" : "ดู",
		"apm.common.label.viewdetails" : "ดูรายละเอียด",
		"apm.common.label.viewfrhtdetails" : "ดูรายละเอียด FRHT",
		"apm.common.label.viewing" : "กำลังดู",
		"apm.common.label.waittime" : "เวลารอ",
		"apm.common.label.webservice" : "เว็บเซอร์วิส",
		"apm.common.month.april" : "เมษายน",
		"apm.common.month.august" : "สิงหาคม",
		"apm.common.month.december" : "ธันวาคม",
		"apm.common.month.february" : "กุมภาพันธ์",
		"apm.common.month.january" : "มกราคม",
		"apm.common.month.july" : "กรกฎาคม",
		"apm.common.month.june" : "มิถุนายน",
		"apm.common.month.march" : "มีนาคม",
		"apm.common.month.may" : "พฤษภาคม",
		"apm.common.month.november" : "พฤศจิกายน",
		"apm.common.month.october" : "ตุลาคม",
		"apm.common.month.september" : "กันยายน",
		"apm.common.priority.high" : "สูง",
		"apm.common.priority.low" : "ต่ำ",
		"apm.common.priority.standard" : "มาตรฐาน",
		"apm.common.shortmonth.april" : "เม.ย.",
		"apm.common.shortmonth.august" : "ส.ค.",
		"apm.common.shortmonth.december" : "ธ.ค.",
		"apm.common.shortmonth.february" : "ก.พ.",
		"apm.common.shortmonth.january" : "ม.ค.",
		"apm.common.shortmonth.july" : "ก.ค.",
		"apm.common.shortmonth.june" : "มิ.ย.",
		"apm.common.shortmonth.march" : "มี.ค.",
		"apm.common.shortmonth.may" : "พ.ค.",
		"apm.common.shortmonth.november" : "พ.ย.",
		"apm.common.shortmonth.october" : "ต.ค.",
		"apm.common.shortmonth.september" : "ก.ย.",
		"apm.common.shortweekday.friday" : "ศ.",
		"apm.common.shortweekday.monday" : "จ.",
		"apm.common.shortweekday.saturday" : "ส.",
		"apm.common.shortweekday.sunday" : "อา.",
		"apm.common.shortweekday.thursday" : "อ.",
		"apm.common.shortweekday.tuesday" : "พฤ.",
		"apm.common.shortweekday.wednesday" : "พ.",
		"apm.common.time.am" : "AM",
		"apm.common.time.pm" : "PM",
		"apm.common.tooltip.percentfromtotal" : "% จากทั้งหมด",
		"apm.common.weekday.friday" : "ศุกร์",
		"apm.common.weekday.monday" : "จันทร์",
		"apm.common.weekday.saturday" : "เสาร์",
		"apm.common.weekday.sunday" : "อาทิตย์",
		"apm.common.weekday.thursday" : "พฤหัสบดี",
		"apm.common.weekday.tuesday" : "อังคาร",
		"apm.common.weekday.wednesday" : "พุธ",
		"apm.db.alert.entervalidhistograminterval" : "โปรดใส่ค่าช่วงฮิสโตแกรมที่ถูกต้อง",
		"apm.db.alert.entervalidresponsetime" : "โปรดใส่ค่าเวลาตอบสนองที่ถูกต้อง",
		"apm.db.alert.operationrequired" : "ต้องมีการดำเนินการ",
		"apm.db.alert.recordtyperequired" : "ต้องมีประเภทไฟล์ข้อมูล",
		"apm.db.alert.starttimerequired" : "ต้องมีเวลาเริ่มต้น",
		"apm.db.alert.watchlist10items" : "คุณสามารถมีรายการเฝ้าระวังได้มากสุดแค่ 10 รายการ",
		"apm.db.label.adddatetime" : "เพิ่มวันที่และเวลา",
		"apm.db.label.addwatchlist" : "เพิ่มรายการเฝ้าระวัง",
		"apm.db.label.chartpreferences" : "การปรับแต่งค่าแผนภูมิ",
		"apm.db.label.customdatetime" : "ปรับแต่งวันที่และเวลา",
		"apm.db.label.duplicaterecordtypeoperation" : "การดำเนินการและประเภทไฟล์ข้อมูลที่ซ้ำกัน",
		"apm.db.label.endtime" : "เวลาสิ้นสุด",
		"apm.db.label.export" : "ส่งออก",
		"apm.db.label.general" : "ทั่วไป",
		"apm.db.label.highestresponsetime" : "เวลาตอบสนองสูงสุด",
		"apm.db.label.mostutilized" : "ที่ใช้ประโยชน์สูงสุด",
		"apm.db.label.outof" : "{0} จาก {1}",
		"apm.db.label.recordinstance" : "ตัวอย่างไฟล์ข้อมูล",
		"apm.db.label.recordinstances" : "ตัวอย่างไฟล์ข้อมูล",
		"apm.db.label.recordpages" : "หน้าไฟล์ข้อมูล",
		"apm.db.label.recordtiles" : "ไทล์ไฟล์ข้อมูล",
		"apm.db.label.removeall" : "ลบทั้งหมด",
		"apm.db.label.setuprecordpages" : "ตั้งค่าหน้าไฟล์ข้อมูล",
		"apm.db.label.showallrecordtiles" : "แสดงไทล์ไฟล์ข้อมูลทั้งหมด",
		"apm.db.label.showwatchlistonly" : "แสดงเฉพาะรายการเฝ้าระวัง",
		"apm.db.label.starttime" : "เวลาเริ่มต้น",
		"apm.db.label.throughput" : "อัตราความเร็ว",
		"apm.db.label.unknown" : "ไม่ทราบที่มา",
		"apm.db.label.usereventworkflow" : "กิจกรรมผู้ใช้และขั้นตอนการทำงาน",
		"apm.db.label.watchlist" : "รายการเฝ้าระวัง",
		"apm.db.responsetimechart.clientnetworkserver" : "ไคลเอ็นต์ เครือข่ายและเซิร์ฟเวอร์",
		"apm.db.setup.interval" : "ช่วงเวลา",
		"apm.ns.client.fieldchanged" : "fieldChanged",
		"apm.ns.client.lineinit" : "lineInit",
		"apm.ns.client.postsourcing" : "postSourcing",
		"apm.ns.client.recalc" : "recalc",
		"apm.ns.client.saverecord" : "saveRecord",
		"apm.ns.client.validatedelete" : "validateDelete",
		"apm.ns.client.validatefield" : "validateField",
		"apm.ns.client.validateinsert" : "validateInsert",
		"apm.ns.client.validateline" : "validateLine",
		"apm.ns.common.add" : "เพิ่ม",
		"apm.ns.context.backend" : "ส่วนหลัง",
		"apm.ns.context.customfielddefault" : "ปรับแต่งค่าดีฟอลต์ของฟิลด์",
		"apm.ns.context.emailalert" : "การแจ้งเตือนทางอีเมล",
		"apm.ns.context.emailscheduled" : "อีเมลที่วางกำหนดการไว้",
		"apm.ns.context.machine" : "เครื่องจักร",
		"apm.ns.context.other" : "อื่นๆ",
		"apm.ns.context.reminder" : "ตัวช่วยเตือน",
		"apm.ns.context.snapshot" : "ภาพรวมด่วน",
		"apm.ns.context.suitescript" : "SuiteScript",
		"apm.ns.context.website" : "เว็บไซต์",
		"apm.ns.context.workflow" : "ขั้นตอนการทำงาน",
		"apm.ns.status.finished" : "เสร็จแล้ว",
		"apm.ns.triggertype.aftersubmit" : "aftersubmit",
		"apm.ns.triggertype.beforeload" : "beforeload",
		"apm.ns.triggertype.beforesubmit" : "beforesubmit",
		"apm.ns.wsa.delete" : "ลบ",
		"apm.ns.wsa.update" : "แจ้งการปรับปรุง",
		"apm.ptd.label.clientheader" : "ไคลเอ็นต์: ส่วนหัว",
		"apm.ptd.label.clientinit" : "ไคลเอ็นต์: แรกเริ่ม",
		"apm.ptd.label.clientrender" : "ไคลเอ็นต์: จัดหาให้",
		"apm.ptd.label.deploymentid" : "ID การปรับใช้งาน",
		"apm.ptd.label.page" : "หน้า",
		"apm.ptd.label.pagetimedetails" : "รายละเอียดหน้าเวลา",
		"apm.ptd.label.script" : "สคริปต์",
		"apm.ptd.label.scriptaftersubmit" : "สคริปต์: aftersubmit: {0}",
		"apm.ptd.label.scriptbeforeload" : "สคริปต์: beforeload: {0}",
		"apm.ptd.label.scriptbeforesubmit" : "สคริปต์: beforesubmit: {0}",
		"apm.ptd.label.scriptpageinit" : "สคริปต์: pageinit: {0}",
		"apm.ptd.label.scripttypeworkflow" : "ประเภทสคริปต์/ขั้นตอนการทำงาน",
		"apm.ptd.label.searches" : "การค้นหา",
		"apm.ptd.label.suitescriptworkflowdetails" : "SuiteScript และรายละเอียดขั้นตอนการทำงาน",
		"apm.ptd.label.time" : "เวลา",
		"apm.ptd.label.usage" : "การใช้",
		"apm.ptd.label.userevent" : "USEREVENT",
		"apm.pts.description._95thpercentile" : "อาจพบค่า (หรือคะแนน) ต่ำกว่า 95 เปอร์เซ็นต์ของการเฝ้าสังเกตการณ์",
		"apm.pts.description.average" : "ค่าเฉลี่ยของตัวเลข",
		"apm.pts.description.median" : "ตัวเลขกลาง (ที่อยู่ในรายการตัวเลขที่จัดเรียงลำดับ)",
		"apm.pts.description.standarddeviation" : "การวัดวิธีการกระจายตัวเลข ได้แก่",
		"apm.pts.label.aggregation" : "การรวมกัน",
		"apm.pts.label.and" : "และ",
		"apm.pts.label.between" : "ระหว่าง",
		"apm.pts.label.bundle" : "รวมชุด",
		"apm.pts.label.columnname" : "ชื่อคอลัมน์",
		"apm.pts.label.description" : "คำอธิบาย",
		"apm.pts.label.details" : "รายละเอียด",
		"apm.pts.label.greaterthan" : "มากกว่า",
		"apm.pts.label.lessthan" : "น้อยกว่า",
		"apm.pts.label.meanaverage" : "ค่ากลาง/ค่าเฉลี่ย",
		"apm.pts.label.netsuitesystem" : "ระบบ NetSuite",
		"apm.pts.label.pagetimesummary" : "หน้าสรุปเวลา",
		"apm.pts.label.performancelogs" : "บันทึกผลการดำเนินงาน",
		"apm.pts.label.responsetimeinseconds" : "เวลาตอบสนอง (ในหน่วย วิ)",
		"apm.pts.label.scriptworkflowtimebreakdown" : "สคริปต์/รายงานสรุปเวลาของขั้นตอนการทำงาน",
		"apm.pts.label.setupsummary" : "ตั้งค่าสรุป",
		"apm.pts.label.show" : "แสดง",
		"apm.pts.label.standarddeviation" : "ค่าเบี่ยงเบนมาตรฐาน",
		"apm.pts.label.summary" : "สรุป",
		"apm.scpm.alert.startdate30dayscurrentdate" : "วันที่เริ่มต้นไม่ควรเกิน 30 วัน นับจากวันที่ปัจจุบัน",
		"apm.scpm.label.available" : "ที่พร้อมใช้งาน",
		"apm.scpm.label.availabletime" : "เวลาที่พร้อมใช้งาน",
		"apm.scpm.label.aveexecutiontime" : "เวลาดำเนินการโดยเฉลี่ย",
		"apm.scpm.label.averagewaittime" : "เวลารอโดยเฉลี่ย",
		"apm.scpm.label.avewaittime" : "เวลารอโดยเฉลี่ย",
		"apm.scpm.label.cancelled" : "ยกเลิกแล้ว",
		"apm.scpm.label.complete" : "เสร็จสิ้นแล้ว",
		"apm.scpm.label.deferred" : "รอตัดบัญชี",
		"apm.scpm.label.elevated" : "ยกระดับแล้ว",
		"apm.scpm.label.elevationinterval" : "ช่วงเวลาการยกระดับ",
		"apm.scpm.label.jobs" : "งาน",
		"apm.scpm.label.jobscompleted" : "งานเสร็จสิ้นแล้ว",
		"apm.scpm.label.jobsfailed" : "งานล้มเหลว",
		"apm.scpm.label.jobstatus" : "สถานะงาน",
		"apm.scpm.label.noofreservedprocessors" : "จำนวนตัวประมวลผลที่สำรองไว้",
		"apm.scpm.label.original" : "แรกเริ่ม",
		"apm.scpm.label.pending" : "รอดำเนินการ",
		"apm.scpm.label.priority" : "ลำดับความสำคัญ",
		"apm.scpm.label.priorityelevation" : "การยกระดับความสำคัญ",
		"apm.scpm.label.processing" : "กำลังประมวลผล",
		"apm.scpm.label.processorconcurrency" : "การเกิดพร้อมกันของตัวประมวลผล",
		"apm.scpm.label.processorreservation" : "การสำรองตัวประมวลผล",
		"apm.scpm.label.processors" : "ตัวประมวลผล",
		"apm.scpm.label.processorsettings" : "การตั้งค่าตัวประมวลผล",
		"apm.scpm.label.processorutilization" : "การใช้ประโยชน์ตัวประมวลผล",
		"apm.scpm.label.queueprocessordetails" : "รายละเอียดคิว/ตัวประมวลผล",
		"apm.scpm.label.queues" : "คิว",
		"apm.scpm.label.reservedprocessorsinuse" : "ตัวประมวลผลที่สำรองไว้อยู่ระหว่างใช้งาน",
		"apm.scpm.label.retry" : "ลองอีกครั้ง",
		"apm.scpm.label.reuseidleprocessors" : "ใช้ตัวประมวลผลที่ว่างอยู่อีกครั้ง",
		"apm.scpm.label.totalnoofprocessors" : "จำนวนตัวประมวลผลทั้งหมด",
		"apm.scpm.label.totalwaittime" : "เวลารอทั้งหมด",
		"apm.scpm.label.utilization" : "การใช้ประโยชน์",
		"apm.scpm.label.utilized" : "ใช้ประโยชน์แล้ว",
		"apm.scpm.label.utilizedtime" : "เวลาที่ใช้ประโยชน์",
		"apm.scpm.label.waittimebypriority" : "เวลารอคอยตามลำดับความสำคัญ",
		"apm.setup.label.apmsetup" : "การตั้งค่า APM",
		"apm.setup.label.employee" : "พนักงาน",
		"apm.setup.label.employees" : "พนักงาน",
		"apm.setup.label.setuppermissionlabel" : "ตั้งค่าการอนุญาตไปยัง Application Performance Management SuiteApp",
		"apm.setup.top10mostutilized" : "ที่ใช้ประโยชน์สูงสุด 10 อันดับแรก",
		"apm.spa.label.highestexecutiontime" : "เวลาดำเนินการสูงสุด",
		"apm.spa.label.mostrequested" : "ที่ร้องขอมากสุด",
		"apm.spa.label.mosttimeouts" : "หมดเวลาบ่อยสุด",
		"apm.spa.label.savedsearches" : "การค้นหาที่บันทึกไว้",
		"apm.spa.label.searchperformanceanalysis" : "ค้นหาการวิเคราะห์ผลการดำเนินงาน",
		"apm.spd.alert.searchloadingwait" : "การค้นหาของคุณกำลังโหลดอยู่ โปรดรอสักครู่",
		"apm.spd.label.date" : "วันที่",
		"apm.spd.label.isfalse" : "เท็จ",
		"apm.spd.label.istrue" : "จริง",
		"apm.spd.label.savedsearch" : "การค้นหาที่บันทึกไว้",
		"apm.spd.label.savedsearchbycontext" : "การค้นหาที่บันทึกไว้ตามข้อความ",
		"apm.spd.label.savedsearchdetails" : "รายละเอียดการค้นหาที่บันทึกไว้",
		"apm.spd.label.savedsearchlogs" : "บันทึกการค้นหาที่บันทึกไว้",
		"apm.spd.label.searchperformancedetails" : "ค้นหารายละเอียดผลการดำเนินงาน",
		"apm.spjd.label.alldeployments" : "การปรับใช้งานทั้งหมด",
		"apm.spjd.label.alltasktypes" : "ประเภทงานทั้งหมด",
		"apm.spjd.label.datecreated" : "วันที่สร้าง",
		"apm.spjd.label.deployment" : "การปรับใช้งาน",
		"apm.spjd.label.jobdetails" : "รายละเอียดงาน",
		"apm.spjd.label.jobdetailstimeline" : "ไทม์ไลน์รายละเอียดงาน",
		"apm.spjd.label.mapreduceexecutiontime" : "แมป/ลดเวลาการดำเนินการลง",
		"apm.spjd.label.mapreducestage" : "ขั้นการแมป/ลดลง",
		"apm.spjd.label.mapreducewaittime" : "แมป/ลดเวลารอลง",
		"apm.spjd.label.originalpriority" : "ลำดับความสำคัญแรกเริ่ม",
		"apm.spjd.label.scheduledexecutiontime" : "วางกำหนดการเวลาดำเนินการแล้ว",
		"apm.spjd.label.scheduledwaittime" : "วางกำหนดการเวลารอแล้ว",
		"apm.spjd.label.suitecouldprocessorsjobdetails" : "รายละเอียดงานตัวประมวลผล SuiteCloud",
		"apm.spjd.label.taskid" : "ID งาน",
		"apm.spjd.label.tasktype" : "ประเภทงาน",
		"apm.spm.label.suitecloudprocessormonitor" : "ตัวตรวจสอบตัวประมวลผล SuiteCloud",
		"apm.ssa.alert.enterclienteventtype" : "โปรดเลือกประเภทกิจกรรมของไคลเอ็นต์",
		"apm.ssa.alert.enterscriptid" : "โปรดใส่ค่า ID สคริปต์",
		"apm.ssa.alert.enterscripttype" : "โปรดเลือกประเภทสคริปต์",
		"apm.ssa.alert.selectscriptname" : "โปรดเลือกชื่อสคริปต์",
		"apm.ssa.label.clienteventtype" : "ประเภทกิจกรรมของไคลเอ็นต์",
		"apm.ssa.label.errorcount" : "จำนวนข้อผิดพลาด",
		"apm.ssa.label.performancechart" : "แผนภูมิผลการดำเนินงาน",
		"apm.ssa.label.recordid" : "ID ไฟล์ข้อมูล",
		"apm.ssa.label.scriptid" : "ID สคริปต์",
		"apm.ssa.label.scripttype" : "ประเภทสคริปต์",
		"apm.ssa.label.search" : "ค้นหา",
		"apm.ssa.label.searchcalls" : "ค้นหาการโทร",
		"apm.ssa.label.suitelet" : "Suitelet",
		"apm.ssa.label.suitescriptanalysis" : "การวิเคราะห์ SuiteScript",
		"apm.ssa.label.suitescriptdetails" : "รายละเอียด SuiteScript",
		"apm.ssa.label.suitescriptexecutionovertime" : "การดำเนินการ SuiteScript ในช่วงเวลา",
		"apm.ssa.label.usagecount" : "จำนวนการใช้",
		"apm.ssa.label.usereventaftersubmit" : "กิจกรรมผู้ใช้ (หลังจากส่ง)",
		"apm.ssa.label.usereventbeforeload" : "กิจกรรมผู้ใช้ (ก่อนโหลด)",
		"apm.ssa.label.usereventbeforesubmit" : "กิจกรรมผู้ใช้ (ก่อนส่ง)",
		"apm.ssa.label.userinterface" : "ส่วนติดต่อผู้ใช้",
		"apm.ssa.label.value" : "ค่า",
		"apm.ssa.label.viewlogs" : "ดูบันทึก",
		"apm.ssa.label.webstore" : "เว็บสโตร์",
		"apm.wsa.apiversion.notreleased" : "ยังไม่ได้นำออกใช้",
		"apm.wsa.apiversion.notsupported" : "ไม่ได้รับการสนับสนุน",
		"apm.wsa.apiversion.supported" : "ได้รับการสนับสนุน",
		"apm.wsa.apiversionusage.retired" : "เลิกใช้แล้ว",
		"apm.wsa.label.apiversionusage" : "การใช้เวอร์ชัน API",
		"apm.wsa.label.executiontimeperrecordtype" : "เวลาการดำเนินการต่อประเภทไฟล์ข้อมูล",
		"apm.wsa.label.instancecountperrecordtype" : "จำนวนตัวอย่างต่อประเภทไฟล์ข้อมูล",
		"apm.wsa.label.requestcount" : "จำนวนคำร้อง",
		"apm.wsa.label.statusbreakdown" : "รายงานสรุปสถานะ",
		"apm.wsa.label.topwebservicesoperations" : "การดำเนินการเว็บเซอร์วิสอันดับสูงสุด",
		"apm.wsa.label.topwebservicesrecordprocessing" : "การประมวลผลไฟล์ข้อมูลเว็บเซอร์วิสอันดับสูงสุด",
		"apm.wsa.label.webservicesanalysis" : "การวิเคราะห์เว็บเซอร์วิส",
		"apm.wsa.label.webservicesoperationstatus" : "สถานะการดำเนินการบนเว็บเซอร์วิส",
		"apm.wsa.label.webservicesrecordprocessing" : "การประมวลผลไฟล์ข้อมูลเว็บเซอร์วิส",
		"apm.wsa.label.webservicesrecordprocessingstatus" : "สถานะการประมวลผลไฟล์ข้อมูลเว็บเซอร์วิส",
		"apm.wsod.label.performancedetails" : "รายละเอียดผลการดำเนินงาน",
		"apm.wsod.label.timerange" : "ช่วงเวลา",
		"apm.wsod.label.toprecordsperformance" : "ไฟล์ข้อมูลอันดับผลการดำเนินงานสูงสุด",
		"apm.wsod.label.webservicesoperationdetails" : "รายละเอียดการดำเนินการบนเว็บเซอร์วิส",
		"apm.wsod.label.webservicesoperationlogs" : "บันทึกการดำเนินการบนเว็บเซอร์วิส",
		"apm.wsod.label.webservicesrecordprocessinglogs" : "บันทึกการประมวลผลไฟล์ข้อมูลเว็บเซอร์วิส",
		"apm.common.label.performance" : "ผลการดำเนินงาน",

    	//NEW
		"apm.r2019a.profilerdetails": "รายละเอียดเครื่องมือสร้างโปรไฟล์",
		"apm.r2019a.viewprofilerdetails": "ดูรายละเอียดเครื่องมือสร้างโปรไฟล์",
		"apm.r2019a.averageexecutiontime": "เวลาในการดำเนินการโดยเฉลี่ย",
		"apm.r2019a.medianexecutiontime": "เวลาในการดำเนินการตามค่ามัธยฐาน",
		"apm.r2019a.average": "เฉลี่ย",
		"apm.r2019a.important": "สำคัญ",
		"apm.r2019a.concurrencynote1": "พอร์ตเล็ตของการทำงานพร้อมกันทั่วไปต้องมีข้อจำกัดในการทำงานพร้อมกันเพื่อคำนวณค่า",
		"apm.r2019a.concurrencynote2": "เมื่อค่าของข้อจำกัดในการทำงานพร้อมกันไม่พร้อมใช้งาน (-) พอร์ตเล็ตของการทำงานพร้อมกันทั่วไปจะยอมรับข้อจำกัดทั่วไป ซึ่งอาจทำให้เกิดการแสดงค่าที่เชื่อถือไม่ได้",
		"apm.r2019a.profiler": "เครื่องมือสร้างโปรไฟล์",
		"apm.r2019a.timingdetails": "รายละเอียดเวลา",
		"apm.r2019a.datetime": "วันที่และเวลา",
		"apm.r2019a.workflows": "เวิร์กโฟลว์",
		"apm.r2019a.recordsfromscriptsworkflows": "บันทึกจากสคริปต์/เวิร์กโฟลว์",
		"apm.r2019a.requesturls": "ขอ URL",
		"apm.r2019a.entrypoint": "จุดเข้าใช้งาน",
		"apm.r2019a.triggertype": "ชนิดทริกเกอร์",
		"apm.r2019a.method": "วิธีการ",
		"apm.r2019a.webserviceoperation": "การทำงานของเว็บเซอร์วิส",
		"apm.r2019a.apiversion": "เวอร์ชัน API",
		"apm.r2019a.profileroperationid": "ID การทำงานของเครื่องมือสร้างโปรไฟล์",
		"apm.r2019a.starttimeanddate": "เวลาและวันที่เริ่มต้น",
		"apm.r2019a.scripts": "สคริปต์",
		"apm.r2019a.profilertype": "ประเภทเครื่องมือสร้างโปรไฟล์",
		"apm.r2019a.record": "บันทึก",
		"apm.r2019a.requesturl": "ขอ URL",
		"apm.r2019a.unclassified": "ไม่ได้จัดประเภท",
		"apm.r2019a.url": "Url",
		"apm.r2019a.apicalls": "การเรียกใช้ API",
		"apm.r2019a.profilerdetailsalert": "รายละเอียดเครื่องมือสร้างโปรไฟล์ใน APM ไม่สามารถแสดงข้อมูลเกี่ยวกับสคริปต์ไคลเอนต์ได้ในขณะนี้ หากต้องการเปิดรายละเอียดเครื่องมือสร้างโปรไฟล์ ให้ย้อนกลับและเลือกสคริปต์อื่น",
		"apm.r2019a.top": "ด้านบน",
		"apm.r2019a.actionhistoryon": "{0} ประวัติการดำเนินการในวันที่ {1} ตั้งแต่ {2}",
		"apm.r2019a.fromtopacifictime": "{0} ตั้งแต่ {1} ถึง {2} (เวลาแปซิฟิก)",
		"apm.r2019a.onpacifictime": "{0} ในวันที่ {1} เวลา {2} (เวลาแปซิฟิก)",
		"apm.r2019a.actions": "การดำเนินการ",
		"apm.r2019a.alldevices": "อุปกรณ์ทั้งหมด",
		"apm.r2019a.alllocations": "สถานที่ตั้งทั้งหมด",
		"apm.r2019a.allsubsidiaries": "ทุกบริษัทในเครือ",
		"apm.r2019a.allusers": "ผู้ใช้ทั้งหมด",
		"apm.r2019a.asofat": "ณ {0} เมื่อ {1}",
		"apm.r2019a.averageduration": "ช่วงเวลาเฉลี่ย",
		"apm.r2019a.clickanddragtozoom": "คลิกและลากเพื่อขยาย",
		"apm.r2019a.moreinformation": "คลิกที่นี่เพื่อดูข้อมูลเพิ่มเติม",
		"apm.r2019a.clientscripturl": "URL สคริปต์ไคลเอนต์",
		"apm.r2019a.customcsurlrequests": "คำขอ URL สคริปต์ไคลเอนต์ที่กำหนดเอง",
		"apm.r2019a.customizationaverage": "ค่าเฉลี่ยการปรับแต่ง",
		"apm.r2019a.lastupdatedon": "ปรับปรุงข้อมูลการปรับแต่งครั้งล่าสุดเมื่อ {0} เวลา {1}",
		"apm.r2019a.notavailable": "ข้อมูลการปรับแต่งไม่พร้อมใช้งาน",
		"apm.r2019a.customizationperformance": "ประสิทธิภาพการปรับแต่ง",
		"apm.r2019a.customizationtime": "เวลาการปรับแต่ง",
		"apm.r2019a.device": "อุปกรณ์",
		"apm.r2019a.devicelistisloading": "รายการอุปกรณ์กำลังโหลด โปรดรอสักครู่",
		"apm.r2019a.devicename": "ชื่ออุปกรณ์",
		"apm.r2019a.devices": "อุปกรณ์",
		"apm.r2019a.enddatetime": "วันที่และเวลาที่สิ้นสุด",
		"apm.r2019a.event": "อีเวนต์",
		"apm.r2019a.executioncount": "จำนวนการดำเนินการ",
		"apm.r2019a.filter": "ฟิลเตอร์",
		"apm.r2019a.instances": "อินสแตนซ์",
		"apm.r2019a.location": "ตำแหน่ง",
		"apm.r2019a.locationid": "ID ตำแหน่ง",
		"apm.r2019a.locationlistisloading": "รายการตำแหน่งกำลังโหลด โปรดรอสักครู่",
		"apm.r2019a.locations": "ตำแหน่ง",
		"apm.r2019a.logid": "ID การบันทึก",
		"apm.r2019a.mostfrequent": "บ่อยที่สุด",
		"apm.r2019a.nonbundle": "ไม่รวมชุด",
		"apm.r2019a.nonbundledcomponents": "ชิ้นส่วนที่ไม่รวมชุด",
		"apm.r2019a.operations": "การทำงาน",
		"apm.r2019a.overheadtime": "เวลาโอเวอร์เฮด",
		"apm.r2019a.pacifictime": "เวลาแปซิฟิก",
		"apm.r2019a.performancedataprocessing": "ข้อมูลประสิทธิภาพกำลังประมวลผลอยู่ หากต้องการดูข้อมูลทั้งหมด โปรดรอสักครู่เพื่อให้ค่าในคอลัมน์สคริปต์อีเวนต์ของผู้ใช้และเวิร์กโฟลว์ปรากฏก่อนที่คุณจะคลิกไอคอนนี้",
		"apm.r2019a.enteravalidtotalduration": "โปรดใส่ช่วงเวลารวมที่ถูกต้อง",
		"apm.r2019a.enteravalidusereventtime": "โปรดใส่เวลาอีเวนต์ของผู้ใช้ที่ถูกต้อง",
		"apm.r2019a.enteravalidworkflowtime": "โปรดใส่เวลาเวิร์กโฟลว์ที่ถูกต้อง",
		"apm.r2019a.scisappothers": "แอป SCIS + อื่น ๆ",
		"apm.r2019a.scisbundle": "ชุดรวม SCIS",
		"apm.r2019a.servertime": "เวลาเซิร์ฟเวอร์",
		"apm.r2019a.scispermissions": "ตั้งค่าการอนุญาต SuiteCommerce InStore APM SuiteApp สำหรับบทบาทต่าง ๆ",
		"apm.r2019a.startdatetime": "วันที่และเวลาที่เริ่มต้น",
		"apm.r2019a.subsidiary": "รายการย่อย",
		"apm.r2019a.subsidiaryid": "ID รายการย่อย",
		"apm.r2019a.subsidiarylistisloading": "รายการย่อยกำลังโหลด โปรดรอสักครู่",
		"apm.r2019a.scisactionhistorydetail": "รายละเอียดประวัติการดำเนินการของ SuiteCommerce InStore",
		"apm.r2019a.scisperformancediagnostics": "การวินิจฉัยประสิทธิภาพ SuiteCommerce InStore",
		"apm.r2019a.scisperformancesetup": "การตั้งค่าประสิทธิภาพ SuiteCommerce InStore",
		"apm.r2019a.timebybundle": "เวลาตามชุดรวม",
		"apm.r2019a.timesources": "แหล่งที่มาของเวลา",
		"apm.r2019a.total95th": "รวมครั้งที่ 95",
		"apm.r2019a.totalaverage": "ค่าเฉลี่ยรวม",
		"apm.r2019a.totalduration": "ช่วงเวลารวม",
		"apm.r2019a.totaldurationandcustomizationperformance": "ช่วงเวลารวมและประสิทธิภาพการปรับแต่งเมื่อเวลาผ่านไป (เวลาแปซิฟิก)",
		"apm.r2019a.totalmedian": "ค่ามัธยฐานรวม",
		"apm.r2019a.uninstalledbundle": "ถอนการติดตั้งชุดรวมแล้ว",
		"apm.r2019a.usereventscripts": "สคริปต์อีเวนต์ของผู้ใช้",
		"apm.r2019a.usereventtime": "เวลาอีเวนต์ของผู้ใช้",
		"apm.r2019a.userlistisloading": "รายการผู้ใช้กำลังโหลด โปรดรอสักครู่",
		"apm.r2019a.valuesarestillprocessing": "ค่าที่มีเครื่องหมายขีดยาว (–) ยังคงประมวลผลอยู่ โปรดรอให้ค่าปรากฏก่อนที่คุณจะดูรายละเอียด",
		"apm.r2019a.viewchart": "ดูแผนภูมิ",
		"apm.r2019a.workflowname": "ชื่อเวิร์กโฟลว์",
		"apm.r2019a.workflowtime": "เวลาเวิร์กโฟลว์",
		"apm.r2019a.youcannotopenthispage": "คุณไม่สามารถเปิดหน้านี้ได้เพราะยังไม่ได้ติดตั้ง Application Performance (APM) SuiteApp ติดตั้ง APM SuiteApp จากนั้นลองอีกครั้ง",
		"apm.r2019a.fieldhelp": "วิธีใช้งานของช่อง",
		"apm.r2019a.whatsthis": "นี่คืออะไร",
		"apm.r2019a.daterangefieldhelp": "เลือกระยะเวลาสำหรับการดูข้อมูลประสิทธิภาพ SCIS ช่วงวันที่จะต้องมีระยะเวลาไม่เกิน 30 วัน",
		"apm.r2019a.locationfieldhelp": "เลือกตำแหน่งเพื่อโฟกัสไปที่ข้อมูลประสิทธิภาพที่บันทึกจากร้านค้าปลีกเฉพาะแห่ง",
		"apm.r2019a.subsidiaryfieldhelp": "เลือกรายการย่อยเพื่อดูข้อมูลประสิทธิภาพตามการดำเนินการที่เกิดขึ้นในรายการย่อยบางรายการ หรือรายการย่อยทั้งหมด",
		"apm.r2019a.devicefieldhelp": "ดูข้อมูลประสิทธิภาพที่บันทึกบนอุปกรณ์ที่เฉพาะเจาะจงหรืออุปกรณ์ทั้งหมดที่กำลังใช้งาน SCIS",
		"apm.r2019a.employeefieldhelp": "เลือกชื่อพนักงานเพื่อดูข้อมูลประสิทธิภาพที่เกี่ยวข้องกับธุรกรรมที่ส่งโดยพนักงานขายเฉพาะราย",
		"apm.r2019a.sortfieldhelp": "คุณสามารถจัดเรียงไทล์การดำเนินการได้ตาม บ่อยที่สุด และ เวลาในการดำเนินการสูงสุด ตัวเลือกบ่อยที่สุดจะแสดงการดำเนินการที่เกิดขึ้นบ่อยที่สุด การดำเนินการที่มีเวลาดำเนินการสูงสุดจะมีช่วงเวลารวมนานที่สุด"
    };

    return translation;
});