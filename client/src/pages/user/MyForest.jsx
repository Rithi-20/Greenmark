import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sprout, Droplets, Sun, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import QRCode from 'react-qr-code';
import { API_URL } from '../../config';

const MyForest = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [saplings, setSaplings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ipAddress, setIpAddress] = useState(window.location.hostname);

    useEffect(() => {
        if (user) {
            fetchSaplings();
        }
    }, [user]);

    const fetchSaplings = async () => {
        if (!user || (!user.user_id && !user._id)) {
            console.warn('MyForest: No user ID found for fetching saplings.');
            setLoading(false);
            return;
        }

        try {
            const userId = user.user_id || user._id;
            const { data } = await axios.get(`${API_URL}/user/${userId}/saplings`);
            setSaplings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch Saplings Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Saplings</h1>
                        <p className="text-sm text-gray-500">Your green family • {saplings.length} Total</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading your saplings...</p>
                    </div>
                ) : saplings.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                        <Sprout className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Saplings Yet</h3>
                        <p className="text-gray-500 mb-6">Start your green journey by registering your first sapling!</p>
                        <button
                            onClick={() => navigate('/user/register-sapling')}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                        >
                            Register Your First Sapling
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Mobile Access Setup */}
                        <div className="mb-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="flex-1">
                                    <h3 className="text-blue-900 font-bold flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-blue-600" />
                                        Setup for Mobile Scanning
                                    </h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        If you see "localhost" in the scanned link, your phone cannot connect.
                                        Please enter your computer's <strong>Network IP Address</strong> below (e.g., 192.168.1.5).
                                    </p>
                                </div>
                                <div className="w-full md:w-64">
                                    <label className="block text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                                        Computer IP Address
                                    </label>
                                    <div className="flex bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-400">
                                        <div className="bg-blue-50 px-3 py-2 border-r border-blue-100 flex items-center">
                                            <span className="text-xs font-bold text-blue-500">http://</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="192.168.x.x"
                                            className="flex-1 px-3 py-2 text-sm font-bold text-gray-700 outline-none"
                                            value={ipAddress}
                                            onChange={(e) => setIpAddress(e.target.value)}
                                        />
                                        <div className="bg-blue-50 px-3 py-2 border-l border-blue-100 flex items-center">
                                            <span className="text-xs font-bold text-blue-500">:5173</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {saplings.map((sap) => (
                                <div key={sap._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="h-36 bg-gradient-to-br from-green-400 to-emerald-600 flex flex-col items-center justify-center p-3 relative overflow-hidden">
                                        {/* Decorative BG pattern */}
                                        <Sprout className="absolute -bottom-8 -right-8 w-24 h-24 text-white opacity-20 rotate-12" />

                                        <div className="bg-white p-2 rounded-xl shadow-lg transform transition-transform hover:scale-110 duration-300">
                                            <div style={{ height: "auto", margin: "0 auto", maxWidth: 80, width: "100%" }}>
                                                <QRCode
                                                    size={256}
                                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                                    value={`${window.location.protocol}//${ipAddress}${window.location.port ? ':' + window.location.port : ''}/user/upload/${sap.sapling_id}`}
                                                    viewBox={`0 0 256 256`}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-black text-green-100 uppercase tracking-widest mt-2 opacity-80">Scan for Upload</p>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{sap.plant_name}</h3>
                                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] rounded-full font-bold uppercase tracking-wider">
                                                {sap.plant_type}
                                            </span>
                                        </div>

                                        <p className="text-xs text-gray-500 mb-3 font-medium">ID: {sap.sapling_id}</p>

                                        <div className="space-y-1.5 mb-3">
                                            <div className="flex items-center text-xs text-gray-600 font-medium">
                                                <Sun className="w-3.5 h-3.5 mr-2 text-orange-500" />
                                                <span>Status: <strong className="capitalize text-gray-800">{sap.status || 'Healthy'}</strong></span>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-600 font-medium">
                                                <AlertCircle className="w-3.5 h-3.5 mr-2 text-blue-500" />
                                                <span>Carbon Rate: <strong className="text-gray-800">{sap.carbon_rate} kg/yr</strong></span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/user/upload/${sap.sapling_id}`, { state: { sapling: sap } })}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                <span className="font-bold text-[10px] uppercase tracking-wide">Update</span>
                                            </button>
                                            <button
                                                onClick={() => navigate(`/user/saplings/${sap.sapling_id}/stats`)}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                                            >
                                                <Droplets className="w-3.5 h-3.5" />
                                                <span className="font-bold text-[10px] uppercase tracking-wide">Stats</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default MyForest;
