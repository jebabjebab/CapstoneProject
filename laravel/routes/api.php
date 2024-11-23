<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\LoginController;
use App\Http\Controllers\Api\SignupController;
use App\Http\Controllers\Api\ChatBotController;
use App\Http\Controllers\Api\ClinicsController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\WelcomeChatBotMessageController;

// eto para sa signup
Route::post('/signup', [SignupController::class, 'signup']);

// eto para sa login
Route::post('/login', [LoginController::class, 'login']);

// eto para sa otp
Route::post('/confirm-email', [PasswordResetController::class, 'sendOtp']);
Route::post('/verify-otp', [PasswordResetController::class, 'verifyOtp']);

// eto para sa password reset
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword']);

// Para sa ChatBot
Route::apiResource('/chat-bot', ChatBotController::class);

// para sa new chat button
Route::post('/new-chat', [WelcomeChatBotMessageController::class, 'createNewChat']);

//Para sa clinic data
Route::apiResource('clinics', ClinicsController::class);
// add
Route::post('/add', [ClinicsController::class, 'store']);

// eto para sa user data
Route::get('/users', [UserController::class, 'getAllUsers']);
Route::post('/update-address/{id}', [UserController::class, 'updateAddress']);

// eto built in sa laravel para sa user data
// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');
