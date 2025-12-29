import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, ShieldCheck, MapPin, Sprout, Gift } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const UserManager = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/users`);

            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                        <p className="text-sm text-slate-500">View and manage registered green citizens</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((u) => (
                            <div key={u._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
                                            <User className="w-8 h-8 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900">{u.name}</h3>
                                            <p className="text-sm font-mono text-slate-400">{u.user_id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm truncate">{u.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm">{u.mobile || 'No mobile set'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm">Joined {new Date(u.registered_date).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-2">
                                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Saplings</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <Sprout className="w-3 h-3 text-green-600" />
                                                <span className="text-sm font-bold text-slate-900">{u.saplingsOwned?.length || 0}</span>
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Carbon</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                                <span className="text-sm font-bold text-slate-900">{u.total_carbon || 0}kg</span>
                                            </div>
                                        </div>
                                        <div className="text-center p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">EcoCoins</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <Gift className="w-3 h-3 text-purple-600" />
                                                <span className="text-sm font-bold text-slate-900">{u.reward_points || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 flex justify-between items-center">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {u.status || 'Active'}
                                    </span>
                                    <button
                                        onClick={() => navigate(`/admin/users/${u.user_id}/history`)}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        View History →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && users.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <User className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">No users found</h3>
                        <p className="text-slate-500">Once citizens register, they will appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default UserManager;
