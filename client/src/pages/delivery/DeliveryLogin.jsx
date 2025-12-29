import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Lock, ArrowRight, Leaf, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import axios from 'axios';
import { API_URL } from '../../config';

const DeliveryLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ mobile: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/delivery/login`, formData);
            localStorage.setItem('delivery_user', JSON.stringify(res.data));
            navigate('/delivery/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EAFCF3] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full blur-[100px] opacity-30 -ml-20 -mt-20"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200 rounded-full blur-[100px] opacity-30 -mr-20 -mb-20"></div>

            {/* Back Arrow */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 z-50 p-2 bg-white hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-green-600 shadow-sm border border-gray-100"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-full max-w-lg mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-4 drop-shadow-sm">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                        <Leaf className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight text-gray-900 uppercase">GreenMark</span>
                </div>
                <h2 className="text-6xl font-black text-gray-900 tracking-tighter text-center">Welcome Back</h2>
                <p className="mt-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                    Or <Link to="/delivery/register" className="text-green-600 hover:text-green-700 underline underline-offset-4 decoration-2">Apply to be a partner</Link>
                </p>
            </div>

            <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-t-[8px] border-green-500 relative overflow-hidden">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6 animate-shake">
                            <p className="text-sm font-bold text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email or Mobile Number</label>
                            <input
                                type="text"
                                required
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Password</label>
                                <a href="#" className="text-[10px] font-black text-green-600 hover:text-green-700 uppercase tracking-wider">Forgot password?</a>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <Button
                            className="w-full py-5 text-base font-black bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-2 group"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DeliveryLogin;
