import { useState, useEffect } from 'react';
import { SavedTrip, TripPlan, TripFormData } from './types';

const STORAGE_KEY = 'journeygenie_trips';

/**
 * Custom React hook to manage saving, loading, and deleting
 * trip itineraries for a specific user utilizing local storage.
 * 
 * @param {string | undefined} userEmail - The email of the currently authenticated user.
 * @returns An object containing the user's history and management functions.
 */
export const useTripHistory = (userEmail: string | undefined) => {
  const [history, setHistory] = useState<SavedTrip[]>([]);

  useEffect(() => {
    if (!userEmail) {
      setHistory([]);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const allTrips: SavedTrip[] = JSON.parse(saved);
        setHistory(allTrips.filter(t => t.userEmail === userEmail));
      } catch (e) {
        // console.error('Failed to parse trip history', e);
      }
    }
  }, [userEmail]);

  const saveTrip = (tripPlan: TripPlan, formData: TripFormData) => {
    if (!userEmail) return;
    
    const newTrip: SavedTrip = {
      id: Date.now().toString(),
      tripPlan,
      formData,
      createdAt: new Date().toISOString(),
      userEmail,
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    let allTrips: SavedTrip[] = [];
    if (saved) {
      try {
        allTrips = JSON.parse(saved);
      } catch (e) {
        // console.error('Failed to parse trip history', e);
      }
    }
    
    allTrips.push(newTrip);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allTrips));
    setHistory(allTrips.filter(t => t.userEmail === userEmail));
  };

  const deleteTrip = (id: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        let allTrips: SavedTrip[] = JSON.parse(saved);
        allTrips = allTrips.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allTrips));
        setHistory(allTrips.filter(t => t.userEmail === userEmail));
      } catch (e) {
        // console.error('Failed to parse trip history', e);
      }
    }
  }

  return { history, saveTrip, deleteTrip };
};
