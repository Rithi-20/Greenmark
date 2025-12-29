import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Banknote, Edit, Power, Trash2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const RewardCatalog = () => {
    const navigate = useNavigate();
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        reward_id: '',
        reward_name: '',
        reward_type: 'product',
        eco_coins_required: '',
        money_value: '',
        description: '',
        image_url: ''
    });

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/catalog`);

            setRewards(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReward = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/admin/catalog`, formData);

            alert('Reward added successfully!');
            setShowAddModal(false);
            fetchCatalog();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add reward');
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await axios.put(`${API_URL}/admin/catalog/${id}`, { active: !currentStatus });

            fetchCatalog(); // Refresh
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Reward Catalog</h1>
                            <p className="text-slate-500 font-medium">Manage products and money vouchers available for redemption.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                    >
                        <Plus className="w-5 h-5" /> Add New Reward
                    </button>
                </header>

                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading catalog...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards.map((reward) => (
                            <div key={reward._id} className={`bg-white rounded-3xl p-6 shadow-sm border ${reward.active ? 'border-slate-100' : 'border-slate-200 opacity-75'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reward.reward_type === 'product' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {reward.reward_type === 'product' ? <Package className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${reward.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {reward.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{reward.reward_name}</h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{reward.description}</p>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-slate-400 font-bold">Cost</span>
                                        <span className="text-lg font-black text-purple-600">{reward.eco_coins_required} Coins</span>
                                    </div>
                                    {reward.reward_type === 'money' && (
                                        <div className="flex flex-col border-l border-slate-100 pl-4">
                                            <span className="text-[10px] uppercase text-slate-400 font-bold">Value</span>
                                            <span className="text-lg font-black text-slate-900">₹{reward.money_value}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleStatus(reward._id, reward.active)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${reward.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                    >
                                        <Power className="w-4 h-4" /> {reward.active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl">
                        <h2 className="text-2xl font-black text-slate-900 mb-6">Add New Reward</h2>
                        <form onSubmit={handleAddReward} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Unique)</label>
                                    <input required type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" placeholder="REW-001" onChange={e => setFormData({ ...formData, reward_id: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                    <select className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" onChange={e => setFormData({ ...formData, reward_type: e.target.value })}>
                                        <option value="product">Product</option>
                                        <option value="money">Money</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                                <input required type="text" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" placeholder="e.g. Plant Care Kit" onChange={e => setFormData({ ...formData, reward_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                <textarea required className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" rows="2" placeholder="Brief details..." onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Coins Required</label>
                                    <input required type="number" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" placeholder="500" onChange={e => setFormData({ ...formData, eco_coins_required: e.target.value })} />
                                </div>
                                {formData.reward_type === 'money' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cash Value (₹)</label>
                                        <input required type="number" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-green-500" placeholder="100" onChange={e => setFormData({ ...formData, money_value: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200">Create Reward</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RewardCatalog;
