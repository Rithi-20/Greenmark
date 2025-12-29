import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Download, Sprout, QrCode, Search, User, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const SaplingManager = () => {
    const navigate = useNavigate();
    const [saplings, setSaplings] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [batchResults, setBatchResults] = useState([]);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const [quickAddModal, setQuickAddModal] = useState({ show: false, template: null, count: 1 });
    const [formData, setFormData] = useState({
        plant_name: '',
        plant_type: '',
        carbon_rate: '',
        shop_id: '',
        quantity: 1
    });

    useEffect(() => {
        fetchSaplings();
    }, []);

    const fetchSaplings = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/saplings`);

            setSaplings(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This action cannot be undone.')) return;
        try {
            await axios.delete(`${API_URL}/admin/saplings/${id}`);

            fetchSaplings();
        } catch (error) {
            alert('Error deleting sapling');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${API_URL}/admin/saplings/add`, formData);

            setBatchResults(data.saplings);
            setFormData({ plant_name: '', plant_type: '', carbon_rate: '', shop_id: '', quantity: 1 });
            fetchSaplings();
            alert(data.message);
        } catch (error) {
            alert('Error adding saplings');
        }
    };

    const downloadQR = (url, id) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `sapling-${id}-qr.png`;
        link.click();
    };

    const handleQuickAdd = (template) => {
        setQuickAddModal({ show: true, template, count: 1 });
    };

    const confirmQuickAdd = async () => {
        const { template, count } = quickAddModal;
        if (!count || isNaN(count) || parseInt(count) <= 0) return;

        try {
            const { data } = await axios.post(`${API_URL}/admin/saplings/add`, {
                ...template,
                quantity: parseInt(count)
            });
            fetchSaplings();
            setQuickAddModal({ show: false, template: null, count: 1 });
            alert(data.message);
        } catch (error) {
            alert('Error adding saplings');
        }
    };

    const toggleGroup = (name) => {
        setExpandedGroups(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const groupedSaplings = useMemo(() => {
        const filtered = saplings.filter(s =>
            s.plant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.sapling_id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return filtered.reduce((acc, sap) => {
            if (!acc[sap.plant_name]) acc[sap.plant_name] = [];
            acc[sap.plant_name].push(sap);
            return acc;
        }, {});
    }, [saplings, searchQuery]);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-gray-900 leading-none">Inventory</h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Control Panel</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-green-600 text-white shadow-green-100'
                            }`}
                    >
                        {showForm ? 'Close Form' : <><Plus className="w-3 h-3" /> Add Saplings</>}
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <Plus className="w-5 h-5 text-green-600" />
                            </div>
                            <h2 className="text-lg font-black text-gray-900 border-b-2 border-green-500">Create Batch</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-1 lg:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Plant Name</label>
                                <input
                                    type="text"
                                    placeholder="Neem, Mango..."
                                    value={formData.plant_name}
                                    onChange={(e) => setFormData({ ...formData, plant_name: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1 lg:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type</label>
                                <input
                                    type="text"
                                    placeholder="Tree, Shrub..."
                                    value={formData.plant_type}
                                    onChange={(e) => setFormData({ ...formData, plant_type: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Carbon (kg/yr)</label>
                                <input
                                    type="number"
                                    value={formData.carbon_rate}
                                    onChange={(e) => setFormData({ ...formData, carbon_rate: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Shop ID</label>
                                <input
                                    type="text"
                                    placeholder="e.g., SHOP001"
                                    value={formData.shop_id}
                                    onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-1 focus:ring-green-500 outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 text-green-600">Stock Count</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-green-50/50 border border-green-100 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-black text-green-700 text-sm"
                                    required
                                    placeholder="Count"
                                />
                            </div>
                            <div className="flex items-end lg:col-span-1">
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-all font-black text-xs uppercase tracking-widest shadow-md shadow-gray-200"
                                >
                                    Generate
                                </button>
                            </div>
                        </form>

                        {batchResults.length > 0 && (
                            <div className="mt-8 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight">QR Codes Generated</h3>
                                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded-full text-slate-400 border border-slate-100 shadow-sm">{batchResults.length} Units</span>
                                </div>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {batchResults.map((item, idx) => (
                                        <div key={idx} className="group p-2 bg-white border border-slate-100 rounded-xl flex flex-col items-center hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer overflow-hidden relative">
                                            <img src={item.qrDataUrl} alt="qr" className="w-full aspect-square mb-1 grayscale group-hover:grayscale-0 transition-all" />
                                            <span className="text-[8px] font-black text-slate-400 font-mono tracking-tighter">{item.sapling.sapling_id}</span>
                                            <button
                                                onClick={() => downloadQR(item.qrDataUrl, item.sapling.sapling_id)}
                                                className="absolute inset-0 bg-blue-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Sprout className="w-5 h-5 text-green-600" />
                            <h2 className="text-base font-black text-gray-900">Current Stock</h2>
                        </div>
                        <div className="relative w-full md:w-auto">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:ring-1 focus:ring-green-500 w-full md:w-56 font-medium"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {Object.entries(groupedSaplings).map(([name, units]) => (
                            <div key={name} className="group/item">
                                {/* Group Header Row */}
                                <div
                                    onClick={() => toggleGroup(name)}
                                    className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center border border-white shadow-sm">
                                            {expandedGroups[name] ? <ChevronDown className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4 text-green-600" />}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 leading-tight">{name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{units[0].plant_type}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{units.length} Units</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(units[0]); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-600 hover:text-white transition-all font-black text-[10px] border border-green-100 uppercase tracking-widest"
                                        >
                                            <Plus className="w-3 h-3" /> Add Count
                                        </button>
                                        <div className="hidden lg:flex flex-col items-end">
                                            <div className="flex gap-0.5">
                                                {units.slice(0, 10).map((u, i) => (
                                                    <div key={i} className={`w-1.5 h-3 rounded-sm ${u.is_assigned ? 'bg-blue-400' : 'bg-green-400'} opacity-30`} />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500">
                                            {units.filter(u => u.is_assigned).length} Assigned
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded List of Specific QRs */}
                                {expandedGroups[name] && (
                                    <div className="bg-slate-50/50 px-5 py-3 animate-in slide-in-from-top-1 duration-200">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200">
                                                    <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">ID / QR</th>
                                                    <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Registered By (Owner)</th>
                                                    <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                                    <th className="py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {units.map((unit) => (
                                                    <tr key={unit._id} className="hover:bg-white transition-colors">
                                                        <td className="py-3 font-mono text-[10px] font-bold text-slate-600">
                                                            <div className="flex items-center gap-1.5">
                                                                <QrCode className="w-3 h-3 text-slate-400" />
                                                                {unit.sapling_id}
                                                            </div>
                                                        </td>
                                                        <td className="py-3">
                                                            {unit.owner ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                                        <User className="w-3 h-3 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-800 tracking-tight">{unit.owner.name}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-slate-300 italic tracking-widest">UNASSIGNED</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${unit.is_assigned ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                                }`}>
                                                                {unit.is_assigned ? 'Reserved' : 'Available'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(unit._id)}
                                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-md transition-colors"
                                                                    title="Delete Sapling"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}

                        {Object.keys(groupedSaplings).length === 0 && (
                            <div className="p-12 text-center">
                                <Sprout className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                <h3 className="text-sm font-bold text-slate-900 italic">No inventory found matching your search.</h3>
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Quick Add Modal */}
                {quickAddModal.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setQuickAddModal({ show: false, template: null, count: 1 })} />
                        <div className="bg-white rounded-3xl p-6 w-full max-w-[320px] relative z-20 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                                <Plus className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-1">Add Units</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                                Increasing {quickAddModal.template?.plant_name} stock
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-1">New Quantity</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        min="1"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-black text-gray-900 text-lg"
                                        value={quickAddModal.count}
                                        onChange={(e) => setQuickAddModal({ ...quickAddModal, count: e.target.value })}
                                        onKeyPress={(e) => e.key === 'Enter' && confirmQuickAdd()}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setQuickAddModal({ show: false, template: null, count: 1 })}
                                        className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmQuickAdd}
                                        className="flex-1 py-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all"
                                    >
                                        Add Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SaplingManager;
