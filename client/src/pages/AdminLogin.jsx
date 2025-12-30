import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { API_URL } from '../config';
import { LayoutDashboard, Lock, ArrowRight, Leaf, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post(`${API_URL}/auth/admin/login`, { email, password });

            login(data, true);
            navigate('/admin/dashboard');
        } catch (err) {
            console.error('Login Error:', err);
            const msg = err.response?.data?.message || err.response?.data || err.message || 'Login failed.';
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-green-50 rounded-full blur-[120px] opacity-50 -mt-96 z-0"></div>

            {/* Back Arrow */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-50 p-2 bg-white hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-green-600 shadow-sm border border-gray-100"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
                    <div className="flex flex-col items-center mb-10 text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100 mb-4 group hover:rotate-12 transition-transform">
                            <Leaf className="w-7 h-7 fill-white" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Admin Portal</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Management Console</p>
                    </div>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Administrator Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Security Key</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50/50 rounded-2xl border border-slate-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-[10px] font-black uppercase tracking-widest text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full py-5 text-base font-black bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-2 group"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : (
                                <>
                                    Authorize Access <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center">
                        <Link to="/" className="text-xs font-bold text-slate-400 hover:text-green-600 transition-colors uppercase tracking-widest">
                            Return to Website
                        </Link>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        <Lock className="w-3 h-3" /> Secure
                    </div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                        <LayoutDashboard className="w-3 h-3" /> Dashboard
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
