<?php

namespace App\Http\Controllers\Api;

use App\Models\Clinics; // Ensure this is imported
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClinicsResource;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ClinicsController extends Controller
{
    public function index()
    {
        $clinics = Clinics::all();
        if ($clinics->isEmpty()) {
            return response()->json(['message' => 'No record available'], 200);
        }
        return ClinicsResource::collection($clinics);
    }

    public function store(Request $request)
    {
        // Validation rules for the clinic fields
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'latitude' => 'nullable|string|max:255',
            'longitude' => 'nullable|string|max:255',
            'operation_hours' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phonenumber' => 'required|string',
            'health_cards' => 'nullable|string|max:255',
            'ratings' => 'nullable|string',
            'years_of_operation' => 'nullable|string',
            'parking_spot' => 'nullable|string',
            'clinic_type' => 'nullable|string|max:255',
            'consultation_fee' => 'nullable|string',
            'facebook_link' => 'nullable|url',
            'website_link' => 'nullable|url',
            'walk_ins' => 'nullable|string',
            'popularity' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->messages()], 422);
        }

        // Create the clinic record
        $clinic = Clinics::create($request->all());

        // Handle logo upload if it exists
        if ($request->hasFile('logo')) {
            $logo = $request->file('logo');
            $fileName = 'clinic_' . $clinic->id . '_' . time() . '.' . $logo->getClientOriginalExtension();
            $logoPath = $logo->storeAs('ClinicLogo', $fileName, 'public');
            $clinic->update(['logo' => '/storage/' . $logoPath]);
        }

        return response()->json(['message' => 'Successfully added a new clinic data', 'data' => new ClinicsResource($clinic)], 201);
    }

    public function show(Clinics $clinic)
    {
        return new ClinicsResource($clinic);
    }

    public function update(Request $request, Clinics $clinic)
    {
        // Validation rules for updating clinic data
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'latitude' => 'nullable|string|max:255',
            'longitude' => 'nullable|string|max:255',
            'operation_hours' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'phonenumber' => 'required|string',
            'health_cards' => 'nullable|string|max:255',
            'ratings' => 'nullable|string',
            'years_of_operation' => 'nullable|string',
            'parking_spot' => 'nullable|string',
            'clinic_type' => 'nullable|string|max:255',
            'consultation_fee' => 'nullable|string',
            'facebook_link' => 'nullable|url',
            'website_link' => 'nullable|url',
            'walk_ins' => 'nullable|string',
            'popularity' => 'nullable|string',
            'logo' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->messages()], 422);
        }

        // Update the clinic details
        $clinic->update($request->except('logo')); // Exclude logo from the update

        // Handle logo update logic
        if ($request->has('logo')) {
            // Delete existing logo if it exists
            if ($clinic->logo) {
                $existingLogoPath = str_replace('/storage/', '', $clinic->logo);
                if (Storage::disk('public')->exists($existingLogoPath)) {
                    Storage::disk('public')->delete($existingLogoPath);
                }
            }

            // Handle new logo upload
            $base64Image = $request->logo; // Assuming the logo is sent as a base64 encoded string
            $image = explode(',', $base64Image)[1]; // Get the base64 part
            $image = base64_decode($image); // Decode the image
            $fileName = 'clinic_' . $clinic->id . '_' . time() . '.jpg';
            $logoPath = 'ClinicLogo/' . $fileName;
            Storage::disk('public')->put($logoPath, $image);

            $clinic->update(['logo' => '/storage/' . $logoPath]);
        }

        return response()->json(['message' => 'Clinic data updated successfully', 'data' => new ClinicsResource($clinic)], 200);
    }

    public function destroy(Clinics $clinic)
    {
        // Check and delete clinic logo if it exists
        if ($clinic->logo) {
            $logoPath = str_replace('/storage/', '', $clinic->logo);
            if (Storage::disk('public')->exists($logoPath)) {
                Storage::disk('public')->delete($logoPath);
            }
        }

        $clinic->delete();

        return response()->json(['message' => 'Clinic data has been successfully deleted'], 200);
    }
}
