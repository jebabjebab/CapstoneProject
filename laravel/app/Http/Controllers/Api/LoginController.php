<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login(Request $request)
    {

        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);


        $user = User::where('email', $request->email)->first();

        // If user doesn't exist or password doesn't match
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email and Password did not match'], 401);
        }



        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id, // User ID
                'username' => $user->username, // User's username 
                'email' => $user->email // User's email
            ]
        ]);

    }
}
