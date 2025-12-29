import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, MapPin, Phone, CheckCircle, LogOut, Package, Clock, Navigation, Briefcase, RefreshCw, ArrowLeft, Leaf } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import axios from 'axios';
import { API_URL } from '../../config';


const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'new'
    const [myOrders, setMyOrders] = useState([]);
    const [availableOrders, setAvailableOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Map order_id -> otp
    const [otpInput, setOtpInput] = useState({});

    useEffect(() => {
        const stored = localStorage.getItem('delivery_user');
        if (!stored) {
            navigate('/delivery/login');
        } else {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            fetchData(parsed._id);

            // Auto-refresh every 5 seconds for snappy updates
            const interval = setInterval(() => {
                fetchData(parsed._id);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [navigate]);

    const fetchData = async (userId) => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMyOrders(userId),
                fetchAvailableOrders()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyOrders = async (id) => {
        try {
            // Fetch both redemption and sapling orders assigned to this delivery partner
            const [redemptionRes, saplingRes] = await Promise.all([
                axios.get(`${API_URL}/delivery/orders/${id}`),
                axios.get(`${API_URL}/sapling-orders/list?role=delivery&partnerId=${id}`) // Add this query in controller if needed
            ]);

            // The server now returns ONLY orders for this partner when partnerId is passed
            const mappedSaplings = saplingRes.data.map(o => ({
                ...o,
                id: o._id,
                type: 'sapling',
                product_name: `Sapling: ${o.plant_name}`,
                customer_name: `User: ${o.user_id}`,
                customer_mobile: o.delivery_address?.phone || 'N/A',
                estimated_days: 'Sapling Delivery',
                isSapling: true
            }));

            setMyOrders([...redemptionRes.data, ...mappedSaplings]);

            if (redemptionRes.data.length === 0 && mappedSaplings.length === 0 && activeTab === 'active') {
                setActiveTab('new');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAvailableOrders = async () => {
        try {
            const [redemptionRes, saplingRes] = await Promise.all([
                axios.get(`${API_URL}/delivery/available`),
                axios.get(`${API_URL}/sapling-orders/list?role=delivery`)
            ]);

            const mappedSaplings = saplingRes.data.map(o => ({
                ...o,
                id: o._id,
                type: 'sapling',
                product_name: `Sapling: ${o.plant_name}`,
                customer_name: `User: ${o.user_id}`,
                customer_mobile: o.delivery_address?.phone || 'N/A',
                estimated_days: 'New Sapling',
                isSapling: true
            }));

            setAvailableOrders([...redemptionRes.data, ...mappedSaplings]);
        } catch (err) {
            console.error(err);
        }
    };


    const handleAcceptOrder = async (orderId) => {
        if (!user) return;
        try {
            const order = availableOrders.find(o => o.order_id === orderId);

            if (order?.isSapling) {
                await axios.patch(`${API_URL}/sapling-orders/${orderId}/status`, {
                    status: 'assigned',
                    deliveryPartnerId: user._id
                });
            } else {
                await axios.post(`${API_URL}/delivery/accept`, {
                    order_id: orderId,
                    delivery_id: user._id
                });
            }

            await fetchData(user._id);
            setActiveTab('active');
            alert('Order Accepted! Added to your route.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept order');
            fetchAvailableOrders();
        }
    };

    const verifyDelivery = async (orderId) => {
        const otp = otpInput[orderId];
        if (!otp || otp.length < 4) return alert('Enter valid OTP');

        try {
            const order = myOrders.find(o => o.order_id === orderId);

            if (order?.isSapling) {
                await axios.patch(`${API_URL}/sapling-orders/${orderId}/status`, {
                    status: 'delivered',
                    otp
                });
            } else {
                await axios.post(`${API_URL}/delivery/verify`, {
                    order_id: orderId,
                    otp
                });
            }

            alert('Delivery Verified!');
            if (user) fetchMyOrders(user._id);
            setOtpInput(prev => ({ ...prev, [orderId]: '' }));
        } catch (err) {
            alert(err.response?.data?.message || 'Verification Failed');
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('delivery_user');
        navigate('/delivery/login');
    };

    const displayedOrders = activeTab === 'active' ? myOrders : availableOrders;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Minimalist Tech Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <Leaf className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-sm text-slate-900 leading-tight">GreenMark</h1>
                            <div className="flex items-center gap-1.5">
                                <span className={`relative flex h-2 w-2 ${user ? '' : 'hidden'}`}>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Delivery • {user?.name?.split(' ')[0]}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-6 space-y-6">
                {/* Debug Info */}
                <div className="text-[8px] text-gray-300 opacity-50 flex flex-wrap gap-2">
                    M: {myOrders.length} | A: {availableOrders.length} | L: {loading ? 'Y' : 'N'}
                    | UID: {user?._id?.slice(-4)}
                    {availableOrders.length > 0 && `| A1: ${availableOrders[0].order_id}`}
                    {myOrders.length > 0 && `| M1: ${myOrders[0].order_id}`}
                </div>

                {/* Status Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl shadow-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                                {activeTab === 'active' ? 'My Assigned Tasks' : 'Available Opportunities'}
                            </p>
                            <h2 className="text-3xl font-black">{displayedOrders.length} <span className="text-sm font-bold text-slate-500">Orders</span></h2>
                        </div>
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                            {activeTab === 'active' ? <Package className="w-5 h-5 text-white" /> : <Briefcase className="w-5 h-5 text-yellow-400" />}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'active'
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        My Route ({myOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === 'new'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:bg-gray-50'
                            }`}
                    >
                        New Orders ({availableOrders.length})
                    </button>
                </div>

                {/* List Header */}
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                        {activeTab === 'active' ? 'Current Manifest' : 'Grab & Go'}
                    </h3>
                    <button
                        onClick={() => user && fetchData(user._id)}
                        className="text-[10px] font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-100 shadow-sm transition-colors"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {displayedOrders.length === 0 ? (
                        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-sm font-black text-gray-900">All caught up!</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {activeTab === 'active' ? 'No deliveries assigned to you yet.' : 'No new orders available nearby.'}
                            </p>
                        </div>
                    ) : (
                        displayedOrders.map(order => (
                            <div key={order._id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group animate-in slide-in-from-bottom-2">
                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                                    <div className="max-w-[70%]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${order.type === 'money' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {order.type === 'money' ? 'Cash Pickup' : 'Delivery'}
                                            </span>
                                            {order.amount_value && <span className="text-[10px] font-bold text-gray-500">₹{order.amount_value}</span>}
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{order.product_name}</h3>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                            <Clock className="w-3 h-3" />
                                            {order.estimated_days}
                                        </div>
                                    </div>
                                </div>

                                {/* Address Section */}
                                <div className="space-y-3 mb-4">
                                    {(() => {
                                        // Address Logic Handling
                                        const loc = order.delivery_address || {};
                                        const line1 = loc.address_line_1 || loc.line1 || '';
                                        const line2 = loc.address_line_2 || loc.line2 || '';
                                        const city = loc.city || '';
                                        const state = loc.state || '';
                                        const pincode = loc.pincode || '';
                                        const rawParts = [line1, line2, city, state, pincode].map(p => p ? p.trim() : '').filter(Boolean);
                                        let finalAddress = rawParts.join(', ');

                                        if (!finalAddress && order.customer_address) {
                                            if (typeof order.customer_address === 'string') {
                                                finalAddress = order.customer_address;
                                            } else if (typeof order.customer_address === 'object') {
                                                const uLoc = order.customer_address;
                                                finalAddress = [uLoc.address_line_1, uLoc.address_line_2, uLoc.city, uLoc.state, uLoc.pincode].map(s => s?.trim()).filter(Boolean).join(', ');
                                            }
                                        }
                                        if (finalAddress) finalAddress = finalAddress.replace(/\s+,/g, ',').replace(/,+/g, ',').replace(/\s+/g, ' ').trim();

                                        const mapDestination = finalAddress ? encodeURIComponent(`"${finalAddress}"`) : '';

                                        return (
                                            <div className="flex gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                <div className="mt-0.5">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-gray-700 leading-relaxed mb-1">
                                                        {finalAddress || 'Address not provided'}
                                                    </p>
                                                    {mapDestination && activeTab === 'active' && (
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${mapDestination}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-700 transition-colors"
                                                        >
                                                            <Navigation className="w-3 h-3" /> Navigate
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="flex items-center gap-3 px-1">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{order.customer_name} <span className="text-gray-400 font-normal">({order.user_id})</span></p>
                                            {activeTab === 'active' && (
                                                <a href={`tel:${order.customer_mobile}`} className="text-[10px] font-bold text-blue-600 hover:underline">
                                                    {order.customer_mobile}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Area */}
                                {activeTab === 'new' ? (
                                    <button
                                        onClick={() => handleAcceptOrder(order.order_id)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg shadow-blue-100 transition-all text-xs tracking-wide flex items-center justify-center gap-2"
                                    >
                                        <Briefcase className="w-4 h-4" />
                                        ACCEPT ORDER
                                    </button>
                                ) : (
                                    <div className="bg-slate-900 p-1 rounded-xl flex gap-1 shadow-lg shadow-slate-200">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            placeholder="ENTER OTP"
                                            className="flex-1 bg-transparent text-white text-center font-black tracking-[0.2em] text-sm focus:outline-none placeholder:text-slate-600"
                                            value={otpInput[order.order_id] || ''}
                                            onChange={(e) => setOtpInput({ ...otpInput, [order.order_id]: e.target.value })}
                                            onClick={(e) => e.target.select()}
                                        />
                                        <Button
                                            onClick={() => verifyDelivery(order.order_id)}
                                            className="bg-green-500 hover:bg-green-400 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all border-none"
                                        >
                                            VERIFY
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default DeliveryDashboard;
