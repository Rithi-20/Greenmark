import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, MapPin, Store, CheckCircle, Clock, XCircle, ChevronRight, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';


const UserOrders = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            const [redemptionRes, saplingRes] = await Promise.all([
                axios.get(`${API_URL}/user/${user.user_id}/orders`),
                axios.get(`${API_URL}/sapling-orders/list?role=user&userId=${user.user_id}`)
            ]);

            const mappedSaplings = saplingRes.data.map(o => ({
                ...o,
                id: o._id,
                product_name: `Sapling: ${o.plant_name}`,
                type: 'sapling',
                method: o.delivery_method.replace('_', ' '),
                isSapling: true
            }));

            setOrders([...redemptionRes.data, ...mappedSaplings]);
        } catch (error) {
            console.error('Fetch User Orders Error:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const StatusBadge = ({ status }) => {
        const styles = {
            'Delivered': 'bg-green-100 text-green-700',
            'Money Delivered': 'bg-green-100 text-green-700',
            'Pending': 'bg-blue-100 text-blue-700',
            'Processing': 'bg-amber-100 text-amber-700',
            'Assigned': 'bg-purple-100 text-purple-700',
            'Out for Delivery': 'bg-indigo-100 text-indigo-700',
            'Cancelled': 'bg-red-100 text-red-700',
            'pending_photo': 'bg-orange-100 text-orange-700',
            'ready_for_pickup': 'bg-green-100 text-green-700',
            'assigned': 'bg-purple-100 text-purple-700',
            'in_transit': 'bg-indigo-100 text-indigo-700',
            'delivered': 'bg-green-100 text-green-700'
        };

        const style = styles[status] || 'bg-gray-100 text-gray-700';

        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style}`}>
                {status}
            </span>
        );
    };

    const filteredOrders = orders.filter(o =>
        o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-gray-900">Your Orders</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">History & Details</p>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Search */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg font-bold text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-100"
                        />
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-gray-300">No Orders Found</h3>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map(order => (
                            <div key={order.order_id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Package className="w-6 h-6 text-green-600" />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-base font-black text-gray-900">{order.product_name}</h3>
                                                <p className="text-[10px] text-gray-400 font-bold mb-1">Order ID: {order.order_id}</p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Date</p>
                                                <p className="text-[10px] font-black text-gray-900">{new Date(order.order_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Amount</p>
                                                <p className="text-[10px] font-black text-gray-900">{order.type === 'money' ? `₹${order.amount_value}` : 'Product'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Method</p>
                                                <p className="text-[10px] font-black text-gray-900 capitalize">{order.method}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Payment</p>
                                                <p className="text-[10px] font-black text-gray-900">{order.payment_method || 'Wallet'}</p>
                                            </div>
                                            {order.isSapling && order.status !== 'delivered' && (
                                                <div className="bg-blue-600 text-white p-2 rounded-lg text-center shadow-lg shadow-blue-100">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-80">Delivery OTP</p>
                                                    <p className="text-sm font-black tracking-[0.3em]">{order.otp}</p>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserOrders;
