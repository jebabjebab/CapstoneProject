<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;


class PasswordResetController extends Controller
{
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        // Generate a random OTP
        $otp = random_int(1000, 9999);
        $email = $request->email;

        // Generate a unique token
        $token = Str::random(60);

        // Store OTP and token in the database
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['otp' => $otp, 'token' => $token, 'created_at' => now()] // Add OTP here
        );    

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = env('MAIL_HOST');  
            $mail->SMTPAuth = true;
            $mail->Username = env('MAIL_USERNAME');  
            $mail->Password = env('MAIL_PASSWORD');  
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = env('MAIL_PORT');

            // Set sender email and name
            $mail->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));

            // Recipient
            $mail->addAddress($email);

            // Email content
            $mail->isHTML(true);
            $mail->Subject = 'Your OTP Code';
            $mail->Body = 'Your OTP code is: ' . $otp;

            $mail->send();
        } catch (Exception $e) {
            return response()->json(['error' => 'OTP could not be sent. Mailer Error: ' . $mail->ErrorInfo], 500);
        }

        return response()->json(['message' => 'OTP sent to your email', 'token' => $token], 200);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'otp' => 'required|string',
            'email' => 'required|email',
            'token' => 'required|string', 
        ]);

        // Retrieve the password reset record based on the email
        $passwordReset = DB::table('password_reset_tokens')->where('email', $request->email)->first();

        if ($passwordReset) {
            // Compare the stored OTP with the provided OTP
            if ($passwordReset->otp == $request->otp) {
                return response()->json(['success' => true,'message' => 'OTP verified successfully.'], 200);
            } else {
                return response()->json(['message' => 'Invalid OTP.'], 400);
            }
        }

        return response()->json(['message' => 'OTP not found for this email.'], 404);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Retrieve the password reset record based on the email
        $passwordReset = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if ($passwordReset) {
            // Verify OTP before proceeding
            if ($passwordReset->otp != $request->otp) {
                return response()->json(['message' => 'Invalid OTP.'], 400);
            }

            // Update the user's password
            $user = User::where('email', $request->email)->first();
            if (!$user) {
                return response()->json(['message' => 'User not found.'], 404);
            }
                $user->password = Hash::make($request->password);
                $user->save();

            // Delete the data kapag success na sheesh
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();

            return response()->json(['message' => 'Password updated successfully.'], 200);
        }

        return response()->json(['message' => 'Invalid token or email.'], 400);
    }

}
