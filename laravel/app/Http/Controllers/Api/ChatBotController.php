<?php

namespace App\Http\Controllers\Api;
use App\Models\Clinics;
use App\Models\ChatBot;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\ChatBotResource;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;


class ChatBotController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = $request->query('user_id'); // Optional: Get user_id from query parameters

        $chatBot = ChatBot::when($userId, function ($query) use ($userId) {
            return $query->where('user_id', $userId); // Filter by user_id if provided
        })->latest()->get();

        if ($chatBot->isEmpty()) {
            return response()->json(['message' => 'No record available'], 204);
        }

        return ChatBotResource::collection($chatBot);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the input
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'conversation' => 'required|array',
            'conversation_id' => 'nullable|exists:chat_bot,id', // Nullable for new conversations
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->messages(),
            ], 422);
        }

        // Extract data
        $userId = $request->user_id;
        $conversation = $request->conversation;
        $conversationId = $request->conversation_id;

        // Generate bot response based on the latest user message
        $botResponse = $this->generateBotResponse(end($conversation)['text'], $userId);
        // Append bot response to conversation
        $conversation[] = ['type' => 'bot', 'text' => $botResponse];

        // Check if we need to create a new chat or update an existing one
        if ($conversationId) {
            // Update the existing chat
            $chatBot = ChatBot::find($conversationId);

            if (!$chatBot) {
                return response()->json([
                    'message' => 'Chat not found',
                ], 404);
            }

            // Update the conversation in the existing chat
            $chatBot->conversation = json_encode($conversation);
            $chatBot->save();

            return response()->json([
                'message' => 'Chat updated successfully',
                'data' => [
                    'conversation_id' => $chatBot->id,
                    'user_id' => $userId,
                    'conversation' => $conversation,
                ],
            ], 200);
        } else {
            // Create a new chat if conversation_id does not exist
            $chatBot = ChatBot::create([
                'user_id' => $userId,
                'conversation' => json_encode($conversation), // Store the full conversation including bot response
            ]);

            return response()->json([
                'message' => 'New chat created successfully',
                'data' => [
                    'conversation_id' => $chatBot->id,
                    'user_id' => $userId,
                    'conversation' => $conversation,
                ],
            ], 201);
        }
    }


    private function generateBotResponse($userQuestion, $userId)
    {
        // Convert the question to lowercase and remove extra spaces for case-insensitive matching
        $lowerQuestion = preg_replace('/\s+/', ' ', mb_strtolower(trim($userQuestion), 'UTF-8'));

        // Check for Tagalog greetings first
        if (in_array($lowerQuestion, ['kamusta', 'kumusta', 'hello', 'hi'])) {
            return "Kumusta! Paano kita matutulungan ngayon?";
        }

        // Check for specific service inquiries
        if (strpos($lowerQuestion, 'diamond peel') !== false) {
            return "Ang presyo ng diamond peel ay maaaring mag-iba depende sa clinic at sa uri ng treatment. Karaniwan, ito ay nasa pagitan ng ₱1,000 hanggang ₱2,500 kada session. Makipag-ugnayan sa iyong napiling clinic para sa eksaktong presyo at kung may mga package o promosyon silang inaalok.";
        } elseif (strpos($lowerQuestion, 'fat reduction') !== false) {
            return "Ang mga klinika ay nag-aalok ng iba’t ibang non-invasive fat reduction treatments tulad ng cavitation, radio frequency, at cryolipolysis (fat freezing). Ang bawat treatment ay may sariling benepisyo at resulta, kaya’t makipag-ugnayan sa isang espesyalista para malaman ang pinakaangkop para sa iyo. Ang halaga ng bawat session ay karaniwang nasa ₱3,000 pataas.";
        } elseif (strpos($lowerQuestion, 'wart') !== false) {
            return "May mga clinic na nag-aalok ng affordable wart removal services. Ang presyo ay karaniwang nagsisimula sa ₱500 bawat butlig ngunit maaaring tumaas depende sa dami at laki ng mga warts. Mahalagang magtanong tungkol sa mga promo o discount na inaalok ng mga clinic upang makatipid.";
        } elseif (strpos($lowerQuestion, 'facial treatment') !== false) {
            return "Para sa balat na acne-prone, ang mga treatment gaya ng acne facial, chemical peel, o diamond peel ay maaring makatulong. Ang mga ito ay nakakatulong sa pag-alis ng dumi at sebo sa pores na nagdudulot ng pimples. Ang presyo ng mga treatment na ito ay nagkakahalaga ng ₱1,000 pataas kada session, depende sa klinika..";
        } elseif (strpos($lowerQuestion, 'deep skin hydration') !== false) {
            return "Ang deep skin hydration treatment ay idinisenyo upang maibalik ang moisture at glow ng balat, lalo na sa dry skin. Karaniwan itong gumagamit ng hyaluronic acid at iba pang hydrating ingredients. Ang bawat session ay karaniwang nagkakahalaga ng ₱1,500 hanggang ₱3,000, at makakakuha ng maganda at long-lasting na resulta pagkatapos ng ilang sessions.";
        }

        if(preg_match('/(mga klinika na pampubliko|mga pampublikong klinika|mga klinika ng gobyerno|mga klinika na libre|mga libreng klinika)/i', $lowerQuestion)) {
            $clinics = Clinics::where('clinic_type', 'PUBLIC')->get();
            
            if($clinics->count() > 0) {
                $user = User::find($userId);

                // Get user coordinates first
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                    $mapLink = $this->getGoogleMapsLink($clinic->address);
                    $distance = null;

                    $clinicLatitude = $clinic->latitude;
                    $clinicLongitude = $clinic->longitude;

                    if (!$clinicLatitude || !$clinicLongitude) {
                        $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                        $coordinates = $this->getLatLong($clinicLocation);
                        if ($coordinates) {
                            $clinicLatitude = $coordinates['latitude'];
                            $clinicLongitude = $coordinates['longitude'];
                        }
                    }

                    if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                        $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                        $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                    } else {
                        $distance = PHP_FLOAT_MAX;
                    }
                    
                    return [
                        'name' => $clinic->name,
                        'mapLink' => $mapLink,
                        'distance' => $distance,
                        'distanceString' => number_format($distance, 2) . " km",
                        'operation_hours' => $clinic->operation_hours,
                        'phonenumber' => $clinic->phonenumber,
                        'health_cards' => $clinic->health_cards,
                        'parking_spot' => $clinic->parking_spot,
                        'clinic_type' => $clinic->clinic_type,
                        'consultation_fee' => $clinic->consultation_fee,
                        'facebook_link' => $clinic->facebook_link,
                        'website_link' => $clinic->website_link,
                        'walk_ins' => $clinic->walk_ins,
                        'popularity' => $clinic->popularity,
                        'logo' => asset($clinic->logo),
                        'ratings' => $clinic->ratings,
                        'years_of_operation' => $clinic->years_of_operation,
                        'specialization' => $clinic->specialization,
                    ];
                })->filter()->sortBy('distance')->map(function ($clinic) {
                    return [
                        'name' => $clinic['name'],
                        'mapLink' => $clinic['mapLink'],
                        'distance' => $clinic['distanceString'],
                        'operationHours' => null,
                        'number' => null,
                        'healthCards' => null,
                        'parkingSpot' => null,
                        'clinicType' => $clinic['clinic_type'],
                        'consultationFee' => null,
                        'facebookLink' => null,
                        'websiteLink' => null,
                        'walkIn' => null,
                        'popularity' => null,
                        'logo' => $clinic['logo'],
                        'ratings' => null,
                        'years_of_operation' => null,
                        'specialization' => null,
                    ];
                })->values()->toArray();

                return [
                    'message' => "Narito ang ilang mga pampublikong klinika:",
                    'clinics' => $clinicInfo
                ];
            }
            return "Paumanhin, walang nakitang mga pampublikong klinika.";
        }

        if(preg_match('/(mga pribadong klinika|mga private na klinika|mga klinika na private|mga klinika na pribado)/i', $lowerQuestion)) {
            $clinics = Clinics::where('clinic_type', 'PRIVATE')->get();
            
            if($clinics->count() > 0) {
                $user = User::find($userId);

                // Get user coordinates first
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                    $mapLink = $this->getGoogleMapsLink($clinic->address);
                    $distance = null;

                    $clinicLatitude = $clinic->latitude;
                    $clinicLongitude = $clinic->longitude;

                    if (!$clinicLatitude || !$clinicLongitude) {
                        $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                        $coordinates = $this->getLatLong($clinicLocation);
                        if ($coordinates) {
                            $clinicLatitude = $coordinates['latitude'];
                            $clinicLongitude = $coordinates['longitude'];
                        }
                    }

                    if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                        $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                        $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                    } else {
                        $distance = PHP_FLOAT_MAX;
                    }
                    
                    return [
                        'name' => $clinic->name,
                        'mapLink' => $mapLink,
                        'distance' => $distance,
                        'distanceString' => number_format($distance, 2) . " km",
                        'operation_hours' => $clinic->operation_hours,
                        'phonenumber' => $clinic->phonenumber,
                        'health_cards' => $clinic->health_cards,
                        'parking_spot' => $clinic->parking_spot,
                        'clinic_type' => $clinic->clinic_type,
                        'consultation_fee' => $clinic->consultation_fee,
                        'facebook_link' => $clinic->facebook_link,
                        'website_link' => $clinic->website_link,
                        'walk_ins' => $clinic->walk_ins,
                        'popularity' => $clinic->popularity,
                        'logo' => asset($clinic->logo),
                        'ratings' => $clinic->ratings,
                        'years_of_operation' => $clinic->years_of_operation,
                        'specialization' => $clinic->specialization,
                    ];
                })->filter()->sortBy('distance')->map(function ($clinic) {
                    return [
                        'name' => $clinic['name'],
                        'mapLink' => $clinic['mapLink'],
                        'distance' => $clinic['distanceString'],
                        'operationHours' => null,
                        'number' => null,
                        'healthCards' => null,
                        'parkingSpot' => null,
                        'clinicType' => $clinic['clinic_type'],
                        'consultationFee' => null,
                        'facebookLink' => null,
                        'websiteLink' => null,
                        'walkIn' => null,
                        'popularity' => null,
                        'logo' => $clinic['logo'],
                        'ratings' => null,
                        'years_of_operation' => null,
                        'specialization' => null,
                    ];
                })->values()->toArray();

                return [
                    'message' => "Narito ang ilang mga pribadong klinika:",
                    'clinics' => $clinicInfo
                ];
            }
            return "Paumanhin, walang nakitang mga pribadong klinika.";
        }

        if(preg_match('/(mga klinika na tumatanggap ng walk-ins|mga klinika na tumatanggap ng walk-in|mga klinika na may walk-in|mga klinika na may walk-in po)/i', $lowerQuestion)) {
            $clinics = Clinics::where('walk_ins', '!=', null)
                             ->where('walk_ins', 'LIKE', '%Walk-ins%')
                             ->orWhere('walk_ins', 'LIKE', '%Yes%')
                             ->orWhere('walk_ins', 'LIKE', '%yes%')
                             ->orWhere('walk_ins', 'LIKE', '%Yes,%')
                             ->orWhere('walk_ins', 'LIKE', '%yes,%')
                             ->orWhere('walk_ins', 'LIKE', '%YES%')
                             ->orWhere('walk_ins', 'LIKE', '%YES,%')
                             ->get();

            if($clinics->count() > 0) {
                $user = User::find($userId);

                // Get user coordinates first
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                    $mapLink = $this->getGoogleMapsLink($clinic->address);
                    $distance = null;

                    $clinicLatitude = $clinic->latitude;
                    $clinicLongitude = $clinic->longitude;

                    if (!$clinicLatitude || !$clinicLongitude) {
                        $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                        $coordinates = $this->getLatLong($clinicLocation);
                        if ($coordinates) {
                            $clinicLatitude = $coordinates['latitude'];
                            $clinicLongitude = $coordinates['longitude'];
                        }
                    }

                    if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                        $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                        $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                    } else {
                        $distance = PHP_FLOAT_MAX;
                    }

                    return [
                        'name' => $clinic->name,
                        'mapLink' => $mapLink,
                        'distance' => $distance,
                        'distanceString' => number_format($distance, 2) . " km",
                        'operation_hours' => $clinic->operation_hours,
                        'phonenumber' => $clinic->phonenumber,
                        'health_cards' => $clinic->health_cards,
                        'parking_spot' => $clinic->parking_spot,
                        'clinic_type' => $clinic->clinic_type,
                        'consultation_fee' => $clinic->consultation_fee,
                        'facebook_link' => $clinic->facebook_link,
                        'website_link' => $clinic->website_link,
                        'walk_ins' => $clinic->walk_ins,
                        'popularity' => $clinic->popularity,
                        'logo' => asset($clinic->logo),
                        'ratings' => $clinic->ratings,
                        'years_of_operation' => $clinic->years_of_operation,
                        'specialization' => $clinic->specialization,
                    ];
                })->filter()->sortBy('distance')->map(function ($clinic) {
                    return [
                        'name' => $clinic['name'],
                        'mapLink' => $clinic['mapLink'],
                        'distance' => $clinic['distanceString'],
                        'operationHours' => null,
                        'number' => null,
                        'healthCards' => null,
                        'parkingSpot' => null,
                        'clinicType' => null,
                        'consultationFee' => null,
                        'facebookLink' => null,
                        'websiteLink' => null,
                        'walkIn' => $clinic['walk_ins'],
                        'popularity' => null,
                        'logo' => $clinic['logo'],
                        'ratings' => null,
                        'years_of_operation' => null,
                        'specialization' => null
                    ];
                })->values()->toArray();

                return [
                    'message' => "Narito ang ilang klinika na tumatanggap ng walk-ins:",
                    'clinics' => $clinicInfo
                ];
            }
            return "Paumanhin, walang nakitang klinika na tumatanggap ng walk-ins.";
        }

        if(preg_match('/(mga klinika na may mataas na rating|mga klinika na maganda ang rating|mga klinika na magaling|mga klinika na may magandang serbisyo|mga klinika na may magandang feedback)/i', $lowerQuestion)) {
            $clinics = Clinics::whereBetween('ratings', [4, 5])->get();
            
            if($clinics->count() > 0) {
                $user = User::find($userId);

                // Get user coordinates first
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                    $mapLink = $this->getGoogleMapsLink($clinic->address);
                    $distance = null;

                    $clinicLatitude = $clinic->latitude;
                    $clinicLongitude = $clinic->longitude;

                    if (!$clinicLatitude || !$clinicLongitude) {
                        $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                        $coordinates = $this->getLatLong($clinicLocation);
                        if ($coordinates) {
                            $clinicLatitude = $coordinates['latitude'];
                            $clinicLongitude = $coordinates['longitude'];
                        }
                    }

                    if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                        $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                        $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                    } else {
                        $distance = PHP_FLOAT_MAX;
                    }
                    
                    return [
                        'name' => $clinic->name,
                        'mapLink' => $mapLink,
                        'distance' => $distance,
                        'distanceString' => number_format($distance, 2) . " km",
                        'operation_hours' => $clinic->operation_hours,
                        'phonenumber' => $clinic->phonenumber,
                        'health_cards' => $clinic->health_cards,
                        'parking_spot' => $clinic->parking_spot,
                        'clinic_type' => $clinic->clinic_type,
                        'consultation_fee' => $clinic->consultation_fee,
                        'facebook_link' => $clinic->facebook_link,
                        'website_link' => $clinic->website_link,
                        'walk_ins' => $clinic->walk_ins,
                        'popularity' => $clinic->popularity,
                        'logo' => asset($clinic->logo),
                        'ratings' => $clinic->ratings,
                        'years_of_operation' => $clinic->years_of_operation,
                        'specialization' => $clinic->specialization,
                    ];
                })->filter()->sortBy('distance')->map(function ($clinic) {
                    return [
                        'name' => $clinic['name'],
                        'mapLink' => $clinic['mapLink'],
                        'distance' => $clinic['distanceString'],
                        'operationHours' => null,
                        'number' => null,
                        'healthCards' => null,
                        'parkingSpot' => null,
                        'clinicType' => null,
                        'consultationFee' => null,
                        'facebookLink' => null,
                        'websiteLink' => null,
                        'walkIn' => null,
                        'popularity' => null,
                        'logo' => $clinic['logo'],
                        'ratings' => $clinic['ratings'] . " stars",
                        'years_of_operation' => null,
                        'specialization' => null,
                    ];
                })->values()->toArray();

                return [
                    'message' => "Narito ang ilang klinika na may mataas na rating:",
                    'clinics' => $clinicInfo
                ];
            }
            return "Paumanhin, walang nakitang klinika na may mataas na rating.";
        }

        if(preg_match('/(mga klinika na tumatanggap ng health cards|mga klinika na tumatanggap ng health card|mga klinika na tumatanggap ng health card po|mga klinika na tumatanggap ng health card po)/i', $lowerQuestion)) {
            $clinics = Clinics::where('health_cards', 'ACCEPT')->get();
            
            if($clinics->count() > 0) {
                $user = User::find($userId);

                // Get user coordinates first
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                    $mapLink = $this->getGoogleMapsLink($clinic->address);
                    $distance = null;

                    $clinicLatitude = $clinic->latitude;
                    $clinicLongitude = $clinic->longitude;

                    if (!$clinicLatitude || !$clinicLongitude) {
                        $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                        $coordinates = $this->getLatLong($clinicLocation);
                        if ($coordinates) {
                            $clinicLatitude = $coordinates['latitude'];
                            $clinicLongitude = $coordinates['longitude'];
                        }
                    }

                    if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                        $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                        $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                    } else {
                        $distance = PHP_FLOAT_MAX;
                    }
                    
                    return [
                        'name' => $clinic->name,
                        'mapLink' => $mapLink,
                        'distance' => $distance,
                        'distanceString' => number_format($distance, 2) . " km",
                        'operation_hours' => $clinic->operation_hours,
                        'phonenumber' => $clinic->phonenumber,
                        'health_cards' => $clinic->health_cards,
                        'parking_spot' => $clinic->parking_spot,
                        'clinic_type' => $clinic->clinic_type,
                        'consultation_fee' => $clinic->consultation_fee,
                        'facebook_link' => $clinic->facebook_link,
                        'website_link' => $clinic->website_link,
                        'walk_ins' => $clinic->walk_ins,
                        'popularity' => $clinic->popularity,
                        'logo' => asset($clinic->logo),
                        'ratings' => $clinic->ratings,
                        'years_of_operation' => $clinic->years_of_operation,
                        'specialization' => $clinic->specialization,
                    ];
                })->filter()->sortBy('distance')->map(function ($clinic) {
                    return [
                        'name' => $clinic['name'],
                        'mapLink' => $clinic['mapLink'],
                        'distance' => $clinic['distanceString'],
                        'operationHours' => null,
                        'number' => null,
                        'healthCards' => $clinic['health_cards'],
                        'parkingSpot' => null,
                        'clinicType' => null,
                        'consultationFee' => null,
                        'facebookLink' => null,
                        'websiteLink' => null,
                        'walkIn' => null,
                        'popularity' => null,
                        'logo' => $clinic['logo'],
                        'ratings' => null,
                        'years_of_operation' => null,
                        'specialization' => null,
                    ];
                })->values()->toArray();

                return [
                    'message' => "Narito ang ilang klinika na tumatanggap ng health cards:",
                    'clinics' => $clinicInfo
                ];
            }
            return "Paumanhin, walang nakitang klinika na tumatanggap ng health cards.";
        }

        if(preg_match('/(mga klinika na may espesyalidad sa|mga klinika na may specialization sa)\s+(.*)/i', $lowerQuestion, $matches)) {
            $clinics = Clinics::all();
            if($clinics->count() > 0) {
                // Extract the specialization from the question
                $specialization = trim(str_replace($matches[1], '', $lowerQuestion));
                
                $searchTerms = ['aesthetic', 'cosmetic'];
                $query = Clinics::where(function($q) use ($specialization, $searchTerms) {
                    $q->where('specialization', 'LIKE', '%' . $specialization . '%');
                    foreach($searchTerms as $term) {
                        if(stripos($specialization, $term) !== false) {
                            $q->orWhere('specialization', 'LIKE', '%Cosmetic/Aesthetic%');
                        }
                    }
                });
                $clinics = $query->get();
                $user = User::find($userId);

                if ($clinics->count() > 0) {
                    // Get user coordinates first
                    $userLatitude = $user->latitude;
                    $userLongitude = $user->longitude;

                    if (!$userLatitude || !$userLongitude) {
                        $userLocation = $this->getGoogleMapsLink($user->address);
                        $coordinates = $this->getLatLong($userLocation);
                        if ($coordinates) {
                            $userLatitude = $coordinates['latitude'];
                            $userLongitude = $coordinates['longitude'];
                        }
                    }

                    $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                        $mapLink = $this->getGoogleMapsLink($clinic->address);
                        $distance = null;

                        $clinicLatitude = $clinic->latitude;
                        $clinicLongitude = $clinic->longitude;

                        if (!$clinicLatitude || !$clinicLongitude) {
                            $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                            $coordinates = $this->getLatLong($clinicLocation);
                            if ($coordinates) {
                                $clinicLatitude = $coordinates['latitude'];
                                $clinicLongitude = $coordinates['longitude'];
                            }
                        }

                        if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                            $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                            $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                        } else {
                            $distance = PHP_FLOAT_MAX;
                        }
                        
                        // if ($distance < 10) {
                            return [
                                'name' => $clinic->name,
                                'mapLink' => $mapLink,
                                'distance' => $distance,
                                'distanceString' => number_format($distance, 2) . " km",
                                'operation_hours' => $clinic->operation_hours,
                                'phonenumber' => $clinic->phonenumber,
                                'health_cards' => $clinic->health_cards,
                                'parking_spot' => $clinic->parking_spot,
                                'clinic_type' => $clinic->clinic_type,
                                'consultation_fee' => $clinic->consultation_fee,
                                'facebook_link' => $clinic->facebook_link,
                                'website_link' => $clinic->website_link,
                                'walk_ins' => $clinic->walk_ins,
                                'popularity' => $clinic->popularity,
                                'logo' => asset($clinic->logo),
                                'ratings' => $clinic->ratings,
                                'years_of_operation' => $clinic->years_of_operation,
                                'specialization' => $clinic->specialization,
                            ];
                        // }
                        return null;
                    })->filter()->sortBy('distance')->map(function ($clinic) {
                        return [
                            'name' => $clinic['name'],
                            'mapLink' => $clinic['mapLink'], 
                            'distance' => $clinic['distanceString'],
                            'operationHours' => null,
                            'number' => null,
                            'healthCards' => null,
                            'parkingSpot' => null,
                            'clinicType' => null,
                            'consultationFee' => null,
                            'facebookLink' => null,
                            'websiteLink' => null,
                            'walkIn' => null,
                            'popularity' => null,
                            'logo' => $clinic['logo'],
                            'ratings' => null,
                            'years_of_operation' => null,
                            'specialization' => $clinic['specialization'],
                        ];
                    })->values()->toArray();

                    return [
                        'message' => "Narito ang ilang klinika na may specialization sa " . $specialization . ":",
                        'clinics' => $clinicInfo
                    ];
                } else {
                    return "Paumanhin, hindi ako makahanap ng anumang klinika na may specialization sa " . $specialization . ".";
                }
            }
            return "Paumanhin, walang nakitang klinika na may specialization tungkol sa iyong tanong.";
        }

        if (preg_match('/(mga klinika na may parking spot|mga klinika na may paradahan|mga klinika na may paradahan po|mga klinika na may parking spot po)/i', $lowerQuestion)) {
            $clinics = Clinics::all();
            if ($clinics->count() > 0) {
                $clinics = Clinics::where('parking_spot', 'YES')->get();
                $user = User::find($userId);

                if ($clinics->count() > 0) {
                    // Get user coordinates first
                    $userLatitude = $user->latitude;
                    $userLongitude = $user->longitude;

                    if (!$userLatitude || !$userLongitude) {
                        $userLocation = $this->getGoogleMapsLink($user->address);
                        $coordinates = $this->getLatLong($userLocation);
                        if ($coordinates) {
                            $userLatitude = $coordinates['latitude'];
                            $userLongitude = $coordinates['longitude'];
                        }
                    }

                    $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                        $mapLink = $this->getGoogleMapsLink($clinic->address);
                        $distance = null;

                        $clinicLatitude = $clinic->latitude;
                        $clinicLongitude = $clinic->longitude;

                        if (!$clinicLatitude || !$clinicLongitude) {
                            $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                            $coordinates = $this->getLatLong($clinicLocation);
                            if ($coordinates) {
                                $clinicLatitude = $coordinates['latitude'];
                                $clinicLongitude = $coordinates['longitude'];
                            }
                        }

                        if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                            $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                            $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                        } else {
                            $distance = PHP_FLOAT_MAX;
                        }

                        // if ($distance < 10) {
                        return [
                            'name' => $clinic->name,
                            'mapLink' => $mapLink,
                            'distance' => $distance,
                            'distanceString' => number_format($distance, 2) . " km",
                            'operation_hours' => $clinic->operation_hours,
                            'phonenumber' => $clinic->phonenumber,
                            'health_cards' => $clinic->health_cards,
                            'parking_spot' => $clinic->parking_spot,
                            'clinic_type' => $clinic->clinic_type,
                            'consultation_fee' => $clinic->consultation_fee,
                            'facebook_link' => $clinic->facebook_link,
                            'website_link' => $clinic->website_link,
                            'walk_ins' => $clinic->walk_ins,
                            'popularity' => $clinic->popularity,
                            'logo' => asset($clinic->logo),
                            'ratings' => $clinic->ratings,
                            'years_of_operation' => $clinic->years_of_operation,
                            'specialization' => $clinic->specialization,
                        ];
                        // }
                        return null;
                    })->filter()->sortBy('distance')->map(function ($clinic) {
                        return [
                            'name' => $clinic['name'],
                            'mapLink' => $clinic['mapLink'],
                            'distance' => $clinic['distanceString'],
                            'operationHours' => null,
                            'number' => null,
                            'healthCards' => null,
                            'parkingSpot' => $clinic['parking_spot'],
                            'clinicType' => null,
                            'consultationFee' => null,
                            'facebookLink' => null,
                            'websiteLink' => null,
                            'walkIn' => null,
                            'popularity' => null,
                            'logo' => $clinic['logo'],
                            'ratings' => null,
                            'years_of_operation' => null,
                            'specialization' => null,
                        ];
                    })->values()->toArray();

                    return [
                        'message' => "Narito ang ilang klinika na may parking spot:",
                        'clinics' => $clinicInfo
                    ];
                } else {
                    return "Paumanhin, hindi ako makahanap ng anumang na may parking spot.";
                }
            }
            return "Paumanhin, walang nakitang klinika na may parking spot.";
        }

        if (preg_match('/(may parking spot ba ang|may parking spot po ba ang|may parking spot ang|may parking spot po ang)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                if ($clinic->parking_spot == 'YES') {
                    return "Ang " . $clinic->name . " ay may parking spot.";
                } else {
                    return "Ang " . $clinic->name . " ay walang parking spot.";
                }
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        if (preg_match('/(anong oras ang bukas ng|oras ng bukas ng|kailan bukas ang|kailan magbubukas ang|anong oras magbubukas ang|bukas ng|bukas)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang bukas ng " . $clinic->name . " ay " . $clinic->operation_hours;
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        if (preg_match('/(magkano ang bayad sa konsultasyon sa|magkano ang bayad sa pagkonsulta sa|magkano ang singil sa pagkonsulta sa|magkano ang singil sa konsultasyon sa)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang consultation fee sa " . $clinic->name . " ay " . $clinic->consultation_fee;
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // New Questions

        // For asking about health cards accepted
        if (preg_match('/(tumatanggap ba ng health card ang|may health card ba sa)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                if ($clinic->health_cards === 'DONT_ACCEPT') {
                    return "Paumanhin, ang " . $clinic->name . " ay hindi tumatanggap ng health cards.";
                }
                return "Ang " . $clinic->name . " ay tumatanggap ng health cards.";
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about clinic specialization
        if (preg_match('/(ano ang specialization ng|ano ang expertise ng|saan magaling ang|anong uri ng serbisyo ang meron sa)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang " . $clinic->name . " ay espesyalista sa " . $clinic->specialization;
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about contact number
        if (preg_match('/(ano ang numero ng|anong number ng|paano kontakin ang|ano ang contact number ng)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang contact number ng " . $clinic->name . " ay " . $clinic->phonenumber;
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about walk-in acceptance
        if (preg_match('/(tumatanggap ba ng walk in ang|pwede bang pumunta ng walang appointment sa|pwede bang magpakonsulta ng diretso sa)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                if ($clinic->walk_ins == 'YES') {
                    return "Oo, tumatanggap ang " . $clinic->name . " ng walk-in patients.";
                } else {
                    return "Hindi, kailangan ng appointment sa " . $clinic->name . ".";
                }
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about years of operation
        if (preg_match('/(ilang taon na ang|gaano na katagal ang|kailan pa nagsimula ang)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang " . $clinic->name . " ay " . $clinic->years_of_operation . " taon na sa serbisyo.";
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about clinic ratings
        if (preg_match('/(ano ang rating ng|gaano kagaling ang|maganda ba ang serbisyo ng|kumusta ang serbisyo ng)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang " . $clinic->name . " ay may rating na " . $clinic->ratings . " stars.";
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about clinic type/category
        if (preg_match('/(anong uri ng klinika ang|anong klaseng klinika ang|anong kategorya ng klinika ang)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang " . $clinic->name . " ay isang " . $clinic->clinic_type . ".";
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about clinic social media/website
        if (preg_match('/(may facebook page ba ang|may website ba ang|saan makikita online ang)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            $user = User::find($userId);

            if ($clinic) {
                // Get user coordinates
                $userLatitude = $user->latitude;
                $userLongitude = $user->longitude;

                if (!$userLatitude || !$userLongitude) {
                    $userLocation = $this->getGoogleMapsLink($user->address);
                    $coordinates = $this->getLatLong($userLocation);
                    if ($coordinates) {
                        $userLatitude = $coordinates['latitude'];
                        $userLongitude = $coordinates['longitude'];
                    }
                }

                // Get clinic coordinates
                $clinicLatitude = $clinic->latitude;
                $clinicLongitude = $clinic->longitude;

                if (!$clinicLatitude || !$clinicLongitude) {
                    $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                    $coordinates = $this->getLatLong($clinicLocation);
                    if ($coordinates) {
                        $clinicLatitude = $coordinates['latitude'];
                        $clinicLongitude = $coordinates['longitude'];
                    }
                }

                // Calculate distance
                $distance = null;
                if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                    $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                    $distance = $distance ? number_format($distance, 2) . " km" : "Hindi matukoy ang distansya";
                } else {
                    $distance = "Hindi matukoy ang distansya";
                }

                // Generate map link
                $mapLink = $this->getGoogleMapsLink($clinic->address);

                return [
                    'message' => "Narito ang mga online na detalye ng " . $clinic->name . ":",
                    'clinics' => [
                        [
                            'name' => $clinic->name,
                            'facebookLink' => $clinic->facebook_link,
                            'websiteLink' => $clinic->website_link,
                            'mapLink' => $mapLink,
                            'logo' => asset($clinic->logo),
                            'distance' => $distance
                        ]
                    ]
                ];
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }

        // For asking about clinic popularity/patient volume
        if (preg_match('/(gaano ka popular ang|marami bang pasyente sa|gaano kadaming tao sa)\s+(.+)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';
            $clinic = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->first();
            if ($clinic) {
                return "Ang " . $clinic->name . " ay may popularity rating na " . $clinic->popularity . " base sa dami ng pasyente.";
            }
            return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
        }




        // Extract the clinic name from the user's question
        if (preg_match('/(saan ang|ano ang|find|search)\s*(.*)/i', $lowerQuestion, $matches)) {
            $searchTerm = isset($matches[2]) ? trim($matches[2]) : '';

            // Fetch clinics from the database
            $clinics = Clinics::where('name', 'LIKE', '%' . $searchTerm . '%')->get();
            $user = User::find($userId);

            if ($clinics->count() > 0) {
                // Get user location
                $userLocation = $this->getUserLocation($user);

                // Map clinic information
                $clinicInfo = $clinics->map(function ($clinic) use ($userLocation) {
                    return $this->getClinicDetails($clinic, $userLocation);
                })->sortBy('distance')->values()->toArray();

                return [
                    'message' => "Narito ang mga detalye ng klinika na iyong hinahanap:",
                    'clinics' => $clinicInfo
                ];
            } else {
                return "Paumanhin, walang nakitang klinika na tumutugma sa iyong paghahanap.";
            }
        }

        // Check if the question is in Tagalog
        if ($this->isTagalog($lowerQuestion)) {
            // Array of Tagalog phrases asking about nearby clinics
            $clinicQuestions = [
                '/saan\s.*klinika/',
                '/malapit\s.*klinika/',
                '/klinika\s.*malapit/',
                '/saan\s.*ospital/',
                '/ospital\s.*malapit/',
                '/health center/',
                '/klinikang\s.*malapit/',
                '/may\s.*klinika\s.*malapit/',
            ];

            // Check if the question contains any of the clinic-related phrases
            foreach ($clinicQuestions as $regex) {
                if (preg_match($regex, $lowerQuestion)) {
                    $clinics = Clinics::all();
                    $user = User::find($userId);

                    if ($clinics->count() > 0) {
                        // Get user coordinates first
                        $userLatitude = $user->latitude;
                        $userLongitude = $user->longitude;

                        if (!$userLatitude || !$userLongitude) {
                            $userLocation = $this->getGoogleMapsLink($user->address);
                            $coordinates = $this->getLatLong($userLocation);
                            if ($coordinates) {
                                $userLatitude = $coordinates['latitude'];
                                $userLongitude = $coordinates['longitude'];
                            }
                        }

                        $clinicInfo = $clinics->map(function ($clinic) use ($userLatitude, $userLongitude) {
                            $mapLink = $this->getGoogleMapsLink($clinic->address);
                            $distance = null;

                            $clinicLatitude = $clinic->latitude;
                            $clinicLongitude = $clinic->longitude;

                            if (!$clinicLatitude || !$clinicLongitude) {
                                $clinicLocation = $this->getGoogleMapsLink($clinic->address);
                                $coordinates = $this->getLatLong($clinicLocation);
                                if ($coordinates) {
                                    $clinicLatitude = $coordinates['latitude'];
                                    $clinicLongitude = $coordinates['longitude'];
                                }
                            }

                            if ($userLatitude && $userLongitude && $clinicLatitude && $clinicLongitude) {
                                $distance = $this->calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude);
                                $distance = $distance ? floatval($distance) : PHP_FLOAT_MAX;
                            } else {
                                $distance = PHP_FLOAT_MAX;
                            }

                            if ($distance < 10) {
                                return [
                                    'name' => $clinic->name,
                                    'mapLink' => $mapLink,
                                    'distance' => $distance,
                                    'distanceString' => number_format($distance, 2) . " km",
                                    'operation_hours' => $clinic->operation_hours,
                                    'phonenumber' => $clinic->phonenumber,
                                    'health_cards' => $clinic->health_cards,
                                    'parking_spot' => $clinic->parking_spot,
                                    'clinic_type' => $clinic->clinic_type,
                                    'consultation_fee' => $clinic->consultation_fee,
                                    'facebook_link' => $clinic->facebook_link,
                                    'website_link' => $clinic->website_link,
                                    'walk_ins' => $clinic->walk_ins,
                                    'popularity' => $clinic->popularity,
                                    'logo' => asset($clinic->logo),
                                    'ratings' => $clinic->ratings,
                                    'years_of_operation' => $clinic->years_of_operation,
                                    'specialization' => $clinic->specialization,
                                ];
                            }
                            return null;
                        })->filter()->sortBy('distance')->map(function ($clinic) {
                            return [
                                'name' => $clinic['name'],
                                'mapLink' => $clinic['mapLink'],
                                'distance' => $clinic['distanceString'],
                                'operationHours' => $clinic['operation_hours'],
                                'number' => $clinic['phonenumber'],
                                'healthCards' => $clinic['health_cards'],
                                'parkingSpot' => $clinic['parking_spot'],
                                'clinicType' => $clinic['clinic_type'],
                                'consultationFee' => $clinic['consultation_fee'],
                                'facebookLink' => $clinic['facebook_link'],
                                'websiteLink' => $clinic['website_link'],
                                'walkIn' => $clinic['walk_ins'],
                                'popularity' => $clinic['popularity'],
                                'logo' => $clinic['logo'],
                                'ratings' => $clinic['ratings'],
                                'years_of_operation' => $clinic['years_of_operation'],
                                'specialization' => $clinic['specialization'],
                            ];
                        })->values()->toArray();

                        if (empty($clinicInfo)) {
                            return "Paumanhin, walang nakitang klinika na malapit sa iyong lugar.";
                        }

                        return [
                            'message' => "Narito ang ilang klinika malapit sa iyo:",
                            'clinics' => $clinicInfo
                        ];
                    } else {
                        return "Paumanhin, hindi ako makahanap ng anumang klinika sa malapit.";
                    }
                }
            }



            // Default response for other Tagalog questions
            return "Paumanhin, hindi ko lubos na naiintindihan ang iyong tanong. Maaari mo bang ipaliwanag muli o magtanong ng iba?";
        } else {
            // Response for English or non-Tagalog input
            return "Paumanhin, ang aming chatbot ay tumutugon lamang sa mga tanong sa wikang Tagalog. Maaari po bang magtanong kayo sa Tagalog? (We apologize, our chatbot only responds to questions in Tagalog. Could you please ask your question in Tagalog?)";
        }
    }

    // Helper function to detect if the input is in Tagalog
    private function isTagalog($text)
    {
        // List of common Tagalog words (expanded)
        $tagalogWords = [
            'ako',
            'ikaw',
            'siya',
            'kami',
            'tayo',
            'kayo',
            'sila',
            'ang',
            'ng',
            'sa',
            'na',
            'at',
            'ay',
            'po',
            'opo',
            'hindi',
            'oo',
            'ba',
            'mo',
            'ko',
            'niya',
            'namin',
            'natin',
            'ninyo',
            'nila',
            'ito',
            'iyan',
            'iyon',
            'dito',
            'diyan',
            'doon',
            'ano',
            'sino',
            'kanino',
            'saan',
            'kailan',
            'bakit',
            'paano',
            'kumusta',
            'salamat',
            'kamusta',
            'meron',
            'malapit',
            'sakin',
            'ano',
            'paano'
        ];

        $words = str_word_count(mb_strtolower($text, 'UTF-8'), 1);
        $tagalogWordCount = count(array_intersect($words, $tagalogWords));

        // If more than 20% of the words are Tagalog, consider it a Tagalog sentence
        return ($tagalogWordCount / count($words)) > 0.2;
    }

    // Helper function to get user location
    private function getUserLocation($user)
    {
        $userLatitude = $user->latitude;
        $userLongitude = $user->longitude;

        // Handle user location if coordinates are not set
        if (!$userLatitude || !$userLongitude) {
            $userLocation = $this->getGoogleMapsLink($user->address);
            $coordinates = $this->getLatLong($userLocation);
            if ($coordinates) {
                $userLatitude = $coordinates['latitude'];
                $userLongitude = $coordinates['longitude'];
            }
        }

        return [
            'latitude' => $userLatitude,
            'longitude' => $userLongitude,
        ];
    }

    // Helper function to get clinic details
    private function getClinicDetails($clinic, $userLocation)
    {
        $mapLink = $this->getGoogleMapsLink($clinic->address);

        // Set clinic coordinates if not available
        $clinicLatitude = $clinic->latitude;
        $clinicLongitude = $clinic->longitude;

        // Calculate distance if both user and clinic coordinates are available
        $distance = $this->calculateDistance(
            $userLocation['latitude'],
            $userLocation['longitude'],
            $clinicLatitude,
            $clinicLongitude
        );

        return [
            'name' => $clinic->name,
            'mapLink' => $mapLink,
            'distance' => $distance < PHP_FLOAT_MAX ? number_format($distance, 2) . " km" : "Hindi matukoy ang distansya",
            'operationHours' => $clinic->operation_hours,
            'number' => $clinic->phonenumber,
            'healthCards' => $clinic->health_cards,
            'parkingSpot' => $clinic->parking_spot,
            'clinicType' => $clinic->clinic_type,
            'consultationFee' => $clinic->consultation_fee,
            'facebookLink' => $clinic->facebook_link,
            'websiteLink' => $clinic->website_link,
            'walkIn' => $clinic->walk_ins,
            'popularity' => $clinic->popularity,
            'logo' => asset($clinic->logo),
            'ratings' => $clinic->ratings,
            'years_of_operation' => $clinic->years_of_operation,
            'specialization' => $clinic->specialization,
        ];
    }

    // Helper function to generate Google Maps link
    private function getGoogleMapsLink($address)
    {
        $encodedAddress = urlencode($address);
        return "https://www.google.com/maps/search/?api=1&query={$encodedAddress}";
    }

    private function getLatLong($address)
    {
        if (!$address) {
            return null;
        }

        $nominatimUrl = "https://nominatim.openstreetmap.org/search?q=" . urlencode($address) . "&format=json&limit=1";

        $response = Http::get($nominatimUrl);

        if ($response->successful()) {
            $data = $response->json();

            if (isset($data[0]['lat']) && isset($data[0]['lon'])) {
                $latitude = $data[0]['lat'];
                $longitude = $data[0]['lon'];

                return [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                ];
            }
        }

        return null;
    }

    private function calculateDistance($userLatitude, $userLongitude, $clinicLatitude, $clinicLongitude)
    {
        $apiUrl = "https://api.openrouteservice.org/v2/directions/driving-car";
        $apiKey = config('services.openrouteservice.key');

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type' => 'application/json',
                'Authorization' => $apiKey
            ])->post($apiUrl, [
                        'coordinates' => [
                            [$userLongitude, $userLatitude],
                            [$clinicLongitude, $clinicLatitude]
                        ]
                    ]);

            $response->throw();
            $data = $response->json();

            if (isset($data['routes'][0]['summary']['distance'])) {
                return $data['routes'][0]['summary']['distance'] / 1000; // distance in kilometers
            } else {
                Log::error('Unable to find route in OpenRouteService response', ['response' => $data]);
                return null;
            }
        } catch (\Exception $e) {
            Log::error('Error fetching distance from OpenRouteService', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $chatBot = ChatBot::find($id);

        if ($chatBot) {
            return new ChatBotResource($chatBot);
        } else {
            return response()->json(['message' => 'Chat record not found'], 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $chatBot = ChatBot::find($id);

        if (!$chatBot) {
            return response()->json(['message' => 'Chat record not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'userQuestion' => 'required|string',
            'botResponse' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->messages(),
            ], 422);
        }

        // Update the chat record
        $chatBot->update([
            'user_id' => $request->user_id,
            'userQuestion' => json_encode($request->userQuestion),
            'botResponse' => $request->botResponse,
        ]);

        return response()->json(['message' => 'Chat record updated successfully', 'data' => new ChatBotResource($chatBot)], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $chatBot = ChatBot::find($id);

        if ($chatBot) {
            $chatBot->delete();
            return response()->json(['message' => 'Chat record deleted successfully'], 200);
        } else {
            return response()->json(['message' => 'Chat record not found'], 404);
        }
    }


}
