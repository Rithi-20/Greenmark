import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, MapPin, Sprout, Gift, Clock, CheckCircle2, XCircle, TrendingUp, Filter } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const UserHistory = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'uploads', 'redemptions'

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    const fetchHistory = async () => {
        try {
            console.log('🔍 Fetching history for:', userId);
            const { data } = await axios.get(`${API_URL}/admin/users/${userId}/history`);

            console.log('✅ Received history:', data);
            setHistory(data);
        } catch (error) {
            console.error('❌ Error fetching user history:', error.response || error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!history) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center max-w-sm">
                    <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <h2 className="text-lg font-bold text-slate-900 mb-1">User Not Found</h2>
                    <p className="text-slate-500 mb-4 text-xs">We couldn't find any information for the requested citizen.</p>
                    <button onClick={() => navigate('/admin/users')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors text-sm">Back to Users</button>
                </div>
            </div>
        );
    }

    const { user, uploads, redemptions } = history;

    // Combine and sort events
    const timelineEvents = [
        ...(uploads || []).map(u => ({ ...u, type: 'upload' })),
        ...(redemptions || []).map(r => ({ ...r, type: 'redemption' }))
    ].sort((a, b) => new Date(b.upload_date || b.request_date) - new Date(a.upload_date || a.request_date));

    const filteredEvents = timelineEvents.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'uploads') return e.type === 'upload';
        if (filter === 'redemptions') return e.type === 'redemption';
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/users')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">Citizen History</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.name} • {user.user_id}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'uploads', 'redemptions'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${filter === f ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* User Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                <Sprout className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Flora</p>
                                <p className="text-lg font-black text-slate-900 tabular-nums">{user.saplingsOwned?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Carbon Offset</p>
                                <p className="text-lg font-black text-slate-900 tabular-nums">{(user?.total_carbon || 0).toFixed(1)} kg</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                <Gift className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">EcoCoins Balance</p>
                                <p className="text-lg font-black text-slate-900 tabular-nums">{user.reward_points || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-6">
                        {filteredEvents.length === 0 ? (
                            <div className="ml-16 py-12 text-center">
                                <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 font-medium text-xs">No activity records found.</p>
                            </div>
                        ) : (
                            filteredEvents.map((event, idx) => (
                                <div key={event._id || idx} className="relative pl-16 group">
                                    {/* Timeline Marker */}
                                    <div className={`absolute left-[21px] top-5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-2 ring-slate-50 transition-all ${event.type === 'upload' ? 'bg-green-500' : 'bg-purple-500'}`} />

                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                {event.type === 'upload' ? (
                                                    <div className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full tracking-widest">Recorded</div>
                                                ) : (
                                                    <div className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase rounded-full tracking-widest">Redeemed</div>
                                                )}
                                                <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(event.upload_date || event.request_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {event.verified || event.status === 'Approved' || event.status === 'Redeemed' ? (
                                                    <div className="flex items-center gap-1 text-green-600 font-bold text-[10px]">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> {event.status === 'Redeemed' ? 'Redeemed' : 'Verified'}
                                                    </div>
                                                ) : event.status === 'Rejected' ? (
                                                    <div className="flex items-center gap-1 text-red-600 font-bold text-[10px]">
                                                        <XCircle className="w-3.5 h-3.5" /> Rejected
                                                    </div>
                                                ) : (
                                                    <div className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-md">Pending</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            {event.type === 'upload' && event.imageIpfsHash && (
                                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                                                    <img
                                                        src={`https://gateway.pinata.cloud/ipfs/${event.imageIpfsHash}`}
                                                        alt="Update"
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        onError={(e) => {
                                                            e.target.src = 'https://images.unsplash.com/photo-1592150621344-82d67abb9dfa?w=128&h=128&fit=crop';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                {event.type === 'upload' ? (
                                                    <>
                                                        <h4 className="text-sm font-black text-slate-900 mb-2">Growth Verification: {event.sapling_id}</h4>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Impact</p>
                                                                <p className="text-xs font-black text-slate-900">+{event.carbon_calculated}kg</p>
                                                            </div>
                                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Reward</p>
                                                                <p className="text-xs font-black text-slate-900">+{event.eco_coins_awarded} coins</p>
                                                            </div>
                                                            <div className="p-2 bg-slate-50 rounded-lg">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Health</p>
                                                                <p className="text-xs font-black text-green-600">{event.plant_status}</p>
                                                            </div>
                                                        </div>
                                                        {event.location?.latitude !== undefined && event.location?.longitude !== undefined && (
                                                            <div className="mt-2 flex items-center gap-1.5 text-slate-400 text-[9px] font-medium">
                                                                <MapPin className="w-3 h-3" />
                                                                {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <h4 className="text-sm font-black text-slate-900 mb-1">{event.reward_name}</h4>
                                                        <p className="text-xs font-medium text-slate-500 mb-2">{event.reward_type} redemption attempt.</p>
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
                                                            <Gift className="w-3 h-3" />
                                                            Cost: {event.eco_coins_required} Coins
                                                        </div>
                                                    </>
                                                )}

                                                {event.admin_remarks && (
                                                    <div className="mt-4 p-3 bg-green-600 rounded-xl text-[10px] text-white font-medium">
                                                        <span className="text-white font-bold block mb-0.5 uppercase tracking-widest text-[8px]">Admin Feedback</span>
                                                        "{event.admin_remarks}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserHistory;
