<?php

namespace App\Http\Controllers;

use App\Models\ChatBot;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Exception;

class WelcomeChatBotMessageController extends Controller
{
    public function createNewChat(Request $request)
    {
        // Validate the input
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->messages(),
            ], 422);
        }

        try {
            // Extract user ID
            $userId = $request->user_id;

            // Initialize a new conversation
            $conversation = [
                ['type' => 'bot', 'text' => 'Welcome! Paano kita matutulungan today?'] 
            ];

            // Create a new chat record
            $chatBot = ChatBot::create([
                'user_id' => $userId,
                'conversation' => json_encode($conversation),
            ]);

            return response()->json([
                'message' => 'New chat record created successfully',
                'data' => [
                    'conversation_id' => $chatBot->id, // Assuming 'id' is the conversation ID
                    'user_id' => $userId,
                    'conversation' => $conversation,
                ],
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'message' => 'An unexpected error occurred',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}