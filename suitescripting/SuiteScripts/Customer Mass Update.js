function massUpdate(recType, recId)
{
   var rec = nlapiLoadRecord(recType, recId);
   var customform = rec.getFieldValue('customform');
   rec.setFieldValue('custentity_custom_form_srs', customform);
   nlapiSubmitRecord(rec);

}
