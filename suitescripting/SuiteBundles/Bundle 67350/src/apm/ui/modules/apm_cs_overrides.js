/**
 * Copyright © 2019, Oracle and/or its affiliates. All rights reserved. 
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       05 Dec 2014     jmarimla         Override for view.table
 * 2.00       14 Jul 2015     jmarimla         Enable text selection on tables
 * 3.00       21 Jan 2019     jmarimla         IE11 fix
 *
 */

//IE 11 support
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(search, this_len) {
        if (this_len === undefined || this_len > this.length) {
            this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
    };
}

Ext4.override(Ext4.view.Table, { 
  /* 
    Fix for error when hovering on first row of grid 
  */ 
  getRowStyleTableElOriginal: Ext4.view.Table.prototype.getRowStyleTableEl, 
  getRowStyleTableEl: function() { 
    var el = this.getRowStyleTableElOriginal.apply(this, arguments); 
    if (!el) { 
      el = { 
        addCls: Ext4.emptyFn, 
        removeCls: Ext4.emptyFn, 
        tagName: {} 
      }; 
    } 
    return el; 
  },
  enableTextSelection: true
});
