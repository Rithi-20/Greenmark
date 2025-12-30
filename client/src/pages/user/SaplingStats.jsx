import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Sprout,
    Calculator,
    Activity,
    BadgeCheck,
    History,
    TrendingUp,
    Award
} from 'lucide-react';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const SaplingStats = () => {
    const { saplingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSaplingStats();
    }, [saplingId]);

    const fetchSaplingStats = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/user/saplings/${saplingId}/stats`);
            setStats(data); // data is { sapling, history }
        } catch (err) {
            console.error('Fetch Stats Error:', err);
            const msg = err.response?.data?.message || 'Failed to load sustainability metrics.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-bold text-sm">Calculating...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="text-center p-6 bg-white rounded-2xl shadow-xl border border-red-50">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Metrics Unavailable</h2>
                    <p className="text-gray-500 mb-6 text-sm">{error || 'Could not find data for this sapling.'}</p>
                    <button onClick={() => navigate('/user/my-forest')} className="bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm">Return to My Forest</button>
                </div>
            </div>
        );
    }

    const { sapling, history } = stats;

    // Calculate Metrics locally since backend doesn't provide them
    const metrics = {
        totalCarbon: history.reduce((acc, curr) => acc + (curr.carbon_calculated || 0), 0).toFixed(1),
        totalUploads: history.length,
        verifiedCount: history.filter(h => h.verified).length,
        avgHealth: 98 // Placeholder or calculated based on status
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-10">
            {/* Glassmorphic Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => navigate('/user/my-forest')} className="p-2 hover:bg-gray-100 rounded-xl transition-all group">
                        <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-gray-900 leading-tight">{sapling.plant_name}</h1>
                        <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">{sapling.sapling_id}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <Sprout className="w-5 h-5 text-green-600 font-black" />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Hero Stats Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-green-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">Sustainability Champion</span>
                            <h2 className="text-3xl md:text-5xl font-black mb-1 antialiased">
                                {metrics.totalCarbon} <span className="text-xl md:text-2xl font-bold opacity-80">kg CO2</span>
                            </h2>
                            <p className="text-green-50 font-medium text-xs max-w-sm">Total carbon offset by this tree through your consistent care.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
                                <Activity className="w-5 h-5 mx-auto mb-1 text-green-300" />
                                <p className="text-lg font-black">{metrics.avgHealth}%</p>
                                <p className="text-[9px] font-bold uppercase opacity-70">Avg Health</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center">
                                <Award className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
                                <p className="text-lg font-black">{metrics.verifiedCount}</p>
                                <p className="text-[9px] font-bold uppercase opacity-70">Verified Updates</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Calculator className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Offset</p>
                            <h4 className="text-xl font-black text-gray-900">{metrics.totalCarbon} kg</h4>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 group hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <History className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Activity Log</p>
                            <h4 className="text-xl font-black text-gray-900">{metrics.totalUploads} Uploads</h4>
                        </div>
                    </div>
                </div>

                {/* History & Gallery Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Growth Journey</h3>
                            <p className="text-xs text-gray-500 font-medium">Historical timeline of your plant updates</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {history && history.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {history.map((log) => (
                                    <div key={log._id} className="group rounded-xl bg-gray-50 overflow-hidden border border-gray-100 hover:border-green-200 transition-all shadow-sm">
                                        <div className="aspect-[4/3] overflow-hidden">
                                            <img
                                                src={log.ipfs_gateway_url || (log.image_ipfs_hash?.startsWith('http') ? log.image_ipfs_hash : `${BASE_URL}${log.image_ipfs_hash}`)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                alt="Growth Update"
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1592150621344-82d67abb9dfa?w=400'; }}
                                            />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-gray-400">{new Date(log.upload_date).toLocaleDateString()}</span>
                                                <BadgeCheck className={`w-4 h-4 ${log.verified ? 'text-green-600' : 'text-gray-300'}`} />
                                            </div>
                                            <h5 className="text-sm font-black text-gray-900 mb-1">{log.plant_status}</h5>
                                            <p className="text-xs text-gray-500 line-clamp-2 italic">"{log.growth_indicators}"</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-gray-400 font-bold mb-3 text-sm">No growth updates yet.</p>
                                <button
                                    onClick={() => navigate('/user/upload')}
                                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-xs"
                                >
                                    Upload First Update
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SaplingStats;
