function massUpdate(recType, recId)
{
  //See ticket NS-534. Also see mass update Event Mass Update (Ken 2017-02-13)
   var rec = nlapiLoadRecord(recType, recId);
   var assignedto = rec.getFieldValue('custevent_imp_date_assigned_to');
   rec.setFieldValue('organizer', assignedto);
   nlapiSubmitRecord(rec);

}
