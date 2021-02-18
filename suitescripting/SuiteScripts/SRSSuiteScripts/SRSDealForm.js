/**
 * @author durbano
 */

function onBeforeLoad(type,form,request)
{
	if(type = 'view') {
		form.addButton('custpage_email_contacts_btn','Email Contacts', "alert('Email Contacts');");
	}
}
