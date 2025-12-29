import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Search, Sprout, MapPin, QrCode, ClipboardList, ChevronRight, Info, Camera, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const RegisterSapling = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [availableSaplings, setAvailableSaplings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSapling, setSelectedSapling] = useState(null);
    const [deliveryMethod, setDeliveryMethod] = useState(null); // 'shop_pickup' or 'online_delivery'
    const [address, setAddress] = useState({
        full_address: '',
        city: '',
        pincode: '',
        phone: ''
    });
    const [location, setLocation] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAvailable();
    }, []);

    const fetchAvailable = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/user/available`);
            setAvailableSaplings(data);
        } catch (err) {
            console.error(err);
        }
    };

    const categories = useMemo(() => {
        const filtered = availableSaplings.filter(s =>
            s.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.plant_type.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups = filtered.reduce((acc, sap) => {
            if (!acc[sap.plant_name]) {
                acc[sap.plant_name] = {
                    name: sap.plant_name,
                    type: sap.plant_type,
                    carbon: sap.carbon_rate,
                    units: []
                };
            }
            acc[sap.plant_name].units.push(sap);
            return acc;
        }, {});

        return Object.values(groups);
    }, [availableSaplings, searchTerm]);

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                () => alert('Unable to get location. Using default coordinates.')
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleRegister = async () => {
        if (!selectedSapling) return;
        if (!deliveryMethod) {
            setError('Please select a delivery method.');
            return;
        }

        if (deliveryMethod === 'shop_pickup' && !imageFile) {
            setError('Please take a photo of the sapling at the shop.');
            return;
        }

        if (deliveryMethod === 'online_delivery' && (!address.full_address || !address.phone)) {
            setError('Please provide a delivery address and phone number.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('userId', user.user_id);
            formData.append('saplingId', selectedSapling.sapling_id);
            formData.append('deliveryMethod', deliveryMethod);

            if (deliveryMethod === 'online_delivery') {
                formData.append('address', JSON.stringify(address));
            } else {
                formData.append('location', JSON.stringify(location || { latitude: 0, longitude: 0 }));
                formData.append('image', imageFile);
            }

            await axios.post(`${API_URL}/sapling-orders/create`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess(true);
            setTimeout(() => navigate('/user/my-forest'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900">Register New Member</h1>
                            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Select your sapling match</p>
                        </div>
                    </div>
                    {selectedCategory && (
                        <button
                            onClick={() => { setSelectedCategory(null); setSelectedSapling(null); setImageFile(null); setPreviewUrl(null); }}
                            className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider"
                        >
                            Change Selection
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {success ? (
                    <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-lg mx-auto animate-in zoom-in duration-500 border border-green-50">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">Registration Complete! 🌿</h2>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">You are now the official owner of this sapling. Welcome to the GreenMark community!</p>
                        <div className="inline-flex items-center gap-2 text-green-600 font-black uppercase tracking-widest text-xs">
                            <span className="w-2 h-2 bg-green-600 rounded-full animate-ping" />
                            Opening your forest...
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Sidebar Steps */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Process Status</h3>
                                <div className="space-y-4">
                                    {/* Steps */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${selectedCategory ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {selectedCategory ? '✓' : '1'}
                                        </div>
                                        <p className={`text-xs font-bold ${selectedCategory ? 'text-gray-900' : 'text-gray-400'}`}>Select Type</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${selectedSapling ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {selectedSapling ? '✓' : '2'}
                                        </div>
                                        <p className={`text-xs font-bold ${selectedSapling ? 'text-gray-900' : 'text-gray-400'}`}>Pick Unit</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${location ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {location ? '✓' : '3'}
                                        </div>
                                        <p className={`text-xs font-bold ${location ? 'text-gray-900' : 'text-gray-400'}`}>Location</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${imageFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {imageFile ? '✓' : '4'}
                                        </div>
                                        <p className={`text-xs font-bold ${imageFile ? 'text-gray-900' : 'text-gray-400'}`}>Sapling Photo</p>
                                    </div>
                                </div>
                            </div>

                            {selectedSapling && (
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 animate-in slide-in-from-left-4">
                                    <Info className="w-5 h-5 mb-3 opacity-50" />
                                    <h4 className="text-base font-black mb-1">Great Choice!</h4>
                                    <p className="text-xs text-blue-100 leading-relaxed mb-4">
                                        {selectedCategory.name} trees offset {selectedCategory.carbon}kg/yr.
                                    </p>
                                    <div className="pt-3 border-t border-white/20">
                                        <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Unit Assigned</p>
                                        <p className="font-mono text-lg">{selectedSapling.sapling_id}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Interaction Area */}
                        <div className="lg:col-span-9 space-y-6">
                            {!selectedCategory ? (
                                <>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="What would you like to grow? (e.g. Mango, Neem, Teak)"
                                            className="w-full pl-12 pr-6 py-3 bg-white rounded-xl shadow-sm border border-gray-100 focus:ring-4 focus:ring-green-500/10 focus:border-green-300 text-sm outline-none transition-all font-bold text-gray-700"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {categories.map((cat) => (
                                            <div
                                                key={cat.name}
                                                onClick={() => setSelectedCategory(cat)}
                                                className="group bg-white p-5 rounded-2xl border border-gray-100 hover:border-green-400 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                                                <div className="p-3 bg-green-50 rounded-xl w-fit mb-4 relative z-10">
                                                    <Sprout className="w-6 h-6 text-green-600" />
                                                </div>
                                                <div className="relative z-10">
                                                    <h3 className="text-lg font-black text-gray-900 mb-0.5">{cat.name}</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{cat.type}</p>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="px-2 py-1 bg-green-600 text-white text-[9px] font-black rounded-full uppercase tracking-tighter shadow-md shadow-green-100">
                                                            {cat.units.length} AVAILABLE
                                                        </span>
                                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {categories.length === 0 && (
                                            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                <p className="text-sm text-gray-400 font-bold">No saplings matching "{searchTerm}" are currently available.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black text-gray-900 italic">Select Unit ({selectedCategory.name})</h3>
                                        <div className="h-0.5 flex-1 bg-gray-100 mx-6 rounded-full" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {selectedCategory.units.map((unit) => (
                                            <div
                                                key={unit._id}
                                                onClick={() => setSelectedSapling(unit)}
                                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedSapling?._id === unit._id
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <QrCode className="w-5 h-5 opacity-30" />
                                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${selectedSapling?._id === unit._id ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        READY
                                                    </div>
                                                </div>
                                                <p className="text-[10px] font-bold uppercase opacity-50 mb-0.5">Stock ID</p>
                                                <p className="text-lg font-mono font-black">{unit.sapling_id}</p>
                                                {selectedSapling?._id === unit._id && (
                                                    <div className="mt-3 flex items-center gap-1.5 animate-in zoom-in">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] font-bold">SELECTED</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {selectedSapling && (
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-stretch gap-6 animate-in slide-in-from-bottom-8">
                                            <div>
                                                <h4 className="text-xl font-black text-gray-900 mb-10">Finalize Registration</h4>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Choose Receiving Method</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div
                                                        onClick={() => setDeliveryMethod('shop_pickup')}
                                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${deliveryMethod === 'shop_pickup' ? 'border-green-600 bg-green-50 shadow-lg shadow-green-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                                    >
                                                        <div className={`p-3 rounded-xl ${deliveryMethod === 'shop_pickup' ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                            <Camera className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">Shop Pickup</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Instant Setup</p>
                                                        </div>
                                                    </div>
                                                    <div
                                                        onClick={() => setDeliveryMethod('online_delivery')}
                                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${deliveryMethod === 'online_delivery' ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                                    >
                                                        <div className={`p-3 rounded-xl ${deliveryMethod === 'online_delivery' ? 'bg-blue-600 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">Home Delivery</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">We Deliver to You</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {deliveryMethod && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100 animate-in slide-in-from-top-4 duration-500">
                                                    {deliveryMethod === 'shop_pickup' ? (
                                                        <div className="space-y-4">
                                                            <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                                                <h5 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                                                    Immediate Verification
                                                                </h5>
                                                                <div className="space-y-3">
                                                                    <button
                                                                        onClick={getLocation}
                                                                        className={`w-full px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] ${location
                                                                            ? 'bg-white text-green-600 border border-green-200 shadow-sm'
                                                                            : 'bg-green-600 text-white hover:bg-green-700'
                                                                            }`}
                                                                    >
                                                                        <MapPin className="w-4 h-4" />
                                                                        {location ? 'Location Captured ✓' : '1. Add Store Location'}
                                                                    </button>

                                                                    <div className="relative">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            capture="environment"
                                                                            onChange={handleFileChange}
                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                        />
                                                                        <div className={`w-full px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-black uppercase tracking-widest text-[10px] ${imageFile
                                                                            ? 'bg-white text-green-600 border border-green-200 shadow-sm'
                                                                            : 'bg-green-600 text-white hover:bg-green-700'
                                                                            }`}>
                                                                            <Camera className="w-4 h-4" />
                                                                            {imageFile ? 'Baseline Photo Set ✓' : '2. Take Baseline Photo'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {previewUrl && (
                                                                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-sm border border-gray-200">
                                                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[8px] font-black text-white uppercase tracking-widest">
                                                                        Sapling Baseline
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                                <h5 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                                                    Delivery Details
                                                                </h5>
                                                                <div className="space-y-3">
                                                                    <textarea
                                                                        placeholder="Full Delivery Address"
                                                                        className="w-full p-4 bg-white rounded-xl border border-blue-100 focus:ring-4 focus:ring-blue-500/10 outline-none text-xs font-bold transition-all min-h-[80px]"
                                                                        value={address.full_address}
                                                                        onChange={(e) => setAddress({ ...address, full_address: e.target.value })}
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="City"
                                                                            className="w-full p-3 bg-white rounded-xl border border-blue-100 outline-none text-xs font-bold"
                                                                            value={address.city}
                                                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                                        />
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Pincode"
                                                                            className="w-full p-3 bg-white rounded-xl border border-blue-100 outline-none text-xs font-bold"
                                                                            value={address.pincode}
                                                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Contact Number"
                                                                        className="w-full p-3 bg-white rounded-xl border border-blue-100 outline-none text-xs font-bold"
                                                                        value={address.phone}
                                                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="p-3 bg-blue-600/5 rounded-xl border border-blue-100 flex items-start gap-3">
                                                                    <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5" />
                                                                    <p className="text-[10px] font-bold text-blue-800 leading-relaxed">
                                                                        Note: Admin will upload the baseline photo during sapling preparation.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col justify-end space-y-3">
                                                        {error && (
                                                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest animate-pulse text-center">
                                                                {error}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={handleRegister}
                                                            disabled={loading}
                                                            className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:grayscale disabled:cursor-not-allowed text-xs tracking-[0.2em] uppercase ${deliveryMethod === 'shop_pickup'
                                                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200 text-white'
                                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white'
                                                                }`}
                                                        >
                                                            {loading ? (
                                                                <span className="flex items-center justify-center gap-3">
                                                                    <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                                    Processing...
                                                                </span>
                                                            ) : (
                                                                deliveryMethod === 'shop_pickup' ? 'Complete Pickup' : 'Place Order'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RegisterSapling;
