import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, TrendingUp, Users, Sprout, ArrowUpRight, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CarbonMetrics = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, verifyRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`),
                axios.get(`${API_URL}/admin/verified-uploads`)
            ]);
            setStats(statsRes.data);
            setVerifications(verifyRes.data);
        } catch (error) {
            console.error('Error fetching carbon metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Environmental Impact</h1>
                            <p className="text-slate-500 font-medium text-sm">Global carbon offset monitoring and verification log.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={Cloud}
                        label="Total Carbon Saved"
                        value={`${stats?.totalCarbon || 0} kg`}
                        sub="Across all projects"
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Avg Growth"
                        value={`${verifications.length > 0 ? (verifications.reduce((a, b) => a + (b.growthComparison?.growthEstimate || 0), 0) / verifications.length).toFixed(1) : 0}%`}
                        sub="Per Sapling"
                        color="text-green-600"
                        bg="bg-green-50"
                    />
                    <StatCard
                        icon={Users}
                        label="Active Planters"
                        value={stats?.totalUsers || 0}
                        sub="Contributing citizens"
                        color="text-purple-600"
                        bg="bg-purple-50"
                    />
                    <StatCard
                        icon={Sprout}
                        label="Total Uploads"
                        value={verifications.length}
                        sub="Verified updates"
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                </div>

                {/* GRAPH SECTION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Monthly Carbon Offset
                        </h2>
                        <div className="flex gap-2">
                            <div className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                                Live Data
                            </div>
                        </div>
                    </div>

                    <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
                        {stats?.monthlyCarbon && stats.monthlyCarbon.length > 0 ? (
                            <ResponsiveContainer width="99%" height="100%">
                                <AreaChart
                                    data={stats.monthlyCarbon}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="carbon"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCarbon)"
                                        dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Cloud className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm">No carbon data available.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Impact Verification Log
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Planter</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plant ID</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Offset & Score</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {verifications.map((v) => (
                                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-900 text-sm">{v.user_id}</p>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-600 text-sm">{v.sapling_id}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-slate-900 text-sm">+{v.carbon_calculated}kg</span>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">Score: {v.authenticity?.score || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs font-medium">
                                            {new Date(v.upload_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
        <div className={`w-10 h-10 ${bg} ${color} rounded-lg flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform`}>
            <Icon className="w-5 h-5" />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h3 className="text-lg font-black text-slate-900 mb-0.5">{value}</h3>
        <p className="text-[10px] text-slate-400 font-medium">{sub}</p>
    </div>
);

export default CarbonMetrics;
