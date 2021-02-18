<?php

class MyTokenPassportGenerator implements iTokenPassportGenerator
{
    public function generateTokenPassport() {
        $consumer_key = NS_CONSUMER_KEY; // Consumer Key shown once on Integration detail page
        $consumer_secret = NS_CONSUMER_SECRET; // Consumer Secret shown once on Integration detail page
        // following token has to be for role having those permissions: Log in using Access Tokens, Web Services
        $token = NS_TOKEN_KEY; // Token Id shown once on Access Token detail page
        $token_secret = NS_TOKEN_SECRET; // Token Secret shown once on Access Token detail page
        
        $nonce = $this->generateRandomString();// CAUTION: this sample code does not generate cryptographically secure values
        $timestamp = time();

        $baseString = urlencode(NS_ACCOUNT) ."&". urlencode($consumer_key) ."&". urlencode($token) ."&". urlencode($nonce) ."&". urlencode($timestamp);
        $secret = urlencode($consumer_secret) .'&'. urlencode($token_secret);
        $method = 'sha256'; //can be sha256   
        $signature = base64_encode(hash_hmac($method, $baseString, $secret, true));
        
        $tokenPassport = new TokenPassport();
        $tokenPassport->account = NS_ACCOUNT;
        $tokenPassport->consumerKey = $consumer_key;
        $tokenPassport->token = $token;
        $tokenPassport->nonce = $nonce;                                    
        $tokenPassport->timestamp = $timestamp; 
        $tokenPassport->signature = new TokenPassportSignature();
        $tokenPassport->signature->_ = $signature;
        $tokenPassport->signature->algorithm = "HMAC-SHA256";  //can be HMAC-SHA256
        
        return $tokenPassport;
    }

    /**
     * Not related to Token-Based Authentication, just displaying responses in this sample.
     * It is assumed (and not checked) that $timeResponse is a response of getServerTime operation.
     */
    public static function echoResponse($timeResponse) {
        if (!$timeResponse->getServerTimeResult->status->isSuccess) {
            echo "GET ERROR\n";
        } else {
            echo "GET SUCCESS, time:". $timeResponse->getServerTimeResult->serverTime. "\n";
        }
    }

    // CAUTION: it does not generate cryptographically secure values
    private function generateRandomString() {
        $length = 20;
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)]; // CAUTION: The rand function does not generate cryptographically secure values
            // Since PHP 7 the cryptographically secure random_int can be used
        }
        // echo value just in this sample to show when and how many times called
        // echo "New nonce for TokenPassport: ". $randomString. "\n";
        return $randomString;
    }
}

?>
