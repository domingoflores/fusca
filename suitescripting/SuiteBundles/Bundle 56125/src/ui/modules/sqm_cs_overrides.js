/**
 * © 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code. 
 */

/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 Sep 2014     jmarimla         Override for view.table
 *
 */

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
  } 
});
