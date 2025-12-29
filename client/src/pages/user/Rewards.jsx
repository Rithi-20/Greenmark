import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Gift, MapPin, Truck, Store, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const Rewards = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ecoCoins, setEcoCoins] = useState(0);
    const [rewards, setRewards] = useState([]);
    const [selectedReward, setSelectedReward] = useState(null);
    const [redemptionMethod, setRedemptionMethod] = useState('online');

    const [address, setAddress] = useState({
        line1: '',
        line2: '',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        pincode: ''
    });
    const [location, setLocation] = useState({ lat: null, long: null });
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = () => {
        axios.get(`${API_URL}/user/${user.user_id}/stats`)
            .then(res => setEcoCoins(res.data.ecoCoins))
            .catch(err => console.error(err));

        axios.get(`${API_URL}/user/rewards`)
            .then(res => setRewards(res.data))
            .catch(err => console.error(err));
    };

    const handleRedeemClick = (reward) => {
        setSelectedReward(reward);
        setRedemptionMethod('online');
        setAddress({ line1: '', line2: '', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '' });
        setLocation({ lat: null, long: null });
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    long: position.coords.longitude
                });
                setIsLocating(false);
            },
            (error) => {
                alert('Unable to retrieve your location');
                setIsLocating(false);
            }
        );
    };

    const confirmRedemption = async () => {
        if (!selectedReward) return;

        if (redemptionMethod === 'online') {
            if (!location.lat || !location.long) {
                alert("Please enable GPS location for delivery calculation.");
                return;
            }
            if (!address.line1 || !address.pincode) {
                alert("Please fill in address details.");
                return;
            }
        }

        try {
            const response = await axios.post(`${API_URL}/user/order/place`, {
                userId: user.user_id,
                reward_id: selectedReward.reward_id,
                type: selectedReward.reward_type,
                product_name: selectedReward.reward_name,
                amount_value: selectedReward.amount_value,
                delivery_address: redemptionMethod === 'online' ? address : null,
                delivery_lat: location.lat || 0,
                delivery_long: location.long || 0,
                method: redemptionMethod
            });

            const { order_id, estimated_days, distance_km } = response.data;

            let msg = `Order placed! Order ID: ${order_id}.\n`;
            if (redemptionMethod === 'online') {
                msg += `Distance: ${distance_km} km.\nEstimated Delivery: ${estimated_days}.\n`;
            } else {
                msg += `Please visit the shop to collect.\n`;
            }
            alert(msg);

            setSelectedReward(null);
            fetchData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Redemption failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900">Rewards & Redemptions</h2>
                    </div>
                    <p className="text-xs text-gray-500">Redeem your EcoCoins for products or cash.</p>                    <p className="text-xs text-gray-500">Redeem your EcoCoins for products or cash.</p>
                    <div className="mt-2 inline-block bg-purple-50 text-purple-800 px-3 py-1 rounded-lg text-sm font-bold border border-purple-100">
                        Balance: {ecoCoins} EcoCoins
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {rewards.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-gray-400 font-medium bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                            No rewards available at the moment.
                        </div>
                    ) : (
                        rewards.map(reward => (
                            <div key={reward._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col transition hover:shadow-md">
                                {reward.image_url && <img src={reward.image_url} alt={reward.reward_name} className="w-12 h-12 mb-3 object-contain" />}
                                <h4 className="font-bold text-gray-900 text-sm">{reward.reward_name}</h4>
                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{reward.description}</p>

                                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-purple-600 font-bold text-xs">{reward.eco_coins_required} Pts</span>
                                    <Button
                                        size="xs"
                                        disabled={ecoCoins < reward.eco_coins_required}
                                        variant={ecoCoins >= reward.eco_coins_required ? 'primary' : 'secondary'}
                                        onClick={() => handleRedeemClick(reward)}
                                        className="text-xs px-3 py-1.5"
                                    >
                                        Redeem
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Redemption Modal */}
                {selectedReward && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-xl p-5 max-w-sm w-full my-8">
                            <h3 className="text-lg font-bold mb-1">Redeem {selectedReward.reward_name}</h3>
                            <p className="text-gray-500 mb-4 text-xs">Use {selectedReward.eco_coins_required} EcoCoins to redeem this reward.</p>

                            {/* Method Selection */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-700 mb-2">Delivery Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setRedemptionMethod('online')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${redemptionMethod === 'online'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <Truck className="w-5 h-5 mb-1" />
                                        <span className="font-bold text-xs">Delivery</span>
                                    </button>
                                    <button
                                        onClick={() => setRedemptionMethod('offline')}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${redemptionMethod === 'offline'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <Store className="w-5 h-5 mb-1" />
                                        <span className="font-bold text-xs">Shop Pickup</span>
                                    </button>
                                </div>
                            </div>

                            {/* Address Form */}
                            {redemptionMethod === 'online' && (
                                <div className="space-y-3 mb-4 bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-gray-800 text-xs">Delivery Address</h4>
                                        <button
                                            onClick={getLocation}
                                            className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-blue-200"
                                        >
                                            <MapPin className="w-3 h-3" />
                                            {isLocating ? '...' : 'GPS'}
                                        </button>
                                    </div>

                                    {location.lat && (
                                        <div className="text-[10px] text-green-600 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
                                            <span>✓ Location Captured</span>
                                        </div>
                                    )}

                                    <input
                                        type="text"
                                        placeholder="Flat / House No."
                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                                        value={address.line1}
                                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Area / Street"
                                        className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                                        value={address.line2}
                                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-gray-100"
                                            value={address.city}
                                            readOnly
                                        />
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {redemptionMethod === 'offline' && (
                                <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg">
                                    <p className="font-bold flex items-center gap-1 mb-1">
                                        <Store className="w-3 h-3" /> Visit Shop
                                    </p>
                                    Collect reward from: <br />
                                    <b>Dr. N.G.P Institute of Technology</b>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => setSelectedReward(null)}>Cancel</Button>
                                <Button className="flex-1 text-xs py-2" onClick={confirmRedemption}>Confirm</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Rewards;
