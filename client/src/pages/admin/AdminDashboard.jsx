import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sprout, Users, Image, Calculator, Gift, LogOut, Bell, Award, Truck, TrendingUp, Package, ArrowLeft, Leaf } from 'lucide-react';

import axios from 'axios';
import { API_URL } from '../../config';

const AdminDashboard = () => {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalSaplings: 0,
        totalUsers: 0,
        totalCarbon: 0,
        pendingVerifications: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/admin/stats`);

                setStats(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ icon: Icon, label, value, color, onClick, actionLabel }) => (
        <div
            onClick={onClick}
            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group`}
        >
            <div className="flex items-center justify-between mb-1">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                    <h3 className="text-xl font-black text-gray-900 mt-0.5">{value}</h3>
                </div>
                <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
                </div>
            </div>
            {actionLabel && (
                <div className={`text-[9px] font-bold ${color.replace('bg-', 'text-')} mt-1 flex items-center gap-1 group-hover:translate-x-1 transition-transform uppercase tracking-wider`}>
                    {actionLabel} &rarr;
                </div>
            )}
        </div>
    );

    const NavItem = ({ icon: Icon, label, path }) => (
        <button
            onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors group"
        >
            <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-xs">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <Leaf className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">GreenMark</h1>
                            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mt-0.5">Admin Console</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <p className="text-xs font-bold text-gray-900">{admin?.name || 'Administrator'}</p>
                            <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase">Super Admin</span>
                        </div>
                        <button
                            onClick={() => { logout('admin'); navigate('/'); }}
                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-3">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-20">
                            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Navigation</h3>
                            <div className="space-y-0.5">
                                <NavItem icon={LayoutDashboard} label="Overview" path="/admin/dashboard" />
                                <NavItem icon={Sprout} label="Sapling Inventory" path="/admin/saplings" />
                                <NavItem icon={Users} label="User Directory" path="/admin/users" />
                                <NavItem icon={Image} label="Image Verifications" path="/admin/verify" />
                                <NavItem icon={Award} label="Carbon Certification" path="/admin/certification" />
                                <NavItem icon={Truck} label="Order Management" path="/admin/orders" />
                                <NavItem icon={Gift} label="Reward Catalog" path="/admin/rewards/catalog" />
                                <NavItem icon={Bell} label="Redemption Requests" path="/admin/rewards" />
                                <NavItem icon={Package} label="Sapling Deliveries" path="/admin/sapling-orders" />
                                <NavItem icon={TrendingUp} label="Carbon Metrics" path="/admin/carbon" />

                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-9 space-y-6">

                        <div className="flex items-end justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Sustainability Intelligence</h2>
                                <p className="text-xs text-gray-500 font-medium">Real-time ecosystem metrics and growth analytics.</p>
                            </div>
                        </div>

                        {/* Main Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            <StatCard
                                icon={Calculator}
                                label="Total Carbon"
                                value={`${stats.totalCarbon} kg`}
                                color="bg-teal-600"
                                onClick={() => navigate('/admin/carbon')}
                            />
                            <StatCard
                                icon={Award}
                                label="Certifications"
                                value="Manage"
                                color="bg-purple-600"
                                onClick={() => navigate('/admin/certification')}
                                actionLabel="Issue Now"
                            />

                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {/* Recent Growth Activity */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Recent Activity</h3>
                                </div>
                                <div>
                                    {stats.recentActivity?.length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {stats.recentActivity.map((act) => (
                                                <div key={act.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                                            <Sprout className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-xs">{act.userName}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium">{act.saplingId} • {new Date(act.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-green-600">+{act.carbon} kg</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <Image className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-gray-400 font-bold text-xs">No activity yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Contributors Leaderboard */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    Top Contributors
                                </h3>
                                <div className="space-y-4">
                                    {stats.topUsers?.map((u, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    i === 1 ? 'bg-gray-100 text-gray-600' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{u.name}</p>
                                                    <p className="text-[9px] text-gray-400 font-medium">{u.reward_points} EcoCoins</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-teal-600">{u.total_carbon.toFixed(1)}kg</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </main >
        </div >
    );
};

export default AdminDashboard;
