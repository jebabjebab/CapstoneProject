<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clinics extends Model
{
    use HasFactory;

    protected $table = 'clinics';

    protected $fillable = [
        'name',
        'address',
        'latitude',
        'longitude',
        'operation_hours',
        'specialization',
        'phonenumber',
        'health_cards',
        'ratings',
        'years_of_operation',
        'parking_spot',
        'clinic_type',
        'consultation_fee',
        'facebook_link',
        'website_link',
        'walk_ins',
        'popularity',
        'logo'
    ];

    protected $casts = [
        'ratings' => 'float',
        'years_of_operation' => 'integer',
    ];

    /**
     * Get all the associated users for the clinic.
     */
    public function users()
    {
        return $this->hasMany(User::class); // Adjust based on your actual relationships
    }

    /**
     * Scope a query to only include clinics of a given specialization.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $specialization
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBySpecialization($query, $specialization)
    {
        return $query->where('specialization', $specialization);
    }
}
