import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Wallet, PieChart, CheckCircle2, XCircle, TrendingUp, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const RewardManagement = () => {
    const navigate = useNavigate();
    const [redemptions, setRedemptions] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [redRes, userRes] = await Promise.all([
                axios.get(`${API_URL}/admin/redemptions`),
                axios.get(`${API_URL}/admin/users`)
            ]);
            setRedemptions(redRes.data);
            setUsers(userRes.data.sort((a, b) => b.reward_points - a.reward_points));
        } catch (error) {
            console.error('Error fetching reward data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await axios.post(`${API_URL}/admin/redemptions/${id}/${action}`, {

                adminId: 'ADMIN-001', // Should be dynamic
                remarks: action === 'reject' ? 'Criteria not met.' : undefined
            });
            fetchData();
        } catch (error) {
            alert('Failed to process redemption: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Loading Reward Hub...</div>;

    const pendingCount = redemptions.filter(r => r.status === 'Pending').length;

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Rewards & Redemptions</h1>
                            <p className="text-slate-500 font-medium">Manage citizen gift requests and EcoCoin economies.</p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-purple-50/30">
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-purple-600" />
                                    Redemption Requests
                                    {pendingCount > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                                            {pendingCount} New
                                        </span>
                                    )}
                                </h2>
                            </div>

                            <div className="divide-y divide-slate-50">
                                {redemptions.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400 font-medium italic">No redemption requests yet.</div>
                                ) : (
                                    redemptions.map((r) => (
                                        <div key={r._id} className="p-8 hover:bg-slate-50 transition-colors flex flex-col gap-6">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${r.redeem_type === 'money' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                                                        {r.redeem_type === 'money' ? <Wallet className="w-7 h-7" /> : <Gift className="w-7 h-7" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black text-slate-900">{r.reward_name}</p>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                            <span>{r.user_id}</span>
                                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="text-purple-600">{r.eco_coins_used} Coins</span>
                                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="uppercase border border-slate-200 px-1.5 rounded text-[10px]">{r.method}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${r.status === 'Approved' ? 'bg-orange-100 text-orange-700' :
                                                    r.status === 'Redeemed' ? 'bg-green-100 text-green-700' :
                                                        r.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {r.status}
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="flex items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                                <div className="text-xs text-slate-500 font-medium">
                                                    <span className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Info</span>
                                                    {r.status === 'Pending' ? `Requested on ${new Date(r.created_at).toLocaleDateString()}` :
                                                        r.status === 'Approved' ? `Code: ${r.redemption_code} (User Must Show)` :
                                                            r.status === 'Redeemed' ? `Redeemed on ${new Date(r.redeemed_date).toLocaleDateString()}` :
                                                                `Note: ${r.admin_remarks}`}
                                                </div>

                                                <div className="flex gap-2">
                                                    {r.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(r._id, 'approve')}
                                                                className="px-4 py-2 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                                                            >
                                                                Approve & Gen Code
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(r._id, 'reject')}
                                                                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-lg hover:bg-slate-50 transition-colors"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === 'Approved' && (
                                                        <button
                                                            onClick={() => handleAction(r._id, 'redeem')}
                                                            className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 flex items-center gap-2"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" /> Mark Redeemed
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-green-600 p-8 rounded-[40px] text-white">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                Economy Overview
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Points Awarded</p>
                                    <p className="text-3xl font-black text-white">{users.reduce((acc, u) => acc + (u.reward_points || 0), 0)}</p>
                                </div>
                                <div className="h-px bg-slate-800" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Citizens</p>
                                    <p className="text-2xl font-black text-white">{users.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-blue-600" />
                                Top Point Holders
                            </h3>
                            <div className="space-y-4">
                                {users.slice(0, 5).map((u, i) => (
                                    <div key={u._id} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-300">#0{i + 1}</span>
                                            <p className="text-sm font-bold text-slate-700">{u.name.split(' ')[0]}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{u.reward_points}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardManagement;
