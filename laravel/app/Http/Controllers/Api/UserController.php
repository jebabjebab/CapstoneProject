<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    //get all users
    public function getAllUsers()
    {
        $users = User::all();
        if ($users->isEmpty()) {
            return response()->json(['message' => 'No records available'], 200);
        }
        return UserResource::collection($users);
    }
    
    public function updateAddress(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'address' => 'required|string|max:255',
            'latitude' => 'numeric|nullable',
            'longitude' => 'numeric|nullable',
        ]);

        if ($request->input('address') === '' && 
            $request->input('latitude') === null && 
            $request->input('longitude') === null) {
            return response()->json(['message' => 'No data provided for update'], 400);
        }

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $user = User::findOrFail($id);
        $user->update([
            'address' => $request->address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return response()->json(['message' => 'User address updated successfully', 'user' => new UserResource($user)], 200);
    }
}
