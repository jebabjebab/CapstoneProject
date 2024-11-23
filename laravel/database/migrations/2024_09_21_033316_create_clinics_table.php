<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->string('operation_hours')->nullable();
            $table->string('specialization')->nullable();
            $table->string('phonenumber');
            $table->string('health_cards')->nullable();
            $table->string('ratings')->nullable();
            $table->string('years_of_operation')->nullable();;
            $table->string('parking_spot')->nullable();
            $table->string('clinic_type')->nullable();
            $table->string('consultation_fee')->nullable();
            $table->string('facebook_link')->nullable();
            $table->string('website_link')->nullable();
            $table->string('walk_ins')->nullable();
            $table->string('popularity')->nullable();
            $table->binary('logo')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinics');
    }
};
