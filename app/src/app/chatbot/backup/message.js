// // message.js

// export async function generateBotResponse(userQuestion) {
//     if (userQuestion.toLowerCase().includes('clinic near me')) {
//         return await fetchClinics();
//     }


//     switch (userQuestion.toLowerCase()) {
//         case 'hello':
//             return "Hi there! How can I assist you today?";
//         default:
//             return "I'm sorry, I don't understand that. Can you please rephrase?";
//     }
// }

// // Function to fetch clinics
// async function fetchClinics() {
//     try {
//         // Assuming you have an API or endpoint to retrieve clinic information
//         const response = await fetch('/api/clinics');
//         if (!response.ok) {
//             throw new Error('Network response was not ok');
//         }

//         const clinics = await response.json();
//         if (clinics.length > 0) {
//             const addresses = clinics.map(clinic => clinic.address).join(', ');
//             return `Here are some clinics near you: ${addresses}`;
//         } else {
//             return "I'm sorry, I couldn't find any clinics nearby.";
//         }
//     } catch (error) {
//         console.error("Error fetching clinic information:", error); // Log the error
//         return "There was an error fetching clinic information.";
//     }
// }