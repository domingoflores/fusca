// Scripting Buttons
// If you are going to include the button’s script directly in the .addButton then you must start it with “null;” or directly call the function. E.g.:

context.form.addButton({
 
            id: 'custpage_move_to_payment_dashboard',
 
            label: 'Promote 5B ERs',
 
            functionName: "null; if (confirm('Are you sure?')) window.location.href='" + utilURL + "'; console.log"
 
 
 
      });
 
context.form.addButton({
 
            id: 'custpage_move_to_payment_dashboard',
 
            label: 'Promote 5B ERs',
 
            functionName: 'theFunction’
 
      });


