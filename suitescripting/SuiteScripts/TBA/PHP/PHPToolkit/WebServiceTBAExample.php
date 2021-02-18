<?php

require_once "NetSuiteService.php";

$service = new NetSuiteService();

// Change phone number
$nscust = new Customer();
$nscust->internalId = '928242';
$nscust->phone = "(402) 123-8900";

// Send request
$updateRequest = new UpdateRequest();
$updateRequest->record = $nscust;
$updateResponse = $service->update( $updateRequest );
print_r( $updateResponse->writeResponse );
?>
