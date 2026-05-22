export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  description: string;
  coordinates: Coordinates;
}

export interface NearbyAttraction {
  name: string;
  rating: number;
  description: string;
  coordinates: Coordinates;
}

export interface DailyPlan {
  day: number;
  date: string;
  title: string;
  location: string; // The city for this day's plan
  itinerary: ItineraryItem[];
  nearbyAttractions: NearbyAttraction[];
}

export interface PackingItem {
  category: string;
  items: string[];
}

export interface CuisineGuide {
  mustTryDishes: string[];
  tips: string;
}

export interface CulturalCheatSheet {
  phrases: { phrase: string; meaning: string }[];
  tipping: string;
  emergencyNumbers: string;
}

export interface TripPlan {
  destination: string; // This will now be an overall trip title
  totalDays: number;
  estimatedBudget: string;
  dailyPlans: DailyPlan[];
  packingList: PackingItem[];
  cuisineGuide: CuisineGuide;
  culturalCheatSheet: CulturalCheatSheet;
}

export interface TripFormData {
  startCity: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  budget: string;
  travelStyle: string;
  mustInclude?: string;
  dontInclude?: string;
}

export interface ClimateAnalysis {
  isIdeal: boolean;
  analysis: string;
  suggestedStartDate?: string;
  suggestedEndDate?: string;
}

export interface SavedTrip {
  id: string;
  tripPlan: TripPlan;
  formData: TripFormData;
  createdAt: string;
  userEmail: string;
}

export type Page = 'welcome' | 'setup' | 'visualization' | 'dayDetails' | 'about' | 'auth' | 'history';