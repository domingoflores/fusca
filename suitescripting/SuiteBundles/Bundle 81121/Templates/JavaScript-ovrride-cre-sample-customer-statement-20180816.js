Object.helloWorld = function(){
	return "hello world";
};

Number.prototype.numberWithCommas = function(){
	return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

Number.prototype.numberWithCommasNoDecimal = function(){
	return this.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

Date.prototype.mmddyyyy = function(){
	"use strict";
	var yyyy = this.getFullYear().toString(), mm = (this.getMonth() + 1).toString() // getMonth() is zero-based
	, dd = this.getDate().toString();
	return (mm[1] ? mm : "0" + mm[0]) + "/" + (dd[1] ? dd : "0" + dd[0]) + "/" + yyyy; // padding
};

Object.showDateDayMoYr = function(){
	var d = new Date();	
	var thisDate = d.getDay() + "/" + d.getMonth() + "/" + d.getFullYear();
	return thisDate;
};