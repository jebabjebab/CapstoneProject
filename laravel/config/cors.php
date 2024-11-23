<?php

return [

    'paths' => ['api/*'], // naka set pa sa lahat ng may "/api" baguhin nalang pag specific routes lang

    'allowed_methods' => ['*'], // Allow all HTTP methods tulad ng GET, POST, PUT, DELETE

    'allowed_origins' => ['http://localhost:3000'], // para sa lahat

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'], // Allow all headers

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
