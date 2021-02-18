var myDropzone = new Dropzone("#ns-upload", { url: "https://system.na2.netsuite.com/app/site/hosting/scriptlet.nl?script=1063&deploy=1"});
var myFile;
document.getElementById('ns-upload').className += " dropzone";
console.log( myDropzone );
	  myDropzone.on("success", function(uploadFile, xhr, formData) {
		  myFile = uploadFile;
		  console.log(xhr);
		  console.log(formData);

    });