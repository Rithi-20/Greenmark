import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Camera, CheckCircle, Clock, MapPin, Phone, User, Search, Filter, ChevronRight, Upload, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config';

const SaplingOrderManager = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState('pending_photo');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/sapling-orders/list?role=admin`);
            setOrders(data);
        } catch (err) {
            console.error('Fetch Orders Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (orderId, file) => {
        if (!file) return;
        setUploading(orderId);

        const formData = new FormData();
        formData.append('image', file);

        try {
            await axios.post(`${API_URL}/sapling-orders/${orderId}/upload-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchOrders();
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        (filter === 'all' || o.status === filter) &&
        (o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Sapling Orders</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage sapling deliveries and baseline photos</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {['pending_photo', 'ready_for_pickup', 'in_transit', 'delivered', 'all'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                            : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                            }`}
                    >
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl" />)}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-400">No matching orders found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.map(order => (
                        <div key={order._id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group overflow-hidden relative">
                            {/* Status Badge */}
                            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest ${order.status === 'pending_photo' ? 'bg-orange-100 text-orange-600' :
                                order.status === 'ready_for_pickup' ? 'bg-emerald-100 text-emerald-600' :
                                    order.status === 'assigned' ? 'bg-blue-100 text-blue-600' :
                                        order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                            'bg-gray-100 text-gray-600'
                                }`}>
                                {order.status.replace('_', ' ')}
                            </div>

                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-3 rounded-2xl ${order.status === 'pending_photo' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'} group-hover:scale-110 transition-transform`}>
                                    <Package className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-lg leading-none mb-1">{order.plant_name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.order_id}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-gray-500">
                                    <User className="w-3.5 h-3.5" />
                                    <p className="text-xs font-bold">User ID: {order.user_id}</p>
                                </div>
                                {order.delivery_address && (
                                    <>
                                        <div className="flex items-start gap-3 text-gray-500">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                            <p className="text-xs font-bold leading-relaxed">{order.delivery_address.full_address}, {order.delivery_address.city} - {order.delivery_address.pincode}</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <Phone className="w-3.5 h-3.5" />
                                            <p className="text-xs font-bold">{order.delivery_address.phone}</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-6 border-t border-gray-50">
                                {order.status === 'pending_photo' ? (
                                    <div className="space-y-4">
                                        <div className="relative group/upload">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => handlePhotoUpload(order.order_id, e.target.files[0])}
                                                disabled={uploading === order.order_id}
                                            />
                                            <div className="w-full py-3 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100 group-hover/upload:bg-blue-700 transition-all">
                                                {uploading === order.order_id ? (
                                                    <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                ) : <Camera className="w-3.5 h-3.5" />}
                                                {uploading === order.order_id ? 'Uploading...' : 'Upload Initial Photo'}
                                            </div>
                                        </div>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest text-center italic">
                                            * Delivering boys will see this only after photo upload
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100">
                                            <img src={`${BASE_URL}${order.initial_photo}`} alt="Sapling" className="w-full h-full object-cover" />

                                            <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-[7px] font-black rounded uppercase tracking-widest">
                                                Baseline Verified
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                            Status: {order.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SaplingOrderManager;
