# Configure and send email

> In the Webrium framework, we have used the popular [PHPMailer](https://github.com/PHPMailer/PHPMailer) library for email

## Add Mail.php to index.php

To use, first edit the `index.php` file from the `public` path
Must line:

``
File::source('config',['Config.php','DB.php']);
``

Change to below:

``
File::source('config',['Config.php','DB.php','Mail.php']);
``

In fact, by doing this, you will add the `Mail.php` file to the list of config files so that it can be executed

## Email configuration
Now edit the .env file and replace your email config information there


## Email sending code example

```PHP
<?php
namespace App\Controllers;

use Webrium\Mail;

class EmailController
{

    public function sendEmail()
    {
        $mail = Mail::new();

        // from
        $mail->setFrom("fromaddress@gmail.ir", "Farakhedmat Support");

        // to
        $mail->addAddress("benkhalife@proton.me", "BEN");


        $mail->Subject = "Test Email From api";
        $mail->Body = "This is a test email sent using the test webrium";

        if (!$mail->send()) {
            echo "Mailer Error: " . $mail->ErrorInfo;
        } else {
            echo "Email sent successfully!";
        }
    }

}
```