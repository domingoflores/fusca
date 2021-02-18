 <?php 

define("NETSUITE_SCRIPT_ID", '690');
define("NETSUITE_DEPLOY_ID", '1');
define("NETSUITE_ACCOUNT", '772390_SB3');
define("NETSUITE_ACCOUNT_INURL", '772390-sb3');

define("NETSUITE_CONSUMER_KEY", 'cc38e15a4b1901fe2bd215f4cc823d');
define("NETSUITE_CONSUMER_SECRET", 'c72e8baaa1d38efe652020db31d');
define("NETSUITE_TOKEN_ID", '97bdc814ba467b255f9a97bc3e4e611a25');
define("NETSUITE_TOKEN_SECRET", '1d5da6c111fb23008cb8273fc3665c');


define("NETSUITE_URL", 'https://'.NETSUITE_ACCOUNT_INURL.'.restlets.api.netsuite.com/app/site/hosting/restlet.nl');


$data_string = '{"recordtype":"customer","records":[{"companyname":"test bputnam 01","customform":15,"entitystatus":[{"internalid":"20","name":"PROSPECT-Lead - Qualified Prospect"}]}],"module":"generic","restlet":"crud"}';

    $oauth_nonce = md5(mt_rand());
    $oauth_timestamp = time();
    $oauth_signature_method = 'HMAC-SHA256';
    $oauth_version = "1.0";

    $base_string =
        "POST&" . urlencode(NETSUITE_URL) . "&" .
        urlencode(
            "deploy=" . NETSUITE_DEPLOY_ID
          . "&oauth_consumer_key=" . NETSUITE_CONSUMER_KEY
          . "&oauth_nonce=" . $oauth_nonce
          . "&oauth_signature_method=" . $oauth_signature_method
          . "&oauth_timestamp=" . $oauth_timestamp
          . "&oauth_token=" . NETSUITE_TOKEN_ID
          . "&oauth_version=" . $oauth_version
          . "&realm=" . NETSUITE_ACCOUNT
          . "&script=" . NETSUITE_SCRIPT_ID
        );
    $sig_string = urlencode(NETSUITE_CONSUMER_SECRET) . '&' . urlencode(NETSUITE_TOKEN_SECRET);
    $signature = base64_encode(hash_hmac("sha256", $base_string, $sig_string, true));

    $auth_header = "OAuth "
        . 'oauth_signature="' . rawurlencode($signature) . '", '
        . 'oauth_version="' . rawurlencode($oauth_version) . '", '
        . 'oauth_nonce="' . rawurlencode($oauth_nonce) . '", '
        . 'oauth_signature_method="' . rawurlencode($oauth_signature_method) . '", '
        . 'oauth_consumer_key="' . rawurlencode(NETSUITE_CONSUMER_KEY) . '", '
        . 'oauth_token="' . rawurlencode(NETSUITE_TOKEN_ID) . '", '  
        . 'oauth_timestamp="' . rawurlencode($oauth_timestamp) . '", '
        . 'realm="' . rawurlencode(NETSUITE_ACCOUNT) .'"';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, NETSUITE_URL . '?&script=' . NETSUITE_SCRIPT_ID . '&deploy=' . NETSUITE_DEPLOY_ID . '&realm=' . NETSUITE_ACCOUNT);
    curl_setopt($ch, CURLOPT_POST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: ' . $auth_header,
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data_string)
    ]);

   $result = curl_exec($ch);
    echo $result;
    curl_close($ch);


 ?>
