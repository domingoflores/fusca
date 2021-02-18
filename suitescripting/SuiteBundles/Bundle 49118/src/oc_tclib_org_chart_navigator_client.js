// to suppress validation warnings in IDE
var $ = $ || null;

/** ************************ START IN-APP HELP ******************************** */
ocGlobal.tooltips = [];

/**
 * Shows the in-app help
 */
function ocHelp() {

    var helpkey = 'help';
    ocSpotlight(null, helpkey);
    return;
}

/**
 * Hides all the tooltips
 */
function ocHideHelp() {
    var logger = new ocobjLogger(arguments);
    for (var i = 0; i < ocGlobal.tooltips.length; i++) {
        try {
            ocGlobal.tooltips[i].hide();
        } catch (e) {
            logger.error(e);
        }

    }
    ocGlobal.tooltips = [];
    logger.log('end');
}

/**
 * The spotlight effect used in the in-app help
 * 
 * @param {Object}
 *        e
 * @param {Object}
 *        helpKey
 */
function ocSpotlight(e, helpKey) {

    var logger = new ocobjLogger(arguments);
    e = e || window.event;
    if (ocHasNoValue(helpKey)) {
        ocHideHelp();
        return false;
    }

    var title = '';
    var helpText = '';
    var anchor = 'top';
    var nextHelpKey = '';
    var endColor = 'FFFFFF';
    var highlight = true;

    switch (helpKey) {
    case 'whatsnew':
        title = ocGlobal.APPNAME;
        helpText = "The " + ocGlobal.APPNAME + " SuiteApp offers a visual representation of your employee organizational chart based on the employee records in NetSuite.";
        helpText += "<br/>";
        helpText += "<br/>New in this release:";
        helpText += "<ul>";
        helpText += "<li>* Zoom in and zoom out feature</li>";
        helpText += "<li>* <b>Show All Nodes</b> expands all the nodes on the organization chart.</li>";
        helpText += "<li>* <b>Show All Details</b> displays employee details on all nodes currently visible.</li>";
        helpText += "<li>* Search for an employee within the organization chart.</li>";
        helpText += "<li>* Drag anywhere on a blank space to move the organization chart.</li>";
        helpText += "<li>* Customize employee card details.</li>";
        helpText += "</ul>";
        nextHelpKey = 'zoom';
        endColor = 'D3E1F1';
        highlight = false;
        break;
    case 'help':
        title = 'Help';
        helpText = "The " + ocGlobal.APPNAME + " SuiteApp offers a visual representation of your employee organizational chart based on the employee records in NetSuite.";
        nextHelpKey = 'zoom';
        endColor = 'D3E1F1';
        highlight = false;
        break;
    case 'zoom':
        title = 'Zoom In/Out';
        helpText = 'You can zoom in up to 120% and zoom out up to 20%.';
        nextHelpKey = 'showAllNodes';
        endColor = 'D3E1F1';
        break;
    case 'showAllNodes':
        title = 'Show All Nodes';
        helpText = 'Click to expand all nodes that have the + symbol below it.';
        nextHelpKey = 'showAllDetails';
        endColor = 'D3E1F1';
        break;
    case 'showAllDetails':
        title = 'Show All Details';
        helpText = 'Click to display the details of all employee cards currently in view. ';
        nextHelpKey = 'search';
        endColor = 'D3E1F1';
        break;
    case 'search':
        title = 'Search';
        helpText = 'Enter the name of the employee you want to search for within the organization chart. You can use search symbols such as %, etc.';
        nextHelpKey = 'orgchart';
        endColor = 'D3E1F1';
        break;
    case 'orgchart':
        title = 'Organizational Chart';
        helpText = 'The organization chart initially displays 3 levels - 1 level above and 1 level below the current employee.';
        helpText += '<br/>Drag anywhere on the white space to pan through the organization chart.';
        helpText += '<br/>Click an employee card to focus on it.';
        nextHelpKey = 'employeeCard';
        anchor = 'right';
        break;
    case 'employeeCard':
        title = 'Employee Card';
        helpText = 'The employee card initially shows the name and photo of the employee.';
        helpText += '<br/>Click <b>View Record</b> to open the employee record in a new window.';
        helpText += '<br/>Click <b>More Info</b> to expand the employee card and display other information about the employee.';
        nextHelpKey = 'end';
        endColor = 'B0E0E6';
        anchor = 'right';
        break;
    case 'end':
        title = 'End of Help';
        helpText = 'That\'s it. You can now start using ' + ocGlobal.APPNAME + '.';
        endColor = 'B0E0E6';
        anchor = 'bottom';
        break;
    default:
        break;
    }

    var el = ocGetHelpElementId(helpKey);
    helpText += '<br><br>';

    // do not show Next help link for letUsKnowWhatYouThink
    if (helpKey != 'end') {
        helpText += '<a href="#" class="dottedlink smalltext" onclick="return ocSpotlight(event, \'' + nextHelpKey + '\');">Next Topic</a>';
        helpText += ' &middot; ';
    }
    // add Close link
    helpText += '<a href="#" class="dottedlink smalltext" onclick="return ocSpotlight(event, \'\');">Close</a>';

    // Don't show this message again link
    if (helpKey == 'whatsnew') {
        helpText += ' &middot; ';
        helpText += "<a href=# onclick='ocSuppressWhatsNewHelp(); return false;' class='dottedlink'>Don't show this message again</a>";
    }
    helpText += '<br><span style="height: 5px; line-height: 5px">&nbsp;</span>';

    if (ocHasValue(helpText)) {
        ocHideHelp();
        // Issue : 299337 [SuiteOrgChart] UI Reskin > Left and right portion of
        // the in-app help has no background
        helpText = '<div id="ocHelptext" style="padding: 5px">' + helpText + '</div>';
        ocSetHelp(el, title, helpText, anchor);
    }

    if (Ext.get(el) !== null) {
        if (Ext.get(el).getWidth() === 0) {
            // hidden
        } else {
            // logger.log('ttGlobal.spot.show');
            // ttGlobal.spot.show(el);
            // Stops any running effects and clears the element's internal
            // effects queue if it contains any additional effects that haven't
            // started yet.
            if (ocGlobal.lastHelpEl) {
                Ext.get(ocGlobal.lastHelpEl).stopFx();
            }

            // start effects
            if (highlight) {
                Ext.get(el).highlight("ffff9c", {
                    attr : "background-color", // can be any valid CSS property
                    // (attribute) that supports a
                    // color value
                    endColor : endColor,
                    easing : 'easeIn',
                    duration : 5
                });
            }
            ocGlobal.lastHelpEl = el;
        }
    }

    logger.log('end');
    return false;
}

/**
 * Suppresses the display of the welcome help
 */
function ocSuppressWhatsNewHelp() {
    ocHideHelp();
    uiShowInfo('To view the in-app step-by-step tutorial, click the blue question mark icon.', ocGlobal.APPNAME, 550);

    ocSuiteletProcessAsync('suppressWhatsNewHelp', 'any', function(ok) {
        if (ok == 'ok') {

        }
    });
}

/**
 * Returns the element/element id given the help key
 * 
 * @param {Object}
 *        helpKey
 */
function ocGetHelpElementId(helpKey) {
    var el;
    switch (helpKey) {
    case 'whatsnew':
        el = 'ocHelpIcon';
        break;
    case 'help':
        el = 'ocHelpIcon';
        break;
    case 'zoom':
        el = 'org-chart-zoom';
        break;
    case 'showAllNodes':
        el = 'org-chart-show-all-nodes';
        break;
    case 'showAllDetails':
        el = 'org-chart-show-all-details';
        break;
    case 'search':
        el = 'org-chart-search';
        break;
    case 'panning':
        el = 'root-table--ocRoot';
        break;
    case 'orgchart':
        el = 'root-table--ocRoot';
        break;
    case 'employeeCard':
        el = 'selectednode';
        break;
    case 'end':
        el = 'ocHelpIcon';
        break;
    default:
        throw 'not found; helpKey=' + helpKey;
    }
    return el;
}

/**
 * Displays the help for a specific element
 * 
 * @param {Object}
 *        el
 * @param {Object}
 *        title
 * @param {Object}
 *        helpContent
 * @param {Object}
 *        anchor
 * @param {Object}
 *        anchorOffset
 */
function ocSetHelp(el, title, helpContent, anchor, anchorOffset) {
    var logger = new ocobjLogger(arguments);
    logger.log('typeof el=' + typeof el);

    title = title || '';
    var target = null;
    if (typeof el == 'string') {
        if (ocHasValue(el)) {
            target = Ext.get(el).dom;
        }
    } else {
        target = el;
    }

    if (ocHasNoValue(target.id)) {
        target.id = 'random' + tcapiRandom();
    }
    if (typeof anchor == 'undefined') {
        anchor = 'top';
    }
    if (typeof anchorOffset == 'undefined') {
        anchorOffset = 0;
    }

    logger.log('target.id=' + target.id);
    var tooltip = (new Ext.ToolTip({
        title : '<img width=15px src=https://netsuite.custhelp.com/euf/assets/images/help-topics.png style="margin-top: 2px"/> ' + title,
        ids : target.id + 'Tooltip',
        target : target,
        anchor : anchor,
        html : helpContent,
        autoWidth : false,
        maxWidth : 350,
        autoHide : false,
        closable : false,
        autoShow : false,
        hideDelay : 0,
        dismissDelay : 0,
        anchorOffset : anchorOffset,
        style : {
            color : 'red'
        },
        // Issue : 299337 [SuiteOrgChart] UI Reskin > Left and right portion of
        // the in-app help has no background
        bodyStyle : 'background-color: lightyellow',
        listeners : {
            'hide' : function() {
                this.destroy();

                // if (tcapiHasValue(ttGlobal.spot)) {
                // if (ttGlobal.spot.active) {
                // ttGlobal.spot.hide();
                // }
                // }
            }
        }
    }));

    tooltip.show();

    // reposition for bottom docked since it does not properly
    if (ocGlobal.placement == 'Bottom (Docked)') {
        ttGlobal.ALLOWANCE = 10;
        var leftPos = Ext.get(target).getLeft();
        if ([ 'ttSendCommentsLink', 'tblSummaryFields' ].indexOf(target.id) > -1) {
            leftPos = leftPos - tooltip.getWidth() - ttGlobal.ALLOWANCE;
        } else {
            leftPos = leftPos + ttGlobal.ALLOWANCE;
        }
        var topPos = Ext.get(target).getTop() - tooltip.getHeight() - ocGlobal.ALLOWANCE;
        tooltip.setPosition(leftPos, topPos);
        // hide the tooltip arrow since it is difficult to set to the correct
        // position
        Ext.select('.x-tip-anchor').hide();
    }
    ocGlobal.tooltips.push(tooltip);
}

/**
 * Displays the what new help tooltip
 */
function ocWhatsNewHelp() {
    var logger = new ocobjLogger(arguments);

    try {

        if (Ext.get('ocHelpIcon') === null) {
            // help icon is hidden
            return;
        }

        if (ocGlobal.suppressWhatsNew == 'T') {
            return;
        }
        if (ocGlobal.isWhatsNewHelpShown) {
            // show only once per page load
            return;
        }
        var item = 'whatsnew';
        ocSpotlight(null, item);
        ocGlobal.isWhatsNewHelpShown = true;
    } catch (e) {
        ocHandleError(e);
    }
    logger.end();
}
/** ************************ END IN-APP HELP ******************************** */

function ocAddParentRequiredRows(parentId) {

    // parent lines
    var parentLineData = {
        parentId : parentId
    };
    var parentElId = 'td-node--' + parentId;
    jQuery('#' + parentElId + ' .org-chart-expand-or-collapse').show();
    Ext.select('#' + parentElId + ' .org-chart-show-subordinates').setStyle('display', 'none');
    var markup = "<table id='tbl-nodes-of--" + parentId + "' class='org-chart-table' cellspacing='0' style='jtable-layout: fixed; visibility: inherit'>     ";
    markup += "<tr id='tr-parent-line--" + parentId + "' class='parent-line-row'>";
    markup += ocRenderRow('tmpParentLine', parentLineData);
    markup += '</tr>';

    // child lines
    markup += "<tr id='tr-child-line--" + parentId + "' class='child-line-row'>";
    // markup += ocRenderRows('tmpChildLine', nodes);
    markup += '</tr>';

    // child nodes
    markup += "<tr id='tr-child-content--" + parentId + "' class='child-content-row'>";
    // markup += ocRenderRows('tmpChildNode', nodes);
    markup += '</tr>';
    markup += "</table>  ";

    jQuery('#' + parentElId).append(markup);

}

/**
 * Remove the top line of the 1st and last cell of the child line row
 */
function ocRemoveEndTopLines() {
    var trs = jQuery('.child-line-row');
    for (var i = 0; i < trs.length; i++) {
        var tr = trs[i];
        var tds = jQuery(tr).find('td');
        jQuery(tds[0]).removeClass('top');
        var lastIndex = tds.length - 1;
        jQuery(tds[lastIndex]).removeClass('top');
    }
}

function ocRenderRows(templateId, rows) {
    // var logger = new ocobjLogger(arguments);
    return ocTemplateApply(templateId, rows);
}

function ocRenderRow(templateId, row) {
    var rows = [ row ];
    return ocRenderRows(templateId, rows);
}

function onExpandOrCollapseClicked(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var id = target.getAttribute('data-internalid');

    ocExpandOrCollapse(target, id);
}

function ocExpandOrCollapse(target, id, expand) {
    var logger = new ocobjLogger(arguments);
    if (jQuery(target).html() == '-') {
        // collapse
        jQuery(target).html('+');
        jQuery(target).attr('title', 'Expand');
        jQuery(target).attr('data-expand-value', '+');
    } else {
        // expand
        jQuery(target).html('-');
        jQuery(target).attr('title', 'Collapse');
        jQuery(target).attr('data-expand-value', '-');

        // check if subordinates are already in the chart
        var attribute = jQuery(target).attr('data-subordinates-already-retrieved');
        if (attribute === 'false') {
            ocShowSubordinates(id);
            ocScrollToNode(target, true);
            return;
        }
    }

    var parentTable = jQuery(target).closest('[class=org-chart-node-td]')[0];
    var nodesTable = jQuery(parentTable).find('[class=org-chart-table]')[0];

    var node = jQuery(parentTable).find('[class=node]')[0];

    // get next org-chart-table
    if (jQuery(nodesTable).css('display') == 'none') {
        // expand/show
        jQuery(nodesTable).css('visibility', 'hidden');
        jQuery(nodesTable).css('display', 'table');
        //
        ocArrange();

        jQuery(nodesTable).css('display', 'none');
        jQuery(nodesTable).css('visibility', 'visible');

        logger.log('showing node');
        jQuery(nodesTable).show('slide', {
            direction : 'up'
        }, 700, function() {
            ocArrange();
            jQuery(parentTable).effect('highlight', null, 1000);
            if (ocScrollToNodeId != null) {
                ocScrollToNode(jQuery('#div--' + ocScrollToNodeId), true);
                ocScrollToNodeId = null;
            }
            ocScrollToNode(target, true);
            ocUpdateShowAllNodesLink();
        });
    } else {
        // collapse/hide
        logger.log('hiding node');
        jQuery(nodesTable).hide('slide', {
            direction : 'up'
        }, 700, function() {
            jQuery(nodesTable).css('display', 'none');
            ocArrange();
            jQuery(node).effect('highlight', null, 1000);
            ocScrollToNode(target, true);
            ocUpdateShowAllNodesLink();
        });
    }
}

function ocCreateSampleNodes(parentNodeId, numberOfNodes) {
    var nodes = [];
    for (var i = 1; i <= numberOfNodes; i++) {
        var id = parentNodeId.replace('td-node--', '') + '-' + i;
        nodes.push({
            id : id,
            name : id
        });
    }
    ocCreateNodes(parentNodeId, nodes);
}

function ocCreateRootNode(targetId, root) {
    // get template
    // var templateMarkup = jQuery('#tmpChildNode
    // .org-chart-node-td')[0].innerHTML;
    // alert(jQuery('#' + targetId).length);
    jQuery('#' + targetId).append(ocRenderRow('tmpRoot', root));
}

function ocAppendNode(parentId, child) {

    var x = Ext.get('a-expand-or-collapse--' + parentId);
    if (x !== null) {
        var d = x.dom;
        if (d.getAttribute('data-subordinates-already-retrieved') == 'false') {
            d.setAttribute('data-subordinates-already-retrieved', 'true');
            d.setAttribute('title', 'Collapse');
            d.setAttribute('data-expand-value', '-');
            x.update('-');
        }
    }
    // logger.log('td-node--'+child)
    // logger.log(jQuery('#td-node--'+child)[0])
    // logger.log(document.getElementById('td-node--'+child))

    // check if the child already exists in the page
    if (document.getElementById('td-node--' + child.id)) {
        // yes, so just append it
        ocAppendExistingNode(parentId, child.id);
        return;
    }

    // child lines
    var childLineRow = jQuery('#td-node--' + parentId).find('.child-line-row')[0];
    // logger.log('childLineRow='+childLineRow)
    if (typeof childLineRow == 'undefined') {
        ocAddParentRequiredRows(parentId);
        childLineRow = jQuery('#td-node--' + parentId).find('.child-line-row')[0];
        // ocCreateNodes(parentId, [child]);
        // return;
    }
    jQuery(childLineRow).append(ocRenderRow('tmpChildLine', child));

    // child nodes
    var currentNodes = jQuery('#tr-child-content--' + parentId);
    var childContentRow = currentNodes[0];

    if (Ext.isIE) {
        jQuery(childContentRow).append(ocRenderRow('tmpChildNodeForIe', child));
    } else {
        jQuery(childContentRow).append(ocRenderRow('tmpChildNode', child));
    }

    // // parent lines colspan
    // var nodeCount = jQuery('#tr-child-content--' + parentId + ' >
    // td').length;
    // logger.log('nodeCount='+nodeCount);
    // jQuery('#tr-parent-line--' + parentId + ' > td').attr('colspan',
    // nodeCount);

    /**
     * retrieve the subordinates but do not display yet
     */
    ocSuiteletProcessAsync('getSubordinates', child.id, function(dataSet) {
        ocGlobal.subordinatesDataSet = ocGlobal.subordinatesDataSet || {};
        ocGlobal.subordinatesDataSet[child.id] = dataSet;
        if (dataSet.subordinates.length > 0) {
            var aExpandCollapse = Ext.get('a-expand-or-collapse--' + child.id);
            if (ocGlobal.isSubTab) {
                var retrieved = aExpandCollapse.getAttribute('data-subordinates-already-retrieved');
                if (retrieved === 'false') {
                    aExpandCollapse.remove();
                } else {
                    aExpandCollapse.show();
                }
            } else {
                aExpandCollapse.show();
            }
        }

        if (ocGetExpandLinks().length > 0) {
            ocUpdateShowAllNodesLink();
        }

        ocGlobal.isRetrieving = false;
    });

    ocArrange();
    // alert(Ext.select('#org-chart-canvas
    // [data-is-new=true]').elements.length);

    Ext.select('#org-chart-canvas [data-is-new=true]').fadeIn({
        duration : 1
    }).set({
        'data-is-new' : 'false'
    });

    // Ext.select('#org-chart-canvas [data-is-new=true]').fadeIn({ duration: 1
    // }).set({'data-is-new': 'false'});

    // Ext.select('#org-chart-canvas [data-is-new=true]').slideIn('t', {
    // duration: 2
    // }).set({'data-is-new': 'false'});
    // ocRemoveEndTopLines();
}

/**
 * childId numeric id of the child
 */
function ocAppendExistingNode(parentId, childId) {

    var parentElId = 'td-node--' + parentId;
    var jParent = jQuery('#' + parentElId);
    var child = {
        internalid : childId
    };

    if (jParent === null) {
        throw 'parent is null';
    }

    var childLineRow = jParent.find('.child-line-row')[0];
    if (typeof childLineRow == 'undefined') {
        // create required
        ocAddParentRequiredRows(parentId);
    }
    childLineRow = jParent.find('.child-line-row')[0];

    if (typeof childLineRow == 'undefined') {
        ocCreateNodes(parentElId, [ child ]);
        return;
    }
    jQuery(childLineRow).append(ocRenderRow('tmpChildLine', child));

    // child nodes
    var currentNodes = jParent.find('.child-content-row');
    var childContentRow = currentNodes[0];
    var jTdChild = jQuery('#td-node--' + childId);
    jQuery(childContentRow).append(jTdChild);

    // parent lines colspan
    var nodeCount = jQuery('#tr-child-content--' + parentId + ' > td').length;
    jQuery('#tr-parent-line--' + parentId + ' > td').attr('colspan', nodeCount);

    // Check for duplicate child lines IDs. remove the 2nd duplicate to prevent
    // floating lines
    jQuery('#tr-child-line--' + parentId + ' > td').each(function() {
        var ids = jQuery('[id="' + this.id + '"]');
        if (ids.length > 1 && ids[0] == this) {
            Ext.get(ids[1]).remove();
        }
    });
    ocArrange();
}

function ocArrange(placeHolderId) {
    var logger = new ocobjLogger(arguments);

    // if(Ext.isIE){
    // jQuery('table').css('table-layout', 'fixed');
    // }

    placeHolderId = 'org-chart-canvas';
    // return;
    jQuery('#' + placeHolderId + ' td').css('width', 'auto');
    jQuery('#' + placeHolderId + ' .width-adjuster').css('width', '100%');
    jQuery('#' + placeHolderId + ' td, #' + placeHolderId + ' div').css('margin-left', '');
    var tds = jQuery('td');
    for (var i = 0; i < tds.length; i++) {
        // tds[i].title = tds[i].id || '';
    }

    // set the colspan of the parent line cells
    var childContentRows = jQuery('.child-content-row');
    var count = childContentRows.length;
    // logger.log('count=' + count);
    for (i = 0; i < count; i++) {
        // get parent line row
        var childContentRow = childContentRows[i];
        var parentLineRowElId = childContentRow.id.replace('child-content', 'parent-line');
        var parentLineRow = jQuery('#' + parentLineRowElId);
        var nodeCount = jQuery('#' + childContentRow.id + ' > td').length;
        logger.log('nodeCount=' + nodeCount);
        parentLineRow.find('td').attr('colspan', nodeCount);
    }

    tds = jQuery('.parent-line-left');
    for (i = tds.length - 1; i >= 0; i--) {
        if (jQuery(tds[i]).width() === 0) {
            continue;
        }
        if (tds[i].id.indexOf('{') > -1) {
            // this is a template
            continue;
        }
        logger.log('td.id=' + tds[i].id);

        // set the width of the left top line
        var tdLowerId = tds[i].id;
        var divUpperId = tdLowerId.replace('td-parent', 'div-child');
        var leftCellWidth = Ext.get(tdLowerId).getWidth();
        if (Ext.get(divUpperId)) {
            Ext.get(divUpperId).setWidth(leftCellWidth);
        }
        // set the width of the right top line
        tdLowerId = tdLowerId.replace('-left-', '-right-');
        divUpperId = tdLowerId.replace('td-parent', 'div-child');
        // alert(divUpperId)

        if (Ext.get(divUpperId)) {
            var rightCellWidth = Ext.get(tdLowerId).getWidth();
            Ext.get(divUpperId).setWidth(rightCellWidth);
        }

        // position div
        var divId = tds[i].id.replace('td-parent-line-left-', 'div--');
        // jQuery('#' + divId).css('margin-left', leftCellWidth - jQuery('#' +
        // divId).width() / 2);
        // Fix for not aligning the middle node properly
        var marginLeft = leftCellWidth - jQuery('#' + divId).width() / 2;
        marginLeft = parseInt(marginLeft);
        if (marginLeft < 0) {
            marginLeft = 0;
        }
        jQuery('#' + divId).css('margin-left', marginLeft);
    }

    // adjust the show parent
    if (Ext.get('div--ocRoot')) {
        Ext.get('div--ocRoot').setStyle('margin-left', '0px');
        var topMostTdWidth = Ext.get('td-parent-line-left-ocRoot').getWidth();
        var xRootLink = Ext.get('orgChartRoot');
        xRootLink.setLeft(topMostTdWidth - xRootLink.getWidth() / 2);
    }

    Ext.get('td-parent-line-left-ocRoot').removeClass('right');
    // td-parent-line-left-ocRoot
    // orgChartRoot

    ocFixBrowserFormat();
}

ocRemoveEndTopLines();

/**
 * Event handler when Show Supervisor link is clicked
 * 
 * @param event
 * @returns
 */
function onShowParentClicked(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var empId = target.getAttribute('data-internalid');
    return ocShowSupervisor(empId);
}

/**
 * Displays the supervisor of an employee and the rest of the subordinates of
 * the said supervisor
 * 
 * @param event
 */
function ocShowSupervisor(empId) {

    ocSuiteletProcessAsync('getInitialEmployeesToDisplayNavigator', empId, function(dataSet) {

        var treeTable = jQuery('#org-chart-canvas')[0].children[0];
        jQuery('#ocTempPlaceHolder').append(treeTable);
        // alert('hi');

        var supervisor = dataSet.supervisor;
        if (ocHasNoValue(supervisor)) {
            jQuery('#root-table--ocRoot').appendTo('#org-chart-canvas');

            // hide root's parent and child lines
            Ext.get('div--ocRoot').hide();
            Ext.get('tr-parent-line--ocRoot').hide();
            Ext.get('tr-child-line--ocRoot').hide();

            uiShowInfo('This employee has no supervisor.', null, 320);
            return;
        }
        // root

        // delete jQuery('#orgChartRoot')[0];
        var placeHolderId = 'org-chart-canvas';
        ocCreateRootNode(placeHolderId, {
            internalid : 'ocRoot',
            supervisor_internalid : supervisor.supervisor_internalid
        });

        // var placeHolderId = 'org-chart-canvas';
        if (ocHasValue(supervisor)) {
            ocAppendNode('ocRoot', supervisor);
            Ext.get('orgChartRoot').set({
                'data-internalid' : supervisor.internalid
            });

            // hide arrow if the new top most employee has no supervisor
            ocSuiteletProcessAsync('hasSupervisor', supervisor.internalid, function(hasSupervisor) {
                if (hasSupervisor === false) {
                    Ext.get('div--ocRoot').hide();
                    Ext.get('tr-parent-line--ocRoot').hide();
                    Ext.get('tr-child-line--ocRoot').hide();
                }
            });
        }
        // Ext.Msg.hide();
        // return;
        // supervisorSubordinates
        var supervisorSubordinates = dataSet.supervisorSubordinates;
        for (var i = 0; i < supervisorSubordinates.length; i++) {
            ocAppendNode(supervisor.internalid, supervisorSubordinates[i]);
        }

        // // hide root's parent and child lines
        // Ext.get('div--ocRoot').setStyle('display', 'none');
        // Ext.get('tr-parent-line--ocRoot').setStyle('display', 'none');
        // Ext.get('tr-child-line--ocRoot').setStyle('display', 'none');

        ocRemoveEndTopLines();
        Ext.select('#tr-parent-line--ocRoot td').setStyle('border', 'none');
        Ext.select('#tr-child-line--ocRoot td').setStyle('border', 'none');

        Ext.Msg.hide();
        if (top.Ext.get('org-chart-hour-glass')) {
            top.Ext.get('org-chart-hour-glass').dom.style.display = 'none';
        }

        jQuery('#ocTempPlaceHolder').html('');

        // var treeTable = jQuery('#placeholder2')[0].children[0];
        // alert('hi');
        // jQuery('#org-chart-canvas').append(treeTable);
        // // jQuery('#org-chart-canvas').html('');

    });
}

/**
 * Displays the subordinates of an employee
 * 
 * @param {string}
 *        empId Internal employee id
 */
function ocShowSubordinates(empId) {
    var dataSet = ocGlobal.subordinatesDataSet[empId];

    if (ocHasNoValue(dataSet)) {
        return;
    }

    // subordinates
    var subordinates = dataSet.subordinates;
    if (subordinates.length === null) {
        Ext.select('#div--' + empId + ' .org-chart-show-subordinates').setStyle('display', 'none');
        uiShowInfo('This employee has no subordinates.', null, 320);
        return;
    }

    for (var i = 0; i < subordinates.length; i++) {
        ocAppendNode(empId, subordinates[i]);
    }

    // set default avatar for those with no image
    var placeHolderId = 'org-chart-canvas';
    Ext.select('#' + placeHolderId + ' [src=]').set({
        'src' : dataSet.defaultAvatarUrl
    });
    ocRemoveEndTopLines();

    var count = ocGlobal.supervisorsToExpand.length;
    if (count === 0) {
        ocRenderMessageBoxShowAllNodes(false);
    }

    if (top.Ext.get('org-chart-hour-glass')) {
        top.Ext.get('org-chart-hour-glass').dom.style.display = 'none';
    }

    ocUpdateShowAllNodesLink();
}

function onShowSubordinatesClicked(event) {
    return ocShowSubordinates(event);
}

/**
 * Displays the details of the employee.
 * 
 * @param event
 * @returns
 */
function ocShowCardDetails(id, forceDisplay) {

    var expander = jQuery('#div--' + id + ' .org-chart-details-expander');
    var page = expander.attr('data-currentpage');

    jQuery('#div--' + id + ' .org-chart-page[data-page="0"]').css('display', 'none');
    jQuery('#div--' + id + ' .org-chart-page[data-page="1"]').css('display', 'none');

    if (ocHasValue(forceDisplay)) {
        page = (forceDisplay == 'show') ? 1 : 0;
    } else {
        page = (page == 0) ? 1 : 0;
    }

    expander.attr('data-currentpage', page);
    jQuery('#div--' + id + ' .org-chart-page[data-page="' + page + '"]').css('display', 'block');

}

function onClickShowCardDetails(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var id = target.getAttribute('data-internalid');

    ocShowCardDetails(id);
}

/**
 * Issue: 281731 Note: This function is not used for scrolling to node. function
 * ocScrollToNode2(nodeId) { // S3 - Issue 281357 : [SuiteOrgChart] Zoom +, then
 * Show All Nodes > // SuiteOrgChart disappeared var logger = new
 * ocobjLogger(arguments); if (ocHasNoValue(nodeId)) { return; } var xFrame =
 * Ext.get('org-chart-frame'); var middle = xFrame.getTop() + xFrame.getHeight() /
 * 2; var nodeTop = Ext.get(nodeId).getTop(); logger.log('middle=' + middle);
 * logger.log('nodeTop=' + nodeTop);
 * 
 * var xChart = Ext.get('root-table--ocRoot'); logger.log('xCanvass.getY()=' +
 * xChart.getY()); var newY = xChart.getY() - nodeTop + middle;
 * logger.log('newY=' + newY); // var offsets =
 * Ext.get('div--8176').getOffsetsTo('root-table--ocRoot') xChart.setY(newY); }
 */

// START - UI SCROLLING SECTION
var ocScrollToNodeId = null;
function ocScrollToNode(node, animate) {
    var logger = new ocobjLogger(arguments);

    // Locate the node inside the placeholder.
    var jqnode = jQuery(node);

    if (ocHasNoValue(jqnode)) {
        return;
    }

    var placeholder = jQuery('#org-chart-canvas');

    // Get the center of the placeholder
    var centerX = placeholder.width() / 2;
    var centerY = placeholder.height() / 2;

    // Locate the center position of node within place holder
    var padding = 5000;
    var position = jqnode.position();
    if (ocHasNoValue(position)) {
        return;
    }

    logger.log('scrolling to node = ' + node);

    var nodeCenterX = position.left + (jqnode.width() / 2) - padding;
    var nodeCenterY = position.top + (jqnode.height() / 2) - padding;

    // Compute distance from center to node center
    var distX = centerX - nodeCenterX;
    var distY = centerY - nodeCenterY;

    // Using jQuery UI, position the frame to center first.
    jQuery('#org-chart-canvas').position({
        of : '#org-chart-frame',
        my : 'center center',
        at : 'center center',
        using : function(css, calc) {
            // Animate the scrolling to the node.
            var left = css.left + distX;
            var top = css.top + distY;

            if (ocHasValue(animate) && animate) {
                jQuery(this).animate({
                    left : left,
                    top : top
                }, 500, 'swing');
            } else {
                jQuery(this).css({
                    top : top,
                    left : left
                });
            }
        }
    });
}

function ocNodeClick(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;

    // Do not scroll this if we encounter a link.
    if (jQuery(target).is('a')) {
        return true;
    }

    ocScrollToNode(jQuery(target).closest('.node'), true);

    return false;
}

function ocMakeDraggable() {
    // Make org chart draggable
    jQuery('#org-chart-canvas').draggable();
    jQuery('#org-chart-canvas').draggable('option', 'cursor', 'move');
}
// END - UI SCROLLING SECTION

var ocSearchEmployeeTimeoutId;
function onEmployeeSearchTextBoxKeyup(event) {
    var e = event || window.event;
    // Standard or IE model
    var target = e.target || e.srcElement;
    var str = target.value;

    if (ocSearchEmployeeTimeoutId) {
        clearTimeout(ocSearchEmployeeTimeoutId);
    }

    if (ocHasValue(str)) {
        jQuery('#org-chart-menu-search-cancel').css({
            'display' : 'inline',
            'visibility' : 'visible'
        });
        jQuery('#org-chart-employee-search-result-container').css({
            'visibility' : 'visible',
            'height' : jQuery('#org-chart-search-employee-select').height()
        });
    } else {
        jQuery('#org-chart-menu-search-cancel').css('visibility', 'hidden');
        jQuery('#org-chart-employee-search-result-container').css({
            'visibility' : 'hidden',
            'display' : 'none'
        });
    }

    // perform search 1 second after the user stopped typing
    var MILLISECONDS_BEFORE_SEARCHING = 1000;
    ocSearchEmployeeTimeoutId = setTimeout('ocSearchEmployeeByKeyword("' + str + '")', MILLISECONDS_BEFORE_SEARCHING);
}

/**
 * When the user selects an employee from the select list.
 * 
 * @param event
 * @returns {Boolean}
 */
function onEmployeeSearchSelectClick(element) {
    var select = element;
    var index = select.selectedIndex;
    if (index == -1) {
        return;
    }

    var searchid = select.options[index].value;
    var name = select.options[index].text;
    Ext.get('org-chart-employee-search-result-container').hide();
    Ext.get('org-chart-search-hour-glass').hide();
    if (Ext.isIE) {
        Ext.get('org-chart-search-employee-select').hide();
    }

    jQuery('#org-chart-employee-search-result-container').css('visibility', 'hidden');
    jQuery('#org-chart-employee-search-result-container').css('display', 'none');

    ocInitTree(searchid);

    return false;
}

/**
 * Searches the employee by keyword. Keyword is filtered by entityid.
 * 
 * @param event
 */
function ocSearchEmployeeByKeyword(keyword) {
    if (keyword.length == 0)
        return;

    ocShowSearchWaiting(true);

    var params = {};
    params.keyword = keyword;

    ocSuiteletProcessAsync('searchEmployeeByKeyword', params, function(response) {
        // Populate the search select field with the results
        // Then show the search select box.
        var employees = response.employees;

        ocShowSearchResults(true, employees);
        ocShowSearchWaiting(false);
        if (ocHasNoValue(employees))
            return;

        var select = document.getElementById("org-chart-search-employee-select");
        for (var i = 0; i < employees.length; i++) {
            // show only first 100 to prevent browser from freezing
            if (i == 99) {
                break;
            }

            var fullname = '';
            if (ocHasValue(employees[i].firstname))
                fullname = employees[i].firstname + ' ';

            if (ocHasValue(employees[i].lastname))
                fullname += employees[i].lastname;

            var option = document.createElement("option");
            option.value = employees[i].internalid;
            option.text = fullname;

            try {
                // for IE earlier than version 8
                select.add(option, select.options[null]);
            } catch (e) {
                select.add(option, null);
            }
        }

        if (select.options.length === 0) {
            // Ext.get('noresultsfoundrich').dom.style.display = '';
        } else {
            select.style.display = '';
            if (select.options.length > 10) {
                select.size = 10;
            } else if (select.options.length == 1) {
                // so that it will not become a dropdown
                select.size = 2;
            } else {
                select.size = select.options.length;
            }
        }

        // Coordinate also the parent div to properly show the border
        jQuery('#org-chart-employee-search-result-container').css({
            'height' : jQuery('#org-chart-search-employee-select').height()
        });
    });
}

function ocShowSearchResults(show, employees) {

    if (show) {
        jQuery('#org-chart-employee-search-result-container').css({
            'visibility' : 'visible',
            'display' : 'inline'
        });
        jQuery("#org-chart-search-employee-select").empty();

        if (ocHasNoValue(employees)) {
            // Hide select element
            jQuery('#org-chart-search-employee-select').css({
                'visibility' : 'hidden',
                'display' : 'none'
            });
            // Show no results text
            // Issue : 297529 [SuiteOrgChart] No result found does not appear on
            // the next failed search after a successful employee search
            jQuery('#org-chart-no-search-result').css({
                'visibility' : 'visible',
                'display' : 'table'
            });
        } else {
            // Show select element
            jQuery('#org-chart-search-employee-select').css({
                'visibility' : 'visible',
                'display' : 'inline'
            });
            // Hide no results text
            jQuery('#org-chart-no-search-result').css({
                'visibility' : 'hidden',
                'display' : 'none'
            });
        }
        // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
        ocFixBrowserFormat();
    } else {
        jQuery('#org-chart-employee-search-result-container').css({
            'visibility' : 'hidden',
            'display' : 'none'
        });
    }

}

/**
 * Shows a search icon beside the search textfield.
 * 
 * @param show
 *        If true, shows the search waiting icon. Otherwise, false.
 */
function ocShowSearchWaiting(show) {
    if (show) {
        jQuery('#org-chart-search-hour-glass').css('visibility', 'visible');
        jQuery('#org-chart-search-hour-glass').css('display', 'inline');
    } else {
        jQuery('#org-chart-search-hour-glass').css('visibility', 'hidden');
        jQuery('#org-chart-search-hour-glass').css('display', 'none');
    }
}

function onSearchCancelClick(event) {
    // Issue : 297659 [SuiteOrgChart] UI Reskin > Search 'X' function is not
    // working
    jQuery('#ocTextFieldSearchEmployee').val('');
    jQuery('#org-chart-menu-search-cancel').css('visibility', 'hidden');
    ocShowSearchResults(false);
}
// END - SEARCH SECTION

/** ******************************* START - ZOOM ************************** */
var ocZoomLevels = [ .2, .4, .6, .8, 1, 1.2 ];
var ocZoomLevelIndex = 4;
function onZoomInClick(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;

    ocZoomLevelIndex++;
    if (ocZoomLevelIndex >= ocZoomLevels.length) {
        ocZoomLevelIndex = ocZoomLevels.length - 1;
        uiShowInfo('Maximum zoom level has been reached.', null, 360);
        return;
    }

    ocScale('#org-chart-canvas', ocZoomLevels[ocZoomLevelIndex]);
}

function onZoomOutClick(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;

    ocZoomLevelIndex--;
    if (ocZoomLevelIndex < 0) {
        ocZoomLevelIndex = 0;
        uiShowInfo('Minimum zoom level has been reached.', null, 360);
        return;
    }

    ocScale('#org-chart-canvas', ocZoomLevels[ocZoomLevelIndex]);
}

function ocScale(selector, scale) {
    var logger = new ocobjLogger(arguments);
    var scaleCss = 'scale(' + scale + ')';
    jQuery(selector).css({
        '-webkit-transform' : scaleCss,
        '-moz-transform' : scaleCss,
        '-ms-transform' : scaleCss,
        '-o-transform' : scaleCss,
        'transform' : scaleCss
    });

    if (Ext.isIE) {
        // Ext.get('org-chart-canvas').hide();
        document.getElementById('org-chart-canvas').style['zoom'] = scale;
        ocScrollToNode(Ext.get('root-table--ocRoot').dom);
        // Ext.get('org-chart-canvas').fadeIn();
    }
}
/** ******************************* END - ZOOM ************************** */

/**
 * **************************** START - SHOW ALL NODES
 * ****************************
 */
ocGlobal.supervisorsToExpand = [];
ocGlobal.startEmpRemaining = 0;
function ocShowOrHideAllNodes() {
    // First get all visible + links first.
    var expandLinks = ocGetExpandLinks();

    // If there are any + links visible
    if (expandLinks.length <= 0) {
        // Collapse the tree.
        var selectedNodeEmpId = jQuery('#selectednode').attr('data-id');
        ocExpandOrCollapse('#a-expand-or-collapse--' + selectedNodeEmpId, selectedNodeEmpId);
        return;
    }

    var expandLinkNoData = jQuery(expandLinks).filter(function(index) {
        return (jQuery(this).attr('data-subordinates-already-retrieved') === 'false');
    });

    if (expandLinkNoData.length > 0) {
        ocGetExpansionNodesData();
        return;
    }

    // Check if there are any data already retrieved.
    var expandLinkData = jQuery(expandLinks).filter(function(index) {
        return (jQuery(this).attr('data-subordinates-already-retrieved') === 'true');
    });

    // If there are any expand links already in the tree, just show the nodes
    // only
    if (expandLinkData.length > 0) {
        ocExpandOrCollapse(expandLinks[0]);
        return;
    }
}

function ocGetExpansionNodesData() {
    ocGlobal.cancelRetrieval = false;
    ocGlobal.supervisorsToExpand = [];
    var els = Ext.select('#tbl-nodes-of--ocRoot .org-chart-expand-or-collapse').elements;
    if (els.length === 0) {
        return;
    }

    var expandExistingNodes = [];
    for (var i = 0; i < els.length; i++) {
        var el = els[i];

        if (Ext.get(el).dom.style.visibility != 'visible') {
            continue;
        }

        var empId = Ext.get(el).getAttribute('data-internalid');
        if (Ext.get(el).getAttribute('data-subordinates-already-retrieved') == 'true') {
            if (Ext.get(el).getAttribute('data-expand-value') == '+') {
                expandExistingNodes.push(empId);
            }
            continue;
        }

        ocGlobal.supervisorsToExpand.push(empId);
    }

    for (var i = 0; i < expandExistingNodes.length; i++) {
        var empId = expandExistingNodes[i];
        ocExpandOrCollapse('#a-expand-or-collapse--' + empId, empId);
    }

    ocRenderMessageBoxShowAllNodes(true, ocGlobal.supervisorsToExpand.length);

    setTimeout(ocShowNextSupervisor, ocGlobal.timeout);
}

function ocUpdateShowAllNodesLink() {
    var expandLinks = ocGetExpandLinks();
    if (expandLinks.length > 0) {
        jQuery('#org-chart-show-all-nodes a').text('Show All Nodes');
        jQuery('#org-chart-show-all-nodes a').attr('data-show-all', 'show');
    } else {
        jQuery('#org-chart-show-all-nodes a').text('Hide All Nodes');
        jQuery('#org-chart-show-all-nodes a').attr('data-show-all', 'hide');
    }

    // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
    ocFixBrowserFormat();
}

/**
 * **************************** END - SHOW ALL NODES
 * ****************************
 */

ocGlobal.isRetrieving = false;
ocGlobal.timeout = 2000;
function ocShowNextSupervisor() {
    var logger = new ocobjLogger();

    // console.clear();
    if (ocGlobal.cancelRetrieval) {
        ocGlobal.supervisorsToExpand = [];
        ocRenderMessageBoxShowAllNodes(false);
        // ocShowInfo('etrieval cancelled.')
        return;
    }

    logger.log('ocGlobal.isRetrieving=' + ocGlobal.isRetrieving);
    if (ocGlobal.isRetrieving === true) {
        // try again in a while
        setTimeout(ocShowNextSupervisor, ocGlobal.timeout);
        return;
    }

    var count = ocGlobal.supervisorsToExpand.length;
    logger.log('count=' + count);
    if (count === 0) {
        ocRenderMessageBoxShowAllNodes(false);
        return;
    }

    ocRenderMessageBoxShowAllNodes(true);
    var empId = ocGlobal.supervisorsToExpand.pop();
    logger.log('empId=' + empId);
    ocGlobal.isRetrieving = true;
    ocShowSubordinates(empId);
    ocScrollToNodeId = empId;
    setTimeout(ocShowNextSupervisor, ocGlobal.timeout);
}

function ocClearAllTimeoutCalls() {
    // Issue: 281508 [SuiteOrgChart] Loading progress animation appears twice
    // when using Show All Nodes
    if (ocHasValue(ocGlobal.ocCompleteProgressOnShowAllNodesHandle)) {
        clearInterval(ocGlobal.ocCompleteProgressOnShowAllNodesHandle);
        delete ocGlobal.ocCompleteProgressOnShowAllNodesHandle;
    }

    if (ocHasValue(ocGlobal.ocDisplayOrgChartCanvasHandle)) {
        clearInterval(ocGlobal.ocDisplayOrgChartCanvasHandle);
        delete ocGlobal.ocDisplayOrgChartCanvasHandle;
    }
}

/**
 * Renders an ExtJS MessageBox when expanding the nodes. The org chart canvas is
 * not displayed during expansion.
 * 
 * @param aShow
 *        True to show the loading screen.
 * @param aStartEmpRemaining
 *        Start count when the Show All Nodes link has been clicked.
 */
function ocRenderMessageBoxShowAllNodes(aShow, aStartEmpRemaining) {
    // Issue: 281508 [SuiteOrgChart] Loading progress animation appears twice
    // when using Show All Nodes
    ocClearAllTimeoutCalls();

    if (aShow) {
        jQuery('#org-chart-menu').hide();
        jQuery('#org-chart-canvas').hide();

        if (ocHasValue(aStartEmpRemaining)) {
            ocGlobal.startEmpRemaining = aStartEmpRemaining;
        }

        var count = ocGlobal.supervisorsToExpand.length;
        var remainEmpCount = (ocGlobal.startEmpRemaining - count);
        var progressPercent = remainEmpCount / ocGlobal.startEmpRemaining;
        var progressText = 'Remaining employees to retrieve: ' + count;

        Ext.Msg.show({
            title : 'Loading Organization Chart...',
            msg : 'This process may take a while.  Please wait while SuiteOrgChart is rendering all nodes.',
            progressText : progressText,
            width : 300,
            progress : true,
            closable : false,
            buttons : Ext.Msg.CANCEL,
            fn : function(btn, text) {
                if (btn === 'cancel') {
                    ocGlobal.cancelRetrieval = true;
                    ocCancelProgressOnShowAllNodes();
                }
            }
        }).updateProgress(progressPercent, progressText);

        // Issue : 299340 [SuiteOrgChart] UI Reskin > Upon clicking Show All
        // Nodes, a portion of the Loading Organization Chart's UI has no
        // background and Cancel button is not centered
        jQuery('.x-panel-fbar').width(jQuery('.x-window-bc').width() - 2);
        jQuery('.x-window-footer').width(jQuery('.x-window-bc').width() - 2);
    } else {
        // We set a delay to prevent scrolling twice
        // Issue: 281508 [SuiteOrgChart] Loading progress animation appears
        // twice when using Show All Nodes
        ocGlobal.ocCompleteProgressOnShowAllNodesHandle = setTimeout(ocCompleteProgressOnShowAllNodes, ocGlobal.timeout);
    }
}

/**
 * Reconstructs the org chart scrolling to the target node.
 */
function ocCompleteProgressOnShowAllNodes() {
    // Issue: 281508 [SuiteOrgChart] Loading progress animation appears twice
    // when using Show All Nodes
    ocClearAllTimeoutCalls();

    // Ext.Msg.updateProgress(1.0, 'Remaining employees to retrieve: 0');
    ocGlobal.ocDisplayOrgChartCanvasHandle = setTimeout(ocDisplayOrgChartCanvas, ocGlobal.timeout);
}

/**
 * Display Cancelling message when user presses cancel during node expansion.
 */
function ocCancelProgressOnShowAllNodes() {
    Ext.Msg.show({
        title : 'Loading Organization Chart...',
        msg : 'Please wait while your request is being cancelled.',
        progressText : 'Cancelling...',
        width : 300,
        progress : true,
        closable : false
    }).updateProgress(1.0);
    // Issue: 281508 [SuiteOrgChart] Loading progress animation appears twice
    // when using Show All Nodes
    ocClearAllTimeoutCalls();

    ocGlobal.ocDisplayOrgChartCanvasHandle = setTimeout(ocDisplayOrgChartCanvas, ocGlobal.timeout);
}

/**
 * Displays the chart canvas and hides any MessageBox displayed.
 */
function ocDisplayOrgChartCanvas() {
    Ext.Msg.hide();

    jQuery('#org-chart-canvas').show();
    ocArrange();
    ocScrollToNode('.node[data-id=' + ocScrollToNodeId + ']', false);
    jQuery('#org-chart-menu').show();
    // Issue: 281381 [SuiteOrgChart] Set Preferences > Appearance > Screen
    // ocSetClearSearchPosition();
    ocUpdateShowAllNodesLink();

    /**
     * // S3 - Issue 281357 : [SuiteOrgChart] Zoom +, then Show All Nodes > //
     * Issue: 281731 - Note: Not to be used for scrolling to node. SuiteOrgChart
     * disappeared if (ocIsChartOutsideFrame()) {
     * Ext.get('root-table--ocRoot').center(); var xCanvass =
     * Ext.get('org-chart-canvas'); xCanvass.center(); //
     * alert(ocScrollToNodeId) if (ocHasValue(ocScrollToNodeId)) {
     * ocScrollToNode2('div--' + ocScrollToNodeId); } }
     */
}

/**
 * Retrieves the number of expand links available in the current tree.
 */
function ocGetExpandLinks() {
    return jQuery('.org-chart-expand-or-collapse[data-expand-value="+"]').filter(function(index) {
        return (jQuery(this).css('visibility') === 'visible');
    });
}
/**
 * **************************** END - SHOW ALL NODES
 * ****************************
 */

/**
 * **************************** START - SHOW ALL DETAILS
 * ****************************
 */
function showAllNodesDetails(event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;

    var showOrHideLink = jQuery('#org-chart-show-all-details a');
    var forceShow = showOrHideLink.attr('data-command');

    jQuery('#org-chart-show-all-details a').css('display', 'none');
    jQuery('#org-chart-show-all-details span').css('display', 'inline');

    var length = jQuery('.node').length;
    var nodes = jQuery('.node').each(function(index) {

        if (jQuery(this).find('.org-chart-page[data-page="0"] .org-chart-details-expander').length > 0) {
            var id = jQuery(this).attr('data-id');
            if (id.indexOf('}') > -1) {
                // do not process templates
                return;
            }
            ocShowCardDetails(id, forceShow);
        }

        // because there's a template node, that's why we subtract 1 more
        if (index == (length - 2)) {
            jQuery('#org-chart-show-all-details a').css('display', 'inline');
            jQuery('#org-chart-show-all-details span').css('display', 'none');

            if (showOrHideLink.attr('data-command') === 'show') {
                showOrHideLink.attr('data-command', 'hide');
                showOrHideLink.text('Hide All Details');
            } else {
                showOrHideLink.attr('data-command', 'show');
                showOrHideLink.text('Show All Details');
            }

            // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
            ocFixBrowserFormat();
        }
    });
}
/**
 * **************************** END - SHOW ALL DETAILS
 * ****************************
 */

// START - RESIZING SECTION
function ocResizeOrgChartFrame() {
    // Issue : 295447 [SuiteOrgChart] UI Reskin > SuiteOrgChart Suitelet frame
    // (dashed line) is cropped
    // Issue : 295448 [SuiteOrgChart] UI Reskin > Employee card is not centering
    // when clicked if the window is not maximized
    // Issue : 297656 [SuiteOrgChart] UI Reskin > SuiteOrgChart Suitelet's right
    // margin is not aligned and not equal to the left
    var bodyWidth = jQuery(window).width() - 40;
    var bodyHeight = jQuery(window).height() - 195;
    // Use 458 pixel as minWidth for the frame and menu to prevent UI component
    // overlapping
    if (bodyWidth <= 458) {
        bodyWidth = 458;
    }

    // If portlet
    if (top !== self) {
        bodyHeight = 695; // To prevent the menu from going up
        bodyWidth = jQuery('#div__body').width();
        Ext.getBody().dom.style.overflow = 'hidden';
    }

    // Issue : 295447 [SuiteOrgChart] UI Reskin > SuiteOrgChart Suitelet frame
    // (dashed line) is cropped
    if (Ext.isIE) {
        // Further adjustments need to be made when using IE
        bodyHeight = bodyHeight - 3;
    }

    jQuery('#org-chart-frame').css({
        'width' : bodyWidth + 3,
        'height' : bodyHeight
    });

    jQuery('.org-chart-menu').width(bodyWidth);
    jQuery('#org-chart-menu-table').width(bodyWidth);

}

jQuery(window).resize(function() {
    ocResizeOrgChartFrame();
});
// END - RESIZING SECTION

/** ************************ START APP BUNDLE INIT *********************** */
function ocInitTree(empId) {
    ocWait('Charting');
    ocGetArtifacts();
    ocSuiteletProcessAsync('getInitialEmployeesToDisplayNavigator', empId, function(dataSet) {

        var supervisor = dataSet.supervisor;
        // root
        var placeHolderId = 'org-chart-canvas';
        Ext.get(placeHolderId).update('');
        ocCreateRootNode(placeHolderId, {
            internalid : 'ocRoot'
        });

        if (ocHasValue(supervisor)) {
            // supervisor
            ocAppendNode('ocRoot', supervisor);
            Ext.get('orgChartRoot').set({
                'data-internalid' : supervisor.internalid
            });

            // supervisorSubordinates
            var supervisorSubordinates = dataSet.supervisorSubordinates;
            for (var i = 0; i < supervisorSubordinates.length; i++) {
                ocAppendNode(supervisor.internalid, supervisorSubordinates[i]);
            }

        } else {
            // add employee
            ocAppendNode('ocRoot', dataSet.employee);
            Ext.get('orgChartRoot').set({
                'data-internalid' : empId
            });
        }

        // employeeSubordinates
        var employeeSubordinates = dataSet.employeeSubordinates;
        for (i = 0; i < employeeSubordinates.length; i++) {
            ocAppendNode(empId, employeeSubordinates[i]);
        }

        // set default avatar for those with no image
        Ext.select('#' + placeHolderId + ' [src=]').set({
            'src' : dataSet.defaultAvatarUrl
        });
        ocRemoveEndTopLines();

        Ext.Msg.hide();
        if (top.Ext.get('org-chart-hour-glass')) {
            top.Ext.get('org-chart-hour-glass').dom.style.display = 'none';
        }

        ocMakeDraggable();

        // select current employee
        Ext.select('.node[data-id=' + empId + ']').setStyle('backgroundColor', 'powderblue');
        jQuery('.node[data-id=' + empId + ']').attr('id', 'selectednode');

        ocScrollToNode(jQuery('.node[data-id=' + empId + ']'), true);

        if (ocGlobal.isSubTab) {
            jQuery('.org-chart-menu').remove();

            // To remove the Up arrow.
            Ext.select('#tr-child-line--ocRoot').remove();
            Ext.select('#div--ocRoot').remove();
        }

        // Get User Preferences
        ocGetPreferences();

    });
}

function ocGetPreferences() {
    var logger = new ocobjLogger();
    try {
        ocSuiteletProcessAsync('getPreferences', 'any', function(preference) {
            ocGlobal.suppressWhatsNew = preference.suppressWhatsNew;

            // Show What's New Help
            ocWhatsNewHelp();

        });
    } catch (e) {
        // comment next line in production
        logger.error('getPreferences > error: e=' + e);
        // throw e;
    }
}

/*
 * function ocSetClearSearchPosition() { // Issue: 281381 [SuiteOrgChart] Set
 * Preferences > Appearance > Screen // position clear link var searchLeft =
 * Ext.get('ocTextFieldSearchEmployee').getLeft(); if (top === self) { // stand
 * alone searchLeft = searchLeft - 10; // probably the bo * margin }
 * 
 * var searchWidth = Ext.get('ocTextFieldSearchEmployee').getWidth(); var xClear =
 * Ext.get('org-chart-menu-search-cancel'); xClear.setLeft(searchLeft +
 * searchWidth - xClear.getWidth() - 3 /* allowance ); }
 */

function ocGetArtifacts() {
    try {
        ocSuiteletProcessAsync('getArtifacts', 'any', function(artifacts) {
            jQuery('#org-chart-menu-zoom-plus').attr('src', artifacts.icon_plus);
            jQuery('#org-chart-menu-zoom-minus').attr('src', artifacts.icon_minus);
            jQuery('.org-chart-pipe-separator').attr('src', artifacts.pipe_separator);

            // Issue: 281381 [SuiteOrgChart] Set Preferences > Appearance >
            // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
            ocFixBrowserFormat();

            // show menu only after the images are displayed to minimize
            // incremental repainting of the screen
            Ext.get('org-chart-menu-table').show();

        });
    } catch (e) {
        // comment next line in production
        logger.error('getArtifacts > error: e=' + e);
    }
}

/**
 * Fixes browser formatting.
 */
function ocFixBrowserFormat() {

    var cancelOffsetRight = 0, cancelTop = 0, searchResultOffsetLeft = 0;
    var searchTxtFieldHeight = 0, searchTxtFieldDivHeight = 0, searchResultContainerTop = 0;
    var viewSupervisorArrowTop = 0, viewSupervisorArrowHeight = 0;

    // Fix format for Internet explorer
    if (Ext.isIE) {
        // Issue 282329 - Show arrow in supervisor has two lines.
        Ext.get('orgChartRoot').setStyle('background-color', 'white');

        // bottom of each node
        Ext.select('.org-chart-drag-background').setStyle({
            'margin-bottom' : 5
        });
        // top arrow - show supervisor
        Ext.select('#orgChartRoot').setStyle({
            'top' : 25
        });
        // connect the bottom line and the collapse/expand button
        Ext.select('.org-chart-table').setStyle({
            'margin-top' : -5
        });

        // increase node height
        Ext.select('.node').setStyle({
            'height' : 155
        });

        Ext.select('.node').setStyle({
            'width' : 98
        });

        Ext.select('.nodeContainer').setStyle({
            'width' : 98
        });

        // Fix org chart menu
        Ext.select('#org-chart-zoom a').setStyle({
            'top' : 6
        });

        Ext.select('.org-chart-pipe-separator').setStyle({
            'margin-left' : 5,
            'margin-right' : 5
        });

        // unable to remove border of select, so remove the border of its
        // container instead
        Ext.select('#org-chart-employee-search-result-container').setStyle({
            'border' : 'none',
            'background-color' : 'transparent',
            'top' : 23
        });

        // Issue : 297661 [SuiteOrgChart] UI Reskin > IE10 > Search field have 2
        // "X" when searching
        // Remove the default X cancel button of IE instead in order to maintain
        // functionality of X cancel
        // Seems IE 10 has its own X cancel button for each text field
        // Ext.select('#org-chart-menu-search-cancel').setStyle({
        // 'display' : 'none',
        // 'visibility' : 'hidden'
        // });

        // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
        if (top === self) {
            // suitelet
            cancelTop = '2px';
            cancelOffsetRight = 35;
            searchResultOffsetLeft = 20;
            searchTxtFieldDivHeight = 23;
        } else {
            // portlet
            cancelTop = '2px';
            cancelOffsetRight = 15;
            searchResultOffsetLeft = 0;
            searchTxtFieldDivHeight = 20;
        }

        // Issue 299330 : [SuiteOrgChart] Show Supervisor hovering highlight
        // does not show in IE10
        jQuery('.org-chart-view-supervisor').hover(function() {
            jQuery(this).css('background', '#99CCFF');
        }, function() {
            jQuery(this).css('background', 'transparent');
        });

        searchTxtFieldHeight = 18;
        searchResultContainerTop = 23;
        viewSupervisorArrowTop = 33;
        viewSupervisorArrowHeight = 24;
    }

    // Fix format for Firefox browsers
    if (Ext.isGecko || Ext.isGecko2 || Ext.isGecko3) {

        // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
        // Issue : 295096 [SuiteOrgChart] UI Reskin > Search fields were
        // unaligned > Search result dropdown is not aligned with search box and
        // 'X' button is outside the search box when searching an employee
        if (top === self) {
            // suitelet
            cancelTop = '2px';
            cancelOffsetRight = 35;
            searchResultOffsetLeft = 21;
        } else {
            // portlet
            cancelTop = '2px';
            cancelOffsetRight = 15;
            searchResultOffsetLeft = 0;
        }

        searchTxtFieldHeight = 22;
        searchResultContainerTop = 25;
        viewSupervisorArrowTop = 37;
        viewSupervisorArrowHeight = 25;
        searchTxtFieldDivHeight = 26;
    }

    // Fix format for Chrome browsers
    if (Ext.isChrome) {
        // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
        if (top === self) {
            // suitelet
            cancelTop = '2px';
            cancelOffsetRight = 35;
            searchResultOffsetLeft = 21;
        } else {
            // portlet
            cancelTop = '2px';
            cancelOffsetRight = 15;
            searchResultOffsetLeft = 0;
        }

        searchTxtFieldHeight = 20;
        searchResultContainerTop = 23;
        viewSupervisorArrowTop = 34;
        viewSupervisorArrowHeight = 25;
        searchTxtFieldDivHeight = 26;
    }

    // Issue : 295096 [SuiteOrgChart] UI Reskin > Search fields were unaligned >
    // Search result dropdown is not aligned with search box and 'X' button is
    // outside the search box when searching an employee
    if (Ext.isSafari) {

        if (top === self) {
            // suitelet
            cancelTop = '2px';
            cancelOffsetRight = 35;
            searchResultOffsetLeft = 21;
        } else {
            // portlet
            cancelTop = '2px';
            cancelOffsetRight = 15;
            searchResultOffsetLeft = 0;
        }

        searchTxtFieldHeight = 18;
        searchResultContainerTop = 22;
        viewSupervisorArrowTop = 34;
        viewSupervisorArrowHeight = 25;
        searchTxtFieldDivHeight = 26;
    }

    // Issue: 281938 [SuiteOrgChart] Search box was moved and "X"
    Ext.select('#org-chart-menu-search-cancel').setStyle({
        'top' : cancelTop
    });
    // Issue 290277 : [SuiteOrgChart] Subtab orgchart > Collapse is not working
    // when used twice in an employee with subordinate/supervisor
    var searchMenuCancel = Ext.get('org-chart-menu-search-cancel');
    if (ocHasValue(searchMenuCancel)) {
        searchMenuCancel.setLeft(Ext.get('ocTextFieldSearchEmployee').getRight() - cancelOffsetRight);
    }

    // Issue 290277 : [SuiteOrgChart] Subtab orgchart > Collapse is not working
    // when used twice in an employee with subordinate/supervisor
    var divEmployeeSearchResultContainer = Ext.get('org-chart-employee-search-result-container');
    if (ocHasValue(divEmployeeSearchResultContainer)) {
        divEmployeeSearchResultContainer.setLeft(Ext.get('ocTextFieldSearchEmployee').getLeft() - searchResultOffsetLeft);
    }
    jQuery('body').css('overflow', 'hidden');

    // Issue : 295091 [SuiteOrgChart] UI Reskin > SuiteOrgChart employee avatar
    // is not centered
    Ext.select('.org-chart-avatar-container').setStyle({
        'width' : '82px',
        'height' : '82px'
    });

    // Issue : 295088 [SuiteOrgChart] UI Reskin > Overlapping of texts in card
    Ext.select('.org-chart-drag-background').setStyle({
        'height' : '150px'
    });

    // Issue : 295098 [SuiteOrgChart] UI Reskin > When searching using firefox,
    // the typed text is cropped
    // Issue 290277 : [SuiteOrgChart] Subtab orgchart > Collapse is not working
    // when used twice in an employee with subordinate/supervisor
    var searchEmployeeTextField = Ext.get('ocTextFieldSearchEmployee');
    if (ocHasValue(searchEmployeeTextField)) {
        searchEmployeeTextField.setHeight(searchTxtFieldHeight + 'px');
    }
    var divEmpSearchTextField = Ext.get('org-chart-search-textfield');
    if (ocHasValue(divEmpSearchTextField)) {
        divEmpSearchTextField.setHeight(searchTxtFieldDivHeight + 'px');
    }
    // Issue : 295096 [SuiteOrgChart] UI Reskin > Search fields were unaligned >
    // Search result dropdown is not aligned with search box and 'X' button is
    // outside the search box when searching an employee
    Ext.select('#org-chart-employee-search-result-container').setStyle({
        'top' : searchResultContainerTop + 'px'
    });

    // Issue : 295083 [SuiteOrgChart] UI Reskin > Double lines on "Show
    // Supervisor" arrow
    // Issue : 297673 [SuiteOrgChart] UI Reskin > When hovering Show Supervisor,
    // the highlight overlaps with the employee card
    Ext.select('.org-chart-view-supervisor').setStyle({
        'top' : viewSupervisorArrowTop + 'px',
        'display' : 'inline-block',
        'height' : viewSupervisorArrowHeight + 'px'
    });

    // Issue : 299332 [SuiteOrgChart] IE10 > Extra line next to Show Supervisor
    // Remove vertical line that is overlapping with arrow on the supervisor
    // node
    jQuery('#tr-child-line--ocRoot td').removeClass('right');

}

/**
 * Issue: 281731 - Note: Not to be used for scrolling to node. // function
 * ocIsChartOutsideFrame() { // // S3 - Issue 281357 : [SuiteOrgChart] Zoom +,
 * then Show All Nodes > // // SuiteOrgChart disappeared // var logger = new
 * ocobjLogger(arguments); // var xChart = Ext.get('root-table--ocRoot'); // var
 * xFrame = Ext.get('org-chart-frame'); // logger.log('xChart.getLeft()=' +
 * xChart.getLeft()); // if (xChart.getLeft() > xFrame.getWidth()) { // return
 * true; // } // logger.log('xChart.getTop()=' + xChart.getTop()); // if
 * (xChart.getTop() > xFrame.getTop() + xFrame.getHeight()) { // return true; // } //
 * if (xChart.getLeft() - xChart.getWidth() < 0) { // return true; // } // if
 * (xChart.getTop() - xChart.getHeight() < 0) { // return true; // } // //
 * return false; // }
 */

/** ************************ APP BUNDLE INIT *********************** */

Ext.onReady(function() {

    if (Ext.isIE) {
        // set the frame width
        // Issue : 297649 [SuiteOrgChart] UI Reskin > IE10 > SuiteOrgChart
        // Portlet does not load
        // Issue : 297653 [SuiteOrgChart] UI Reskin > IE10 > SuiteOrgChart
        // Subtab does not load
        var width = Ext.get('div__body').getWidth();
        Ext.get('org-chart-frame').setWidth(width);
    }

    ocFixBrowserFormat();

    if (top !== self) {
        // Inside iframe (portlet), removes title and navbar
        Ext.select('.pt_container', '#org-chart-subtab').remove();
        Ext.select('#div__header', '#org-chart-subtab').remove();

        jQuery('body,#div__body,#main_form').css({
            'margin-top' : 0,
            'margin-bottom' : 0,
            'margin-right' : 0,
            'margin-left' : 0,
            'padding-top' : 0,
            'padding-bottom' : 0,
            'padding-right' : 0,
            'padding-left' : 0
        });

        jQuery('#main_form table tr:first').remove();
        jQuery('#main_form table:first,' + '#main_form table:first table:first,' + '#main_form table:first table:first table:first').css({
            'border-collapse' : 'collapse'
        });
        jQuery('#org-chart-frame').css('border', 0);

    }

    ocGlobal.empId = ocGetParameterByName('empId');
    if (ocHasNoValue(ocGlobal.empId)) {
        ocGlobal.isSubTab = false;
        ocGlobal.empId = nlapiGetContext().getUser();
    } else {
        ocGlobal.isSubTab = true;
    }

    ocResizeOrgChartFrame();

    // Get Preferences.
    ocInitTree(ocGlobal.empId);

});

//
