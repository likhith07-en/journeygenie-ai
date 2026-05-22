import React, { useState, useCallback, useEffect } from 'react';
import { Page, TripPlan, TripFormData, DailyPlan, ClimateAnalysis } from './types';
import { generateItinerary, analyzeClimateForTrip } from './services/geminiService';
import { ICONS } from './constants';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import { useTripHistory } from './useTripHistory';
import { AuthPage } from './AuthPage';
import { HistoryPage } from './HistoryPage';
import VisualizationPage from './VisualizationPage';
import DayDetailsPage from './DayDetailsPage';

declare global {
    interface Window {
        L: any;
    }
}

// --- Helper & UI Components (Defined outside App to prevent re-creation on re-renders) ---

import { AnimatedLoader } from './AnimatedLoader';

const Footer: React.FC = () => (
    <footer className="w-full bg-white dark:bg-gray-800 shadow-inner mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} JourneyGenie-AI. All rights reserved.</p>
        </div>
    </footer>
);

interface ClimateSuggestionModalProps {
    suggestion: ClimateAnalysis;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

const ButtonSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


/**
 * ClimateSuggestionModal Component
 * Displays a modal when the AI suggests a better time to travel based on climate.
 * Allows the user to either accept the suggested dates or proceed anyway.
 * 
 * @param {ClimateSuggestionModalProps} props - The props for the modal.
 */
const ClimateSuggestionModal: React.FC<ClimateSuggestionModalProps> = ({ suggestion, onConfirm, onCancel, isLoading }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Climate Suggestion 💡</h2>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-4 bg-yellow-50 dark:bg-yellow-900/50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                {suggestion.analysis}
            </p>
            {suggestion.suggestedStartDate && suggestion.suggestedEndDate && (
                <div className="mb-6">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">We suggest traveling from:</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {new Date(suggestion.suggestedStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {' to '}
                        {new Date(suggestion.suggestedEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
            )}
            <div className="flex justify-center space-x-4">
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    {isLoading && <ButtonSpinner />}
                    Continue Anyway
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-lg text-white bg-blue-500 hover:bg-blue-600 font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    {isLoading && <ButtonSpinner />}
                    Use Suggested Dates
                </button>
            </div>
        </div>
    </div>
);


// --- Page Components ---

interface PageProps {
    navigateTo: (page: Page) => void;
}

interface NavbarProps extends PageProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    session: Session | null;
    onSignOut: () => void;
}

/**
 * Navbar Component
 * Provides top-level navigation, theme toggling, and user authentication status.
 * 
 * @param {NavbarProps} props - Props for navigation, theme, and session handling.
 */
const Navbar: React.FC<NavbarProps> = ({ navigateTo, theme, toggleTheme, session, onSignOut }) => (
    <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
                <button onClick={() => navigateTo('welcome')} className="flex items-center space-x-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">✈️ JourneyGenie</span>
                </button>
                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex items-baseline space-x-4">
                        <button onClick={() => navigateTo('welcome')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">Home</button>
                        <button onClick={() => navigateTo('setup')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">Plan Trip</button>
                        {session && <button onClick={() => navigateTo('history')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">History</button>}
                        <button onClick={() => navigateTo('visualization')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">My Itinerary</button>
                        <button onClick={() => navigateTo('about')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">About</button>
                        {session ? (
                            <button onClick={onSignOut} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300">Sign Out</button>
                        ) : (
                            <button onClick={() => navigateTo('auth')} className="text-blue-600 dark:text-blue-400 font-medium px-3 py-2 rounded-md text-sm hover:underline transition-all duration-300">Sign In</button>
                        )}
                    </div>
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? ICONS.moon : ICONS.sun}
                    </button>
                </div>
            </div>
        </div>
    </nav>
);

const WelcomePage: React.FC<PageProps> = ({ navigateTo }) => (
    <div className="bg-gradient-to-br from-blue-600 to-purple-700 min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-pulse">🏖️</div>
        <div className="absolute top-40 right-20 text-4xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🏔️</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}>🏛️</div>

        <div className="text-center text-white z-10 max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-down">Your Journey, Reimagined</h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Craft unforgettable travel experiences with AI-powered planning, interactive maps, and personalized itineraries.
            </p>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <button onClick={() => navigateTo('setup')} className="bg-white text-purple-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-yellow-100 transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Start Planning Your Adventure
                </button>
            </div>
        </div>
    </div>
);

interface SetupPageProps extends PageProps {
    onGeneratePlan: (formData: TripFormData) => void;
}

/**
 * SetupPage Component
 * Provides the main form for users to input their travel preferences.
 * Handles validation and passing data to the itinerary generation process.
 * 
 * @param {SetupPageProps} props - The props containing generation callback and navigation.
 */
const SetupPage: React.FC<SetupPageProps> = ({ navigateTo, onGeneratePlan }) => {
    const [formData, setFormData] = useState<Omit<TripFormData, 'destinations' | 'mustInclude' | 'dontInclude'>>({
        startCity: '', startDate: '', endDate: '', budget: '', travelStyle: ''
    });
    const [destinations, setDestinations] = useState<string[]>(['']);
    const [mustInclude, setMustInclude] = useState('');
    const [dontInclude, setDontInclude] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const clearError = (fieldName: string) => {
        if (errors[fieldName]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        if (id === 'mustInclude') {
            setMustInclude(value);
        } else if (id === 'dontInclude') {
            setDontInclude(value);
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }

        clearError(id);
        if (id === 'startDate' && value) {
            setFormData(prev => ({ ...prev, endDate: '' }));
            clearError('endDate');
        }
    };

    const handleTravelStyleChange = (style: string) => {
        setFormData(prev => ({ ...prev, travelStyle: style }));
        clearError('travelStyle');
    };

    const handleDestinationChange = (index: number, value: string) => {
        const newDestinations = [...destinations];
        newDestinations[index] = value;
        setDestinations(newDestinations);
        clearError('destinations');
    };

    const addDestination = () => {
        setDestinations([...destinations, '']);
    };

    const removeDestination = (index: number) => {
        if (destinations.length > 1) {
            setDestinations(destinations.filter((_, i) => i !== index));
        }
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.startCity.trim()) newErrors.startCity = "Please enter a starting city.";
        if (destinations.every(d => d.trim() === '')) newErrors.destinations = "Please enter at least one destination.";
        if (!formData.startDate) newErrors.startDate = "Please select a start date.";
        if (!formData.budget) newErrors.budget = "Please select a budget.";
        if (!formData.travelStyle) newErrors.travelStyle = "Please select a travel style.";
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }
        setErrors({});
        onGeneratePlan({
            ...formData,
            destinations: destinations.filter(d => d.trim() !== ''),
            mustInclude,
            dontInclude,
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900/50 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Plan Your Perfect Trip</h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300">Tell us your dream, and we'll craft the journey.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Where is your journey starting from?</label>
                            <input type="text" id="startCity" placeholder="e.g., Mumbai, India" value={formData.startCity} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg ${errors.startCity ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`} />
                            {errors.startCity && <p className="text-red-500 text-sm mt-1">{errors.startCity}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-lg font-semibold text-gray-700 dark:text-gray-200">Destinations</label>
                            </div>
                            <div id="destinationsContainer" className="space-y-3">
                                {destinations.map((destination, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <input type="text" placeholder={`Destination ${index + 1}`} value={destination} onChange={(e) => handleDestinationChange(index, e.target.value)} className={`flex-1 px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${errors.destinations ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`} />
                                        {destinations.length > 1 && <button type="button" onClick={() => removeDestination(index)} className="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300 px-3 py-3 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors">✕</button>}
                                    </div>
                                ))}
                            </div>
                            {errors.destinations && <p className="text-red-500 text-sm mt-1">{errors.destinations}</p>}
                            <button type="button" onClick={addDestination} className="mt-3 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-800 dark:hover:text-blue-300">+ Add another destination</button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Start Date</label>
                                <input type="date" id="startDate" min={new Date().toISOString().split('T')[0]} value={formData.startDate} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${errors.startDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`} />
                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">End Date <span className="text-sm font-normal text-gray-500">(Optional)</span></label>
                                <input type="date" id="endDate" min={formData.startDate || new Date().toISOString().split('T')[0]} value={formData.endDate} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors ${errors.endDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`} />
                                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                            </div>
                        </div>
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Budget (in Rupees)</label>
                            <select id="budget" value={formData.budget} onChange={handleInputChange} className={`w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg ${errors.budget ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}>
                                <option value="">Select your budget</option>
                                <option value="budget">Budget-Friendly (₹)</option>
                                <option value="moderate">Moderate (₹₹)</option>
                                <option value="luxury">Luxury (₹₹₹)</option>
                            </select>
                            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
                        </div>
                        <div>
                            <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Travel Style</label>
                            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 p-2 rounded-lg ${errors.travelStyle ? 'border-2 border-red-500' : ''}`}>
                                {Object.entries(ICONS).filter(([key]) => ['adventure', 'culture', 'relaxation', 'foodie'].includes(key)).map(([style, icon]) => (
                                    <div key={style} onClick={() => handleTravelStyleChange(style)} className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${formData.travelStyle === style ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-1'}`}>
                                        {icon}
                                        <span className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{style}</span>
                                    </div>
                                ))}
                            </div>
                            {errors.travelStyle && <p className="text-red-500 text-sm mt-1">{errors.travelStyle}</p>}
                        </div>

                        <div className="space-y-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Must-Include Places <span className="text-sm font-normal text-gray-500">(Optional)</span></label>
                                <textarea id="mustInclude" placeholder="e.g., Eiffel Tower, Colosseum" value={mustInclude} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg border-gray-200 dark:border-gray-600"></textarea>
                            </div>
                            <div>
                                <label className="block text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Places to Avoid <span className="text-sm font-normal text-gray-500">(Optional)</span></label>
                                <textarea id="dontInclude" placeholder="e.g., Crowded markets, tourist traps" value={dontInclude} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 border-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg border-gray-200 dark:border-gray-600"></textarea>
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Create My Itinerary ✨
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const AboutPage: React.FC<PageProps> = ({ navigateTo }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">About JourneyGenie AI</h2>
                <p className="text-xl text-gray-600 dark:text-gray-300">Your Personal AI-Powered Travel Planner</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                <p>
                    <strong>JourneyGenie</strong> is a revolutionary travel planning application designed to transform your dream vacation into a meticulously planned reality. We harness the power of Google's cutting-edge Gemini AI to create personalized, day-by-day itineraries that are tailored to your unique interests, budget, and travel style.
                </p>
                <p>
                    Our mission is to eliminate the stress and complexity of travel planning. Instead of spending hours researching destinations, booking hotels, and coordinating activities, you can simply tell JourneyGenie your desires, and our AI will do the heavy lifting. From adventure and cultural exploration to relaxation and culinary journeys, we craft a seamless experience just for you.
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                    <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">How It Works</h3>
                    <p>
                        Our intelligent system takes your input—starting city, destinations, dates, budget, and travel style—and communicates with the Gemini AI. The AI analyzes your request to generate a comprehensive itinerary.
                    </p>
                </div>
                <p>
                    We believe that the journey begins the moment you start planning. With JourneyGenie, that beginning is inspiring, effortless, and filled with excitement for the adventure that lies ahead.
                </p>
                <div className="text-center pt-4">
                    <button onClick={() => navigateTo('setup')} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                        Plan Your First Trip
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// --- Main App Component ---

/**
 * Main App Component
 * 
 * The root component of the JourneyGenie application. It manages top-level
 * application state, routing between pages, user authentication session, 
 * and handles the complex logic of itinerary generation and climate checks.
 */
const App: React.FC = () => {
    const [page, setPage] = useState<Page>('welcome');
    const [session, setSession] = useState<Session | null>(null);
    const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState<DailyPlan | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("Crafting your masterpiece...");
    const [error, setError] = useState<string | null>(null);
    const [climateSuggestion, setClimateSuggestion] = useState<ClimateAnalysis | null>(null);
    const [pendingFormData, setPendingFormData] = useState<TripFormData | null>(null);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    const { history, saveTrip, deleteTrip } = useTripHistory(session?.user?.email);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const navigateTo = useCallback((newPage: Page) => {
        if (newPage === 'visualization' && !tripPlan) {
            setPage('setup');
            return;
        }
        setPage(newPage);
        window.scrollTo(0, 0);
    }, [tripPlan]);

    const proceedToGenerateItinerary = useCallback(async (formData: TripFormData) => {
        setIsLoading(true);
        setError(null);
        setClimateSuggestion(null); // Hide the modal
        try {
            setLoadingMessage("Generating your itinerary...");
            const plan = await generateItinerary(formData);
            setTripPlan(plan);
            saveTrip(plan, formData);
            navigateTo('visualization');
        } catch (e) {
            const err = e as Error;
            setError(err.message || "An unknown error occurred.");
            navigateTo('setup'); // Go back to setup page on error
        } finally {
            setIsLoading(false);
            setPendingFormData(null);
            setIsSuggestionLoading(false);
        }
    }, [navigateTo, saveTrip]);

    const handlePlanGeneration = useCallback(async (formData: TripFormData) => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage("Checking climate...");

        try {
            const climateAnalysis = await analyzeClimateForTrip(formData);
            if (climateAnalysis.isIdeal) {
                await proceedToGenerateItinerary(formData);
            } else {
                setPendingFormData(formData);
                setClimateSuggestion(climateAnalysis);
                setIsLoading(false); // Turn off loader to show the modal
            }
        } catch (e) {
            const err = e as Error;
            setError(err.message || "An unknown error occurred during climate check.");
            setIsLoading(false);
        }
    }, [proceedToGenerateItinerary]);

    const handleConfirmSuggestion = useCallback(() => {
        if (pendingFormData && climateSuggestion?.suggestedStartDate && climateSuggestion?.suggestedEndDate) {
            setIsSuggestionLoading(true);
            const updatedFormData = {
                ...pendingFormData,
                startDate: climateSuggestion.suggestedStartDate,
                endDate: climateSuggestion.suggestedEndDate,
            };
            proceedToGenerateItinerary(updatedFormData);
        }
    }, [pendingFormData, climateSuggestion, proceedToGenerateItinerary]);

    const handleCancelSuggestion = useCallback(() => {
        if (pendingFormData) {
            setIsSuggestionLoading(true);
            proceedToGenerateItinerary(pendingFormData);
        }
    }, [pendingFormData, proceedToGenerateItinerary]);

    const handleSelectDay = useCallback((day: DailyPlan) => {
        setSelectedDay(day);
        navigateTo('dayDetails');
    }, [navigateTo]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigateTo('welcome');
    };

    const handleViewTrip = (plan: TripPlan) => {
        setTripPlan(plan);
        navigateTo('visualization');
    };

    const renderPage = () => {
        switch (page) {
            case 'welcome':
                return <WelcomePage navigateTo={navigateTo} />;
            case 'auth':
                return <AuthPage onAuthSuccess={() => navigateTo('welcome')} />;
            case 'history':
                return <HistoryPage history={history} onViewTrip={handleViewTrip} onDeleteTrip={deleteTrip} navigateTo={navigateTo} />;
            case 'setup':
                return <SetupPage navigateTo={navigateTo} onGeneratePlan={handlePlanGeneration} />;
            case 'visualization':
                if (tripPlan) {
                    return <VisualizationPage tripPlan={tripPlan} onSelectDay={handleSelectDay} navigateTo={navigateTo} />;
                }
                return null;
            case 'dayDetails':
                if (selectedDay && tripPlan) {
                    return <DayDetailsPage dayPlan={selectedDay} destination={tripPlan.destination} navigateTo={navigateTo} theme={theme} />;
                }
                return null;
            case 'about':
                return <AboutPage navigateTo={navigateTo} />;
            default:
                return <WelcomePage navigateTo={navigateTo} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {isLoading && !climateSuggestion && <AnimatedLoader message={loadingMessage} />}
            {climateSuggestion && (
                <ClimateSuggestionModal
                    suggestion={climateSuggestion}
                    onConfirm={handleConfirmSuggestion}
                    onCancel={handleCancelSuggestion}
                    isLoading={isSuggestionLoading}
                />
            )}
            <Navbar navigateTo={navigateTo} theme={theme} toggleTheme={toggleTheme} session={session} onSignOut={handleSignOut} />
            <main className="flex-grow transition-all duration-300 ease-in-out opacity-100 animate-[fadeIn_0.5s_ease-out]">
                {page === 'setup' && (
                    <div className="fixed top-16 w-full z-40 px-4">
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                                <p className="font-bold">Oops!</p>
                                <p>{error}</p>
                            </div>
                        )}
                    </div>
                )}
                {renderPage()}
            </main>
            <Footer />
        </div>
    );
};

export default App;