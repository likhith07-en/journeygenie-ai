import React, { useState, useEffect, useRef } from 'react';
import { Page, DailyPlan, ItineraryItem } from './types';
import { ICONS } from './constants';
import { OPENROUTESERVICE_API_KEY } from './config';

declare global { interface Window { L: any; } }

interface DayDetailsPageProps {
    navigateTo: (page: Page) => void;
    dayPlan: DailyPlan;
    destination: string;
    theme: 'light' | 'dark';
}

interface MapProps { locations: ItineraryItem[]; theme: 'light' | 'dark'; }

const RouteMap: React.FC<MapProps> = ({ locations, theme }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!mapInstance.current) return;
        if (tileLayerRef.current) mapInstance.current.removeLayer(tileLayerRef.current);
        const tileUrl = theme === 'dark'
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const attribution = theme === 'dark'
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        tileLayerRef.current = window.L.tileLayer(tileUrl, { attribution });
        mapInstance.current.addLayer(tileLayerRef.current);
    }, [theme]);

    useEffect(() => {
        if (!mapContainer.current || !window.L) return;
        if (mapInstance.current) {
            mapInstance.current.eachLayer((layer: any) => {
                if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline)
                    mapInstance.current.removeLayer(layer);
            });
        } else {
            mapInstance.current = window.L.map(mapContainer.current).setView([20, 0], 2);
        }
        if (!tileLayerRef.current) {
            tileLayerRef.current = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
        }
        const plotMarkers = (fit = true) => {
            const markers = locations.map((loc, idx) =>
                window.L.marker([loc.coordinates.lat, loc.coordinates.lng])
                    .addTo(mapInstance.current)
                    .bindPopup(`<b>${idx + 1}. ${loc.activity}</b><br>${loc.location}`)
            );
            if (fit && markers.length > 0) {
                mapInstance.current.fitBounds(window.L.featureGroup(markers).getBounds().pad(0.2));
            }
        };
        const fetchRoute = async () => {
            if (locations.length < 2) { setIsLoading(false); if (locations.length === 1) plotMarkers(); return; }
            try {
                const coords = locations.map(l => [l.coordinates.lng, l.coordinates.lat]);
                const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': OPENROUTESERVICE_API_KEY },
                    body: JSON.stringify({ coordinates: coords })
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const routeCoords = data.features[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
                const poly = window.L.polyline(routeCoords, { color: theme === 'dark' ? '#60a5fa' : '#3b82f6', weight: 4 }).addTo(mapInstance.current);
                mapInstance.current.fitBounds(poly.getBounds().pad(0.2));
                plotMarkers(false);
            } catch { plotMarkers(); }
            finally { setIsLoading(false); }
        };
        if (OPENROUTESERVICE_API_KEY && OPENROUTESERVICE_API_KEY !== 'YOUR_OPENROUTESERVICE_API_KEY_HERE') fetchRoute();
        else { plotMarkers(); setIsLoading(false); }
        return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; tileLayerRef.current = null; } };
    }, [locations, theme]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">🗺️ Today's Route Map</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">All {locations.length} stops plotted on map</p>
            </div>
            <div ref={mapContainer} style={{ height: '320px' }} className="bg-gray-200 dark:bg-gray-700 relative">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                        <div className="w-8 h-8 border-2 border-t-blue-500 border-gray-200 rounded-full animate-spin mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading map…</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DayDetailsPage: React.FC<DayDetailsPageProps> = ({ dayPlan, navigateTo, theme }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">

            {/* Header */}
            <div className="mb-8">
                <button onClick={() => navigateTo('visualization')}
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold mb-5 transition-colors group">
                    {ICONS.backArrow}
                    <span className="group-hover:underline">Back to Trip Overview</span>
                </button>
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">📍 {dayPlan.location}</p>
                    <h2 className="text-3xl font-extrabold mb-1">Day {dayPlan.day}: {dayPlan.title}</h2>
                    <p className="text-blue-100 text-sm">{new Date(dayPlan.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="mt-4 flex gap-3 flex-wrap">
                        <span className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-1.5 text-sm font-semibold">{dayPlan.itinerary.length} activities</span>
                        <span className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-1.5 text-sm font-semibold">{dayPlan.nearbyAttractions.length} nearby spots</span>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid lg:grid-cols-2 gap-6">

                {/* LEFT: Itinerary */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">🗓️ Today's Itinerary</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click any activity to search on Google</p>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {dayPlan.itinerary.map((item, i) => (
                            <a key={i}
                                href={`https://www.google.com/search?q=${encodeURIComponent(`${item.location}, ${dayPlan.location}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-start gap-4 px-6 py-4 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors group">
                                <div className="bg-blue-500 group-hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors mt-0.5 shadow-sm">
                                    {item.time}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors text-sm leading-snug">{item.activity}</h4>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{item.location}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.description}</p>
                                </div>
                                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Map + Nearby */}
                <div className="space-y-6">
                    <RouteMap locations={dayPlan.itinerary} theme={theme} />

                    {/* Nearby Attractions */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">⭐ Nearby Attractions</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bonus spots worth exploring</p>
                        </div>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {dayPlan.nearbyAttractions.map((attr, i) => (
                                <div key={i} className="px-6 py-4 hover:bg-purple-50 dark:hover:bg-gray-700/40 transition-colors">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(`${attr.name}, ${dayPlan.location}`)}`}
                                                target="_blank" rel="noopener noreferrer"
                                                className="font-semibold text-sm text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors hover:underline">
                                                {attr.name}
                                            </a>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{attr.description}</p>
                                        </div>
                                        <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                                            ⭐ {attr.rating}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default DayDetailsPage;
