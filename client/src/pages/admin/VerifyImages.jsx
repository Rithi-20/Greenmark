import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Shield, Clock, MapPin, Sprout, ShieldCheck, Coins, TrendingUp, Leaf, Info } from 'lucide-react';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config';

const VerifyImages = () => {
    const navigate = useNavigate();
    const [uploads, setUploads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVerifiedUploads();
    }, []);

    const fetchVerifiedUploads = async () => {
        try {
            // Fetch recently verified uploads to show history
            const { data } = await axios.get(`${API_URL}/admin/verified-uploads`);

            setUploads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Photo Verification</h1>
                        <p className="text-sm text-slate-500">AI-powered automatic verification system</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Auto-Verification Banner */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-2">✅ Automatic Verification Active</h2>
                            <p className="text-green-50 mb-4">
                                All photo uploads are now automatically verified using AI-powered analysis.
                                Credits are added to user accounts instantly - no manual approval needed!
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-green-200 text-xs">Authenticity Check</p>
                                    <p className="font-bold">EXIF + File Analysis</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-green-200 text-xs">Plant Detection</p>
                                    <p className="font-bold">Color Analysis</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-green-200 text-xs">Fraud Detection</p>
                                    <p className="font-bold">Image Comparison</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3">
                                    <p className="text-green-200 text-xs">Credits</p>
                                    <p className="font-bold">Auto-Calculated</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li><strong>Downloaded images</strong> from Google/Internet are automatically <span className="text-red-600">rejected</span></li>
                            <li><strong>Non-plant photos</strong> are automatically <span className="text-red-600">rejected</span></li>
                            <li><strong>Duplicate/reused photos</strong> are automatically <span className="text-red-600">rejected</span></li>
                            <li><strong>Valid camera photos</strong> of plants are <span className="text-green-600">approved instantly</span> with credits</li>
                        </ul>
                    </div>
                </div>

                {/* Recent Verified Uploads */}
                <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Auto-Verified Uploads</h3>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : uploads.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No uploads yet</h3>
                        <p className="text-slate-500">Recent verified uploads will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {uploads.map((up) => (
                            <div key={up._id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col">
                                <div className="h-36 relative group overflow-hidden">
                                    <img
                                        src={up.ipfs_gateway_url || (up.image_ipfs_hash?.startsWith('http') ? up.image_ipfs_hash : `${BASE_URL}${up.local_path || up.image_ipfs_hash}`)}

                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        alt="Sapling Update"
                                    />
                                    <div className="absolute top-2 left-2 bg-green-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-1">
                                        <CheckCircle className="w-2.5 h-2.5" />
                                        Auto-Verified
                                    </div>
                                    {up.ipfs_uploaded && (
                                        <div className="absolute top-2 right-2 bg-purple-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white">
                                            IPFS
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                            <Sprout className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">{up.sapling_id}</h3>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                                by {up.user_id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Verification Scores */}
                                    <div className="grid grid-cols-3 gap-1 mb-3">
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <Shield className="w-3 h-3 text-blue-500 mx-auto mb-0.5" />
                                            <p className="text-[9px] text-slate-500">Auth</p>
                                            <p className="text-xs font-bold text-slate-900">{up.authenticity?.score || 0}%</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <Leaf className="w-3 h-3 text-green-500 mx-auto mb-0.5" />
                                            <p className="text-[9px] text-slate-500">Plant</p>
                                            <p className="text-xs font-bold text-slate-900">{up.recognition?.confidence || 0}%</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg text-center">
                                            <TrendingUp className="w-3 h-3 text-purple-500 mx-auto mb-0.5" />
                                            <p className="text-[9px] text-slate-500">Growth</p>
                                            <p className="text-xs font-bold text-slate-900">{up.growthComparison?.growthEstimate || 50}%</p>
                                        </div>
                                    </div>

                                    {/* Credits Awarded */}
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1">
                                            <Coins className="w-4 h-4 text-yellow-600" />
                                            <span className="text-xs font-bold text-yellow-700">Credits Awarded</span>
                                        </div>
                                        <span className="text-sm font-bold text-orange-600">+{up.eco_coins_awarded || 0}</span>
                                    </div>

                                    <p className="text-[10px] text-slate-400 mt-2 text-right">
                                        {new Date(up.upload_date).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default VerifyImages;
