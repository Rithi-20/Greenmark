import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config';
import { Truck, Store, CheckCircle, Clock, MapPin, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const AdminOrderManagement = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [deliveryStaff, setDeliveryStaff] = useState([]);
    const [filter, setFilter] = useState('all'); // all, delivery, pickup
    const [search, setSearch] = useState('');

    const [otpInput, setOtpInput] = useState({});

    useEffect(() => {
        fetchOrders();
        fetchDeliveryStaff();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/orders`);

            setOrders(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDeliveryStaff = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/delivery-staff`);

            setDeliveryStaff(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        }
    };

    const handleAssign = async (orderId, deliveryId) => {
        if (!deliveryId) return;
        try {
            await axios.post(`${API_URL}/admin/orders/${orderId}/assign`, { deliveryId });

            alert('Order Assigned Successfully');
            fetchOrders();
        } catch (err) {
            alert('Assignment Failed');
        }
    };

    const handleVerifyPickup = async (orderId) => {
        const otp = otpInput[orderId];
        if (!otp) return alert('Enter OTP');
        try {
            await axios.post(`${API_URL}/admin/orders/verify-pickup`, { orderId, otp });

            alert('Pickup Verified!');
            fetchOrders();
        } catch (err) {
            alert(err.response?.data?.message || 'Verification Failed');
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesFilter =
            filter === 'all' ? true :
                filter === 'delivery' ? order.method === 'online' :
                    order.method === 'offline';
        const matchesSearch =
            order.order_id.toLowerCase().includes(search.toLowerCase()) ||
            order.product_name.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        if (status === 'Delivered' || status === 'Money Delivered' || status === 'Paid at Shop') return 'bg-green-100 text-green-700';
        if (status === 'Out for Delivery') return 'bg-blue-100 text-blue-700';
        if (status === 'Assigned') return 'bg-purple-100 text-purple-700';
        return 'bg-amber-100 text-amber-700';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
                            <p className="text-gray-500 font-medium">Track deliveries and shop pickups</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Order ID..."
                                className="outline-none text-sm font-bold text-gray-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mb-8">
                    {['all', 'delivery', 'pickup'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${filter === f ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'pickup' ? 'Shop Pickup' : f === 'delivery' ? 'Home Delivery' : 'All Orders'}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Order / Customer</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Method</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Location / Info</th>
                                    <th className="p-6 text-xs font-black text-gray-400 uppercase tracking-widest">Action / Assign</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredOrders.map(order => (
                                    <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-6">
                                            <p className="font-bold text-gray-900">{order.product_name}</p>
                                            <p className="text-xs text-blue-600 font-mono mt-1 mb-2">{order.order_id}</p>

                                            <div className="bg-slate-50 p-2 rounded-lg inline-block">
                                                <p className="text-xs font-bold text-gray-800">{order.customer_name}</p>
                                                <p className="text-[10px] text-gray-500">{order.customer_mobile}</p>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            {order.method === 'online' ? (
                                                <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
                                                    <Truck className="w-4 h-4" /> Delivery
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                                                    <Store className="w-4 h-4" /> Shop Pickup
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                                {order.status === 'Delivered' || order.status === 'Money Delivered' ? 'Redeemed' : order.status}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {order.method === 'online' ? (
                                                <div className="text-xs">
                                                    <p className="font-bold text-gray-700">{order.distance_km} km</p>
                                                    <p className="text-gray-400">{order.delivery_address?.city}</p>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">At Store</span>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            {order.method === 'online' ? (
                                                order.assigned_delivery_person ? (
                                                    <span className="text-xs font-bold text-gray-700">
                                                        Assigned to: {order.assigned_delivery_person.name}
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 animate-pulse">
                                                        <Clock className="w-3 h-3" />
                                                        Broadcasting to Partners...
                                                    </div>
                                                )
                                            ) : (
                                                // Shop Pickup Verification
                                                order.status === 'Delivered' ? (
                                                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                                                        <CheckCircle className="w-4 h-4" /> Picked Up
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="OTP"
                                                            maxLength="8"
                                                            className="w-24 p-2 border border-orange-200 bg-orange-50 rounded-lg text-xs font-mono text-center outline-none focus:border-orange-400"
                                                            value={otpInput[order.order_id] || ''}
                                                            onChange={(e) => setOtpInput({ ...otpInput, [order.order_id]: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => handleVerifyPickup(order.order_id)}
                                                            className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition shadow-lg shadow-orange-200"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            )}
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

export default AdminOrderManagement;
