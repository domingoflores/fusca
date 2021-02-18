//-----------------------------------------------------------------------------------------------------------
// Copyright 2015, All rights reserved, Prolecto Resources, Inc.
//
// No part of this file may be copied or used without express, written permission of Prolecto Resources, Inc.
//-----------------------------------------------------------------------------------------------------------

Number.prototype.numberWithCommas = function(){
	 return this.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
 };
 
String.prototype.integerWithCommas = function(){
	 return Number(this).toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
 };

String.prototype.numberWithCommas = function(){
	 return Number(this).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
 };
 
String.prototype.right = function(n) {
     return this.substr((this.length-n),this.length);
};
 
 