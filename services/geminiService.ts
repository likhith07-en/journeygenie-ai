
import { GoogleGenAI, Type } from "@google/genai";
import { TripFormData, TripPlan, ClimateAnalysis } from '../types';

const climateSchema = {
  type: Type.OBJECT,
  properties: {
    isIdeal: { type: Type.BOOLEAN, description: "True if the dates are good for travel, false if there are significant weather concerns." },
    analysis: { type: Type.STRING, description: "A brief, one-sentence analysis of the climate for the given dates and locations. E.g., 'This period is peak monsoon season in Mumbai, expect heavy rain.' or 'This is an excellent time to visit.'" },
    suggestedStartDate: { type: Type.STRING, description: "A suggested start date in YYYY-MM-DD format if the climate is not ideal. Omit if ideal." },
    suggestedEndDate: { type: Type.STRING, description: "A suggested end date in YYYY-MM-DD format if the climate is not ideal. Omit if ideal." },
  },
  required: ["isIdeal", "analysis"],
};

const getGenAI = () => {
  // FIX: Per @google/genai guidelines, the API key must be read from process.env.API_KEY.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * Analyzes the climate for a given trip's destinations and dates.
 * Suggests an alternative travel window if the current one is not ideal.
 * 
 * @param {Pick<TripFormData, 'destinations' | 'startDate' | 'endDate'>} formData - Dates and locations.
 * @returns {Promise<ClimateAnalysis>} The analysis result containing suitability and suggestions.
 */
export const analyzeClimateForTrip = async (formData: Pick<TripFormData, 'destinations' | 'startDate' | 'endDate'>): Promise<ClimateAnalysis> => {
  const ai = getGenAI();
  const destinationsText = formData.destinations.join(', ');

  const datesText = formData.endDate 
    ? `from ${formData.startDate} to ${formData.endDate}` 
    : `starting from ${formData.startDate} onwards`;

  const prompt = `
    Analyze the climate for a trip to the following destinations: ${destinationsText}.
    The proposed travel dates are ${datesText}.

    Based on typical weather patterns (e.g., monsoon, extreme heat, winter storms), determine if this is an ideal time to visit.
    - If it is a good time, set isIdeal to true.
    - If it is not ideal, set isIdeal to false and suggest a better travel window (a similar duration) later in the year.
    - The analysis text should be a single, concise sentence.
    - Dates must be in YYYY-MM-DD format.

    Structure your response as a single JSON object matching the provided schema. Do not include any markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: climateSchema,
      },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);

  } catch (error) {
    // console.error("Error analyzing climate:", error);
    // Fail gracefully: assume the dates are fine so the user can proceed.
    return {
      isIdeal: true,
      analysis: "Could not perform climate check.",
    };
  }
};

const itinerarySchema = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING, description: "A creative and descriptive overall title for the multi-city trip, e.g., 'An Italian Adventure: Rome & Florence'." },
    totalDays: { type: Type.INTEGER, description: "Total number of days for the trip." },
    estimatedBudget: { type: Type.STRING, description: "A descriptive estimated budget for the trip in Indian Rupees (₹), e.g., '₹80,000 - ₹1,20,000'." },
    dailyPlans: {
      type: Type.ARRAY,
      description: "A detailed plan for each day of the trip.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER, description: "The day number, starting from 1." },
          date: { type: Type.STRING, description: "The full date for this day's plan, e.g., 'Friday, March 15, 2024'." },
          title: { type: Type.STRING, description: "A catchy title for the day, e.g., 'Arrival and Roman Wonders'." },
          location: { type: Type.STRING, description: "The city where this day's activities take place, e.g., 'Rome, Italy'." },
          itinerary: {
            type: Type.ARRAY,
            description: "A schedule of activities for the day.",
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "The time of the activity, e.g., '9:00 AM'." },
                activity: { type: Type.STRING, description: "The name of the activity, e.g., 'Breakfast at a local café'." },
                location: { type: Type.STRING, description: "The location of the activity, e.g., 'Café de Flore'." },
                description: { type: Type.STRING, description: "A brief, engaging one-sentence description of the activity." },
                coordinates: {
                  type: Type.OBJECT,
                  description: "The precise latitude and longitude for this location.",
                  properties: {
                    lat: { type: Type.NUMBER, description: "Latitude" },
                    lng: { type: Type.NUMBER, description: "Longitude" },
                  },
                  required: ["lat", "lng"],
                },
              },
              required: ["time", "activity", "location", "description", "coordinates"],
            },
          },
          nearbyAttractions: {
            type: Type.ARRAY,
            description: "Suggestions for nearby attractions.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the attraction." },
                rating: { type: Type.NUMBER, description: "A rating out of 5, e.g., 4.8." },
                description: { type: Type.STRING, description: "A brief one-sentence description of the attraction." },
                 coordinates: {
                  type: Type.OBJECT,
                  description: "The precise latitude and longitude for this attraction.",
                  properties: {
                    lat: { type: Type.NUMBER, description: "Latitude" },
                    lng: { type: Type.NUMBER, description: "Longitude" },
                  },
                  required: ["lat", "lng"],
                },
              },
              required: ["name", "rating", "description", "coordinates"],
            },
          },
        },
        required: ["day", "date", "title", "location", "itinerary", "nearbyAttractions"],
      },
    },
    packingList: {
      type: Type.ARRAY,
      description: "A smart packing list tailored to the destination and climate.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of items, e.g., 'Clothing', 'Electronics'." },
          items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of packing items." },
        },
        required: ["category", "items"],
      },
    },
    cuisineGuide: {
      type: Type.OBJECT,
      description: "A guide for local cuisine and dining.",
      properties: {
        mustTryDishes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of famous local dishes." },
        tips: { type: Type.STRING, description: "General tips for dining or booking restaurants." },
      },
      required: ["mustTryDishes", "tips"],
    },
    culturalCheatSheet: {
      type: Type.OBJECT,
      description: "A cultural and emergency cheat sheet.",
      properties: {
        phrases: {
          type: Type.ARRAY,
          description: "Basic local phrases and their meanings.",
          items: {
            type: Type.OBJECT,
            properties: {
              phrase: { type: Type.STRING, description: "The phrase in the local language." },
              meaning: { type: Type.STRING, description: "The English meaning." },
            },
            required: ["phrase", "meaning"],
          },
        },
        tipping: { type: Type.STRING, description: "Tipping etiquette in the region." },
        emergencyNumbers: { type: Type.STRING, description: "Local emergency numbers." },
      },
      required: ["phrases", "tipping", "emergencyNumbers"],
    },
  },
  required: ["destination", "totalDays", "estimatedBudget", "dailyPlans", "packingList", "cuisineGuide", "culturalCheatSheet"],
};

/**
 * Generates a full day-by-day travel itinerary using the Gemini API.
 * Uses the user's constraints to provide personalized, localized plans.
 * 
 * @param {TripFormData} formData - The user-submitted trip preferences and details.
 * @returns {Promise<TripPlan>} A structured trip plan.
 * @throws {Error} If the API key is missing or itinerary generation fails.
 */
export const generateItinerary = async (formData: TripFormData): Promise<TripPlan> => {
  const ai = getGenAI();

  const destinationsText = formData.destinations.join(', ');
  
  let preferencesPrompt = '';
  if (formData.mustInclude) {
    preferencesPrompt += `\nIMPORTANT: The user wants to be sure to include the following places or activities: ${formData.mustInclude}. Integrate them logically into the itinerary.`;
  }
  if (formData.dontInclude) {
    preferencesPrompt += `\nIMPORTANT: The user wants to avoid the following places or types of places: ${formData.dontInclude}. Do not suggest them.`;
  }


  const datesText = formData.endDate 
    ? `from ${formData.startDate} to ${formData.endDate}` 
    : `starting from ${formData.startDate} onwards`;

  const prompt = `
    You are an expert travel planner named JourneyGenie. Create a detailed, day-by-day travel itinerary for a trip starting from ${formData.startCity} and visiting the following destinations: ${destinationsText}.
    The trip takes place ${datesText}.
    The traveler's budget is ${formData.budget}. The budget should be calculated and presented in Indian Rupees (₹). Their travel style is ${formData.travelStyle}.
    ${preferencesPrompt}
    
    The itinerary should be logical, considering travel time between cities. For each day, provide:
    1. The city for that day's plan.
    2. A full date and a catchy title.
    3. A detailed schedule with time, activity, location, and a brief, engaging one-sentence description. For each activity, you MUST provide its precise geographical coordinates (latitude and longitude).
    4. Three suggestions for nearby attractions with a name, a rating out of 5, and a short description. For each attraction, you MUST provide its precise geographical coordinates (latitude and longitude).
    5. A creative and descriptive overall title for the entire trip.

    Structure your entire response as a single JSON object matching the provided schema. Do not include any markdown formatting like \`\`\`json.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    return parsedData.trip ? parsedData.trip : parsedData;

  } catch (error) {
    // console.error("Error generating itinerary:", error);
    throw new Error("Failed to generate itinerary. The model may be unable to provide a plan for the selected destination or options.");
  }
};