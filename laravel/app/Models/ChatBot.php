<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatBot extends Model
{
    use HasFactory;

    protected $table = 'chat_bot';

    protected $fillable = [
        'id',
        'user_id',
        'conversation',
    ];

    protected $casts = [
        'conversation' => 'array',
    ];
}
