import React, { useState } from 'react';
import { Page, TripPlan, DailyPlan } from './types';

interface VisualizationPageProps {
    navigateTo: (page: Page) => void;
    tripPlan: TripPlan;
    onSelectDay: (day: DailyPlan) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ tripPlan, onSelectDay, navigateTo }) => {
    const [expenses, setExpenses] = useState<{ desc: string; amount: number }[]>([]);
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [copied, setCopied] = useState(false);

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (expenseDesc && expenseAmount) {
            setExpenses([...expenses, { desc: expenseDesc, amount: parseFloat(expenseAmount) }]);
            setExpenseDesc('');
            setExpenseAmount('');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(`Check out my AI-generated trip to ${tripPlan.destination} via JourneyGenie!`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPdf = async () => {
        const element = document.getElementById('pdf-hidden-itinerary');
        if (!element) return;
        const pdfBtn = document.getElementById('pdf-download-btn');
        if (pdfBtn) { pdfBtn.textContent = '⚙️ Generating...'; (pdfBtn as HTMLButtonElement).disabled = true; }
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set({
                margin: 0.5,
                filename: `${tripPlan.destination.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_itinerary.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in' as const, format: 'letter', orientation: 'portrait' as const }
            }).from(element).save();
        } catch { alert('Failed to generate PDF.'); }
        finally {
            if (pdfBtn) { pdfBtn.textContent = '⬇️ Export PDF'; (pdfBtn as HTMLButtonElement).disabled = false; }
        }
    };

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
            {/* Hidden PDF element */}
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div id="pdf-hidden-itinerary" style={{ width: '800px', background: 'white', color: 'black', padding: '40px', fontFamily: 'sans-serif' }}>
                    <div style={{ textAlign: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '24px', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e40af' }}>{tripPlan.destination}</h1>
                        <p style={{ color: '#6b7280', marginTop: '8px' }}>Total Budget: {tripPlan.estimatedBudget} | {tripPlan.totalDays} Days</p>
                    </div>
                    {tripPlan.dailyPlans.map(day => (
                        <div key={day.day} style={{ marginBottom: '40px' }}>
                            <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '16px', marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a8a' }}>Day {day.day}: {day.location}</h2>
                                <p style={{ color: '#374151' }}>{day.title} &bull; {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            {day.itinerary.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                                    <span style={{ background: '#ede9fe', color: '#5b21b6', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', whiteSpace: 'nowrap', height: 'fit-content' }}>{item.time}</span>
                                    <div><strong>{item.activity}</strong><p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>{item.description}</p></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">✈️ AI-Generated Itinerary</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-5 drop-shadow-lg">{tripPlan.destination}</h1>
                    <div className="flex flex-wrap gap-3 mb-6">
                        {[
                            { val: tripPlan.totalDays, label: 'Days' },
                            { val: tripPlan.dailyPlans.flatMap(d => d.itinerary).length, label: 'Activities' },
                            { val: tripPlan.estimatedBudget, label: 'Est. Budget' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center min-w-[90px]">
                                <div className="text-xl font-extrabold">{stat.val}</div>
                                <div className="text-xs text-blue-100 uppercase tracking-wide mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleShare} className="bg-white/20 hover:bg-white/30 border border-white/40 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 transition-all">
                            {copied ? '✅ Copied!' : '🔗 Share Trip'}
                        </button>
                        <button id="pdf-download-btn" onClick={handleDownloadPdf} className="bg-white text-purple-700 hover:bg-gray-100 font-semibold py-2 px-5 rounded-xl flex items-center gap-2 transition-all shadow-md">
                            ⬇️ Export PDF
                        </button>
                        <button onClick={() => navigateTo('setup')} className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold py-2 px-5 rounded-xl flex items-center gap-2 transition-all">
                            🔄 New Trip
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">

                {/* Sticky Sidebar: Timeline */}
                <aside className="lg:w-72 w-full flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 sticky top-20 overflow-hidden">
                        <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/20 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">📅 Day-by-Day Timeline</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Click any day for full details</p>
                        </div>
                        <div className="p-4 relative max-h-[65vh] overflow-y-auto custom-scrollbar">
                            <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full" />
                            {tripPlan.dailyPlans.map((day, i) => (
                                <button key={i} onClick={() => onSelectDay(day)}
                                    className="relative w-full text-left pl-10 py-3 cursor-pointer group rounded-xl transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-700/60 mb-1">
                                    <div className="absolute left-4 top-4 w-4 h-4 bg-white dark:bg-gray-800 border-4 border-blue-500 rounded-full group-hover:scale-125 group-hover:border-purple-500 transition-all shadow-sm" />
                                    <p className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">Day {day.day}: {day.location}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{day.title}</p>
                                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View details →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Right Content */}
                <div className="flex-1 min-w-0 space-y-6">

                    {/* Budget Tracker */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">💳 Live Budget Tracker</h3>
                        <form onSubmit={handleAddExpense} className="flex gap-2 mb-4">
                            <input type="text" placeholder="Expense description…" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)}
                                className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            <input type="number" placeholder="₹ Amt" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)}
                                className="w-28 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Add</button>
                        </form>
                        {expenses.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">No expenses yet. Start tracking your spending!</p>
                        ) : (
                            <div>
                                <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar mb-3">
                                    {expenses.map((e, i) => (
                                        <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700/40 px-4 py-2 rounded-lg">
                                            <span className="text-gray-700 dark:text-gray-300">{e.desc}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">₹{e.amount}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-bold pt-3 border-t-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                                    <span className="text-xs uppercase tracking-wider text-gray-500 self-center">Total Spent</span>
                                    <span className="text-xl">₹{totalSpent.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Packing List */}
                    {tripPlan.packingList && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-5 flex items-center gap-2">🧳 Smart Packing List</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {tripPlan.packingList.map(cat => (
                                    <div key={cat.category} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                                        <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase text-xs tracking-widest">{cat.category}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {cat.items.map(item => (
                                                <span key={item} className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">{item}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cuisine + Culture */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {tripPlan.cuisineGuide && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">🍽️ Local Cuisine</h3>
                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-4 border border-orange-100 dark:border-orange-800/30">
                                    <h4 className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-widest mb-3">Must-Try Dishes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {tripPlan.cuisineGuide.mustTryDishes.map(d => (
                                            <span key={d} className="bg-white dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">{d}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                    <span className="text-xl flex-shrink-0">💡</span>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{tripPlan.cuisineGuide.tips}</p>
                                </div>
                            </div>
                        )}
                        {tripPlan.culturalCheatSheet && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">🗣️ Cultural Cheat Sheet</h3>
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-start gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl">
                                        <span className="flex-shrink-0">💵</span>
                                        <div>
                                            <p className="text-xs font-bold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1">Tipping Etiquette</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{tripPlan.culturalCheatSheet.tipping}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                                        <span className="flex-shrink-0">🚨</span>
                                        <div>
                                            <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1">Emergency Numbers</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{tripPlan.culturalCheatSheet.emergencyNumbers}</p>
                                        </div>
                                    </div>
                                </div>
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Key Local Phrases</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {tripPlan.culturalCheatSheet.phrases.map(p => (
                                        <div key={p.phrase} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-600">
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{p.phrase}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 text-right">{p.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Book Now CTA */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white text-center">
                        <h3 className="text-2xl font-extrabold mb-2">Ready to Book? ✈️</h3>
                        <p className="text-blue-100 text-sm mb-6 max-w-sm mx-auto">Find the best deals on flights and hotels for your trip to {tripPlan.destination}.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-3">
                            <a href="https://skyscanner.com" target="_blank" rel="noopener noreferrer"
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-md flex items-center justify-center gap-2">
                                ✈️ Search Flights
                            </a>
                            <a href="https://booking.com" target="_blank" rel="noopener noreferrer"
                                className="bg-white text-blue-700 px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-md flex items-center justify-center gap-2">
                                🏨 Book Hotels
                            </a>
                        </div>
                        <p className="text-xs text-blue-300/50 mt-5 uppercase tracking-widest">*Powered by JourneyGenie Partners</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualizationPage;
