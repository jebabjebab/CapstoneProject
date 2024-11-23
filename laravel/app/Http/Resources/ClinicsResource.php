<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClinicsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // return parent::toArray($request);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'operation_hours' => $this->operation_hours,
            'specialization' => $this->specialization,
            'phonenumber' => $this->phonenumber,
            'health_cards' => $this->health_cards,
            'ratings' => $this->ratings,
            'years_of_operation' => $this->years_of_operation,
            'parking_spot' => $this->parking_spot,
            'clinic_type' => $this->clinic_type,
            'consultation_fee' => $this->consultation_fee,
            'facebook_link' => $this->facebook_link,
            'website_link' => $this->website_link,
            'walk_ins' => $this->walk_ins,
            'popularity' => $this->popularity,
            //'logo' => $this->logo ? base64_encode($this->logo) : null,
            'logo' => $this->logo ? asset($this->logo) : null,
        ];
    }
}
