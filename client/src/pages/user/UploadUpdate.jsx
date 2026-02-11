import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, CheckCircle, AlertTriangle, Sprout, Shield, Leaf, TrendingUp, Coins, XCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

const UploadUpdate = () => {
    const { saplingId } = useParams();
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const { user } = useAuth();

    const [selectedSapling, setSelectedSapling] = useState(locationState?.sapling || null);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [status, setStatus] = useState('healthy');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [verificationResult, setVerificationResult] = useState(null);
    const [creditResult, setCreditResult] = useState(null);

    useEffect(() => {
        if (!selectedSapling && saplingId && user) {
            fetchSaplingDetails();
        }
    }, [saplingId, user]);

    const fetchSaplingDetails = async () => {
        try {
            const currentUserId = user?.user_id || user?._id;
            console.log('--- Fetching Sapling for User ---', currentUserId);
            const { data } = await axios.get(`${API_URL}/user/${currentUserId}/saplings`);
            const target = data.find(s => s.sapling_id === saplingId);
            if (target) setSelectedSapling(target);
        } catch (err) {
            console.error('Fetch Sapling Error:', err);
            setError('Could not load sapling details. Please check your connection to the server.');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSapling) {
            setError('Sapling information missing. Please go back to My Forest and try again.');
            return;
        }

        if (!image) {
            setError('Please select an image first.');
            return;
        }

        setLoading(true);
        setError('');
        setVerificationResult(null);
        setCreditResult(null);

        try {
            const formData = new FormData();
            formData.append('userId', user?.user_id || user?._id);
            formData.append('sapling_id', selectedSapling.sapling_id);
            formData.append('image', image);
            formData.append('plant_status', status);
            formData.append('growth_indicators', "Monthly growth update.");
            formData.append('location', JSON.stringify({ latitude: 0, longitude: 0 }));

            console.log('--- Sending Upload FormData ---');

            const response = await axios.post(`${API_URL}/user/upload`, formData);

            // Store verification and credit results
            setVerificationResult(response.data.verification);
            setCreditResult(response.data.credits);
            setSuccess(true);

        } catch (err) {
            console.error('Upload Submission Error:', err);
            const errorData = err.response?.data;

            // Connection errors
            if (!err.response) {
                setError(`Connection Failed: Unable to reach server. Please check your internet connection.`);
            }
            // Wrong species detected
            else if (errorData?.verdict === 'WRONG_SPECIES') {
                setError(`❌ Wrong Sapling Detected! Please upload a photo of your ${selectedSapling?.plant_name || 'registered sapling'}.`);
                setVerificationResult({
                    authenticity: { score: 0, verdict: 'WRONG_SPECIES' },
                    plantRecognition: { confidence: errorData.plantConfidence || 0, verdict: 'WRONG_SPECIES' },
                    fraud: { score: 0, verdict: 'REJECTED' }
                });
            }
            // Photo authenticity issues
            else if (errorData?.authenticityScore !== undefined) {
                setError(`❌ Photo Verification Failed. Please take a fresh photo with your camera.`);
                setVerificationResult({
                    authenticity: { score: errorData.authenticityScore || 0, verdict: 'REJECTED' },
                    plantRecognition: { confidence: errorData.plantConfidence || 0, verdict: 'REJECTED' },
                    fraud: { score: errorData.fraudScore || 0, verdict: 'REJECTED' }
                });
            }
            // Generic errors
            else {
                setError(errorData?.message || `Upload Failed. Please try again with a clear photo of your sapling.`);
                if (errorData?.details) {
                    setVerificationResult({
                        message: errorData.details,
                        verdict: errorData.verdict || 'REJECTED'
                    });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const getVerdictColor = (verdict) => {
        if (verdict?.includes('AUTHENTIC') || verdict?.includes('VALID') || verdict === 'FIRST_UPLOAD') return 'text-green-600';
        if (verdict?.includes('LIKELY') || verdict?.includes('UNCERTAIN')) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getVerdictBg = (verdict) => {
        if (verdict?.includes('AUTHENTIC') || verdict?.includes('VALID') || verdict === 'FIRST_UPLOAD') return 'bg-green-50';
        if (verdict?.includes('LIKELY') || verdict?.includes('UNCERTAIN')) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/user/my-forest')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Upload Growth Update</h1>
                        <p className="text-sm text-gray-500">Share progress for {selectedSapling?.plant_name || 'your plant'}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 pb-24">
                {success ? (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        {/* Success Banner */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Photo Verified Successfully! 🎉</h2>
                            <p className="text-gray-600 mb-6">Our AI has analyzed your plant photo and verified its authenticity.</p>
                        </div>

                        {/* Verification Results Card */}
                        {verificationResult && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Verification Results
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Authenticity */}
                                    <div className={`p-4 rounded-xl ${getVerdictBg(verificationResult.authenticity?.verdict)}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className={`w-5 h-5 ${getVerdictColor(verificationResult.authenticity?.verdict)}`} />
                                            <span className="font-semibold text-gray-700">Authenticity</span>
                                        </div>
                                        <div className={`text-2xl font-bold ${getVerdictColor(verificationResult.authenticity?.verdict)}`}>
                                            {verificationResult.authenticity?.score || 0}%
                                        </div>
                                        <div className={`text-sm ${getVerdictColor(verificationResult.authenticity?.verdict)}`}>
                                            {verificationResult.authenticity?.verdict?.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    {/* Plant Recognition */}
                                    <div className={`p-4 rounded-xl ${getVerdictBg(verificationResult.plantRecognition?.verdict)}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Leaf className={`w-5 h-5 ${getVerdictColor(verificationResult.plantRecognition?.verdict)}`} />
                                            <span className="font-semibold text-gray-700">Plant Detection</span>
                                        </div>
                                        <div className={`text-2xl font-bold ${getVerdictColor(verificationResult.plantRecognition?.verdict)}`}>
                                            {verificationResult.plantRecognition?.confidence || 0}%
                                        </div>
                                        <div className={`text-sm ${getVerdictColor(verificationResult.plantRecognition?.verdict)}`}>
                                            {verificationResult.plantRecognition?.verdict?.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    {/* Fraud Check */}
                                    <div className={`p-4 rounded-xl ${getVerdictBg(verificationResult.fraud?.verdict)}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className={`w-5 h-5 ${getVerdictColor(verificationResult.fraud?.verdict)}`} />
                                            <span className="font-semibold text-gray-700">Fraud Check</span>
                                        </div>
                                        <div className={`text-2xl font-bold ${getVerdictColor(verificationResult.fraud?.verdict)}`}>
                                            {100 - (verificationResult.fraud?.score || 0)}%
                                        </div>
                                        <div className={`text-sm ${getVerdictColor(verificationResult.fraud?.verdict)}`}>
                                            {verificationResult.fraud?.verdict?.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Growth Estimate */}
                                {verificationResult.growth && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-5 h-5 text-green-600" />
                                            <span className="font-semibold text-gray-700">Growth Analysis</span>
                                        </div>
                                        <p className="text-gray-600">
                                            {verificationResult.growth.isFirstUpload
                                                ? '🌱 First photo for this sapling - great start!'
                                                : `Estimated growth: ${verificationResult.growth.estimate}% compared to last photo`
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Credits Earned Card */}
                        {creditResult && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-lg p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                                            <Coins className="w-6 h-6" />
                                            Rewards Earned!
                                        </h3>
                                        <p className="text-yellow-100 text-sm">{creditResult.message}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold">+{creditResult.ecoCoins}</div>
                                        <div className="text-yellow-100">EcoCoins</div>
                                    </div>
                                </div>

                                {creditResult.breakdown && (
                                    <div className="mt-4 pt-4 border-t border-yellow-300/30">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {creditResult.breakdown.baseCoins > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-100">Base</span>
                                                    <span>+{creditResult.breakdown.baseCoins}</span>
                                                </div>
                                            )}
                                            {creditResult.breakdown.authenticityBonus > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-100">Authenticity</span>
                                                    <span>+{creditResult.breakdown.authenticityBonus}</span>
                                                </div>
                                            )}
                                            {creditResult.breakdown.growthBonus > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-100">Growth</span>
                                                    <span>+{creditResult.breakdown.growthBonus}</span>
                                                </div>
                                            )}
                                            {creditResult.breakdown.consecutiveBonus > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-100">Consistency</span>
                                                    <span>+{creditResult.breakdown.consecutiveBonus}</span>
                                                </div>
                                            )}
                                            {creditResult.breakdown.firstUploadBonus > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-yellow-100">First Upload</span>
                                                    <span>+{creditResult.breakdown.firstUploadBonus}</span>
                                                </div>
                                            )}
                                        </div>
                                        {creditResult.carbonOffset > 0 && (
                                            <div className="mt-3 text-yellow-100">
                                                🌍 Carbon Offset: +{creditResult.carbonOffset}kg CO₂
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/user/dashboard')}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Sapling Info Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="p-4 bg-green-50 rounded-2xl">
                                <Sprout className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedSapling?.plant_name}</h3>
                                <p className="text-sm text-gray-500">{selectedSapling?.plant_type} • {selectedSapling?.sapling_id}</p>
                            </div>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">AI Photo Verification</p>
                                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                                        <li>Take a <strong>fresh photo</strong> from your camera (not downloads)</li>
                                        <li>Ensure a clear view of the plant</li>
                                        <li>AI will detect fraudulent or reused photos</li>
                                        <li>Original photos earn more EcoCoins!</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Area */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700">Recent Photo of Your Plant</label>
                            <label className="block text-xs text-blue-600 font-medium">✨ AI will automatically verify authenticity and calculate rewards</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    id="plant-photo"
                                    required
                                />
                                <label
                                    htmlFor="plant-photo"
                                    className={`flex flex-col items-center justify-center w-full min-h-[300px] border-4 border-dashed rounded-3xl cursor-pointer transition-all ${preview
                                        ? 'border-green-500 bg-white'
                                        : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-400'
                                        }`}
                                >
                                    {preview ? (
                                        <div className="relative w-full h-full p-2">
                                            <img src={preview} alt="Preview" className="w-full h-[400px] object-cover rounded-2xl" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                                                <Camera className="w-12 h-12 text-white" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-12">
                                            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Camera className="w-10 h-10 text-blue-600" />
                                            </div>
                                            <p className="text-lg font-bold text-gray-700">Tap to take a photo</p>
                                            <p className="text-gray-400">Use your camera for best verification results</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Error Display with Verification Details */}
                        {error && (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                                    <div className="flex items-start gap-3">
                                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-red-700">{error}</p>
                                            <p className="text-sm text-red-600 mt-2">
                                                Please take a new photo directly from your camera for better verification.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Show failed verification details */}
                                {verificationResult && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                                        <p className="font-semibold text-yellow-800 mb-2">Why was my photo rejected?</p>
                                        <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                                            {verificationResult.authenticity?.score < 50 && (
                                                <li>Photo authenticity score too low ({verificationResult.authenticity?.score}%)</li>
                                            )}
                                            {verificationResult.plantRecognition?.confidence < 50 && (
                                                <li>Could not detect a plant in the image ({verificationResult.plantRecognition?.confidence}%)</li>
                                            )}
                                            {verificationResult.fraud?.score > 50 && (
                                                <li>Photo may be a duplicate or reused image</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !image}
                            className="fixed bottom-8 left-6 right-6 max-w-3xl mx-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-2xl transition-all disabled:bg-gray-300 disabled:shadow-none z-50 text-xl"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Verifying Photo...
                                </span>
                            ) : (
                                'Upload & Verify Photo'
                            )}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
};

export default UploadUpdate;
