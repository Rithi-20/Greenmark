import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sprout, Cloud, Gift, Award, QrCode, Settings, LogOut, TrendingUp, ChevronRight, Bell, XCircle, Info, Calendar, Store, ArrowLeft, Leaf } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

// --- Components defined outside to prevent re-renders ---

const getRank = (points) => {
    if (points >= 1000) return { name: 'Ecosystem Guardian', color: 'text-purple-600', bg: 'bg-purple-50' };
    if (points >= 500) return { name: 'Green Warrior', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (points >= 100) return { name: 'Active Planter', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    return { name: 'Seedling Member', color: 'text-slate-600', bg: 'bg-slate-50' };
};

const StatCard = ({ icon: Icon, label, value, color, onClick, actionLabel }) => (
    <div
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-full"
    >
        <div className="flex items-center justify-between mb-3">
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                <h3 className="text-2xl font-black text-gray-900 tabular-nums">{value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        {actionLabel && (
            <div className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${color.replace('bg-', 'text-')} group-hover:translate-x-1 transition-transform`}>
                {actionLabel} <ChevronRight className="w-3 h-3" />
            </div>
        )}
    </div>
);

const ActionCard = ({ icon: Icon, label, description, onClick, color, badge }) => (
    <button
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-100 transition-all text-left group relative overflow-hidden w-full"
    >
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 w-fit mb-4 group-hover:rotate-12 transition-transform`}>
            <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        {badge && (
            <span className="absolute top-6 right-6 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                {badge}
            </span>
        )}
        <h3 className="text-base font-black text-gray-900 mb-1">{label}</h3>
        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[90%]">{description}</p>
        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-gray-900 group-hover:translate-x-1 transition-transform">
            Explore <ChevronRight className="w-4 h-4" />
        </div>
    </button>
);

const OrdersList = ({ userId }) => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (userId) {
            const fetchAll = async () => {
                try {
                    const [redemptionRes, saplingRes] = await Promise.all([
                        axios.get(`${API_URL}/user/${userId}/orders`),
                        axios.get(`${API_URL}/sapling-orders/list?role=user&userId=${userId}`)
                    ]);

                    const redemptionData = Array.isArray(redemptionRes.data) ? redemptionRes.data : [];
                    const saplingData = Array.isArray(saplingRes.data) ? saplingRes.data.map(o => ({
                        ...o,
                        product_name: `Sapling: ${o.plant_name}`,
                        type: 'sapling',
                        verification_code: o.otp,
                        method: o.delivery_method === 'online_delivery' ? 'online' : 'offline'
                    })) : [];

                    setOrders([...redemptionData, ...saplingData]);
                } catch (err) {
                    console.error(err);
                    setOrders([]);
                }
            };
            fetchAll();
        }
    }, [userId]);

    const activeOrders = orders.filter(o =>
        !['Delivered', 'Money Delivered', 'Cancelled', 'delivered', 'cancelled'].includes(o.status)
    );

    if (activeOrders.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center animate-pulse">
                    <Store className="w-3 h-3 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Active Deliveries</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeOrders.map(order => (
                    <div key={order.order_id} className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[9px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                            {order.status}
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 mt-3 mb-0.5">{order.product_name}</h4>
                        <p className="text-[9px] text-gray-500 font-bold mb-3">ID: {order.order_id}</p>

                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Amount</p>
                                <p className="text-[10px] font-bold text-gray-900">{order.type === 'money' ? `₹${order.amount_value}` : 'Product'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
                                <p className="text-[10px] font-bold text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* OTP BOX */}
                        <div className="bg-slate-900 text-white p-3 rounded-lg relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Verification Code</p>
                                    <p className="text-lg font-bold tracking-widest text-white">{order.verification_code}</p>
                                </div>
                                <QrCode className="w-6 h-6 text-white opacity-20" />
                            </div>
                        </div>

                        {order.method === 'offline' && (
                            <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                <Store className="w-3 h-3" /> Shop Pickup Required
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Component ---

const UserDashboard = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalSaplings: 0,
        totalCarbon: 0,
        ecoCoins: 0
    });
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (!loading && !user) navigate('/login');
    }, [user, loading, navigate]);

    useEffect(() => {
        if (user) {
            const fetchStats = async () => {
                try {
                    const { data } = await axios.get(`${API_URL}/user/${user.user_id}/stats`);
                    setStats(data);
                } catch (error) {
                    console.error('Stats fetch error:', error);
                }
            };

            const fetchNotifications = async () => {
                try {
                    const { data } = await axios.get(`${API_URL}/user/${user.user_id}/notifications`);
                    setNotifications(Array.isArray(data) ? data : []);
                } catch (error) {
                    console.error('Notification fetch error:', error);
                }
            };

            fetchStats();
            fetchNotifications();

            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const markAsRead = async (id) => {
        try {
            await axios.post(`${API_URL}/user/notifications/${id}/read`);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Mark read error:', error);
        }
    };

    const rank = getRank(stats.ecoCoins);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <Leaf className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight antialiased">GreenMark</h1>
                            <div className="flex items-center gap-1.5 -mt-0.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Active Member</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`p-2 rounded-lg transition-all relative ${showNotifications ? 'bg-green-600 text-white' : 'bg-white text-gray-400 hover:text-green-600 border border-gray-100'}`}
                            >
                                <Bell className="w-4 h-4" />
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 border border-white rounded-full" />
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-4">
                                    <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Alerts</h3>
                                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">
                                            {notifications.filter(n => !n.read).length} New
                                        </span>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto">
                                        {notifications.filter(n => !n.read).length === 0 ? (
                                            <div className="p-6 text-center">
                                                <Info className="w-5 h-5 text-gray-200 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold text-gray-400">All caught up!</p>
                                            </div>
                                        ) : (
                                            notifications.filter(n => !n.read).map((n) => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => markAsRead(n._id)}
                                                    className={`p-3 border-b border-gray-50 cursor-pointer transition-colors relative group ${n.read ? 'opacity-60' : 'bg-white hover:bg-slate-50'}`}
                                                >
                                                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />}
                                                    <div className="flex gap-3">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'health' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {n.type === 'health' ? <XCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900 mb-0.5 group-hover:text-green-600 transition-colors">{n.title}</p>
                                                            <p className="text-[9px] text-gray-500 font-medium leading-relaxed mb-1">{n.message}</p>
                                                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                <Calendar className="w-2.5 h-2.5" />
                                                                {new Date(n.sent_date).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowNotifications(false)}
                                        className="w-full py-3 text-[9px] font-black text-gray-400 hover:text-gray-900 border-t border-gray-50 transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="hidden md:block text-right">
                            <p className="text-xs font-bold text-gray-900">{user?.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{user?.email}</p>
                        </div>
                        <div className="w-px h-5 bg-gray-100" />
                        <button
                            onClick={() => { logout(); navigate('/'); }}
                            className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm group"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Hero Greeting & Rank */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 mb-2 antialiased">
                            Welcome Back, <span className="text-green-600">{user?.name?.split(' ')[0]}</span>! 👋
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">Your forest has absorbed <span className="text-gray-900 font-bold">{stats.totalCarbon}kg</span> of CO2 this year.</p>
                    </div>
                    <div className={`${rank.bg} ${rank.color} px-4 py-2 rounded-2xl border border-white flex items-center gap-3 shadow-md`}>
                        <Award className="w-6 h-6" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Current Rank</p>
                            <p className="text-sm font-black">{rank.name}</p>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                    <StatCard
                        icon={Sprout}
                        label="Active Saplings"
                        value={stats.totalSaplings}
                        color="bg-green-600"
                        onClick={() => navigate('/user/my-forest')}
                    />
                    <StatCard
                        icon={Cloud}
                        label="Carbon Offset (kg)"
                        value={stats.totalCarbon}
                        color="bg-blue-600"
                        onClick={() => navigate('/user/certificates')}
                    />
                    <StatCard
                        icon={Gift}
                        label="EcoCoins"
                        value={stats.ecoCoins}
                        color="bg-purple-600"
                        onClick={() => navigate('/user/rewards')}
                        actionLabel="Redeem"
                    />
                    <StatCard
                        icon={Store}
                        label="Orders"
                        value="History"
                        color="bg-amber-500"
                        onClick={() => navigate('/user/orders')}
                        actionLabel="View"
                    />
                </div>

                {/* Active Orders Section */}
                <OrdersList userId={user?.user_id} />

                {/* Dashboard Operations */}
                <div className="mb-4 flex items-center gap-3">
                    <h3 className="text-base font-bold text-gray-900 whitespace-nowrap">Quick Actions</h3>
                    <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <ActionCard
                        icon={QrCode}
                        label="Register Plant"
                        description="Scan QR code to register a new sapling."
                        onClick={() => navigate('/user/register-sapling')}
                        color="bg-green-600"
                        badge="New"
                    />
                    <ActionCard
                        icon={TrendingUp}
                        label="My Forest"
                        description="Monitor growth & upload monthly photos."
                        onClick={() => navigate('/user/my-forest')}
                        color="bg-emerald-600"
                    />
                    <ActionCard
                        icon={Award}
                        label="Certificates"
                        description="Download carbon offset certificates."
                        onClick={() => navigate('/user/certificates')}
                        color="bg-amber-600"
                    />
                    <ActionCard
                        icon={Settings}
                        label="Profile"
                        description="Manage account & environmental identity."
                        onClick={() => navigate('/user/settings')}
                        color="bg-slate-700"
                    />
                </div>
            </main>

            <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-100 flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                    <Sprout className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">GreenMark Ecosystem</p>
                <p className="text-gray-300 text-[9px] font-bold">Driving individual planet-positive actions since 2025</p>
            </footer>
        </div>
    );
};

export default UserDashboard;
