import React from 'react';
import { Page, SavedTrip, TripPlan } from './types';

interface HistoryPageProps {
  history: SavedTrip[];
  onViewTrip: (trip: TripPlan) => void;
  onDeleteTrip: (id: string) => void;
  navigateTo: (page: Page) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ history, onViewTrip, onDeleteTrip, navigateTo }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Travel History</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">A look back at your generated adventures.</p>
        </div>

        {history.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">You haven't generated any trips yet.</p>
            <button
              onClick={() => navigateTo('setup')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(trip => (
              <div key={trip.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {trip.tripPlan.destination}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Created on: {new Date(trip.createdAt).toLocaleDateString()}
                </p>
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2 dark:bg-blue-900 dark:text-blue-200">
                    {trip.tripPlan.totalDays} Days
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2 mb-2 dark:bg-green-900 dark:text-green-200">
                    {trip.tripPlan.estimatedBudget}
                  </span>
                </div>
                <div className="mt-auto flex space-x-3">
                  <button
                    onClick={() => onViewTrip(trip.tripPlan)}
                    className="flex-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-center"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onDeleteTrip(trip.id)}
                    className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition text-center"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
