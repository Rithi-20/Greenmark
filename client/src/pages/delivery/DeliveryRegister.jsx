import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, Leaf, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import axios from 'axios';
import { API_URL } from '../../config';

const DeliveryRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', mobile: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simple client-side validation for mobile
        if (!/^\d{10}$/.test(formData.mobile)) {
            setLoading(false);
            return setError('Please enter a valid 10-digit mobile number');
        }
        try {
            await axios.post(`${API_URL} /delivery/register`, formData);
            alert('Registration Successful! Please login.');
            navigate('/delivery/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#EAFCF3] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-[100px] opacity-30 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200 rounded-full blur-[100px] opacity-30 -ml-20 -mb-20"></div>

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
                <h2 className="text-5xl font-black text-gray-900 tracking-tight text-center">Join as Partner</h2>
                <p className="mt-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                    Create an account to start delivering
                </p>
            </div>

            <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border-t-[8px] border-green-500 relative overflow-hidden">
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-black uppercase tracking-widest text-center mb-8 border border-red-100 animate-shake">{error}</div>}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Mobile Number</label>
                            <input
                                type="tel"
                                required
                                pattern="[0-9]{10}"
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-6 py-4 bg-[#EFF6FF] rounded-2xl border border-transparent focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <Button
                            disabled={loading}
                            className="w-full py-5 text-base font-black bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-2xl shadow-xl shadow-green-600/20 transition-all flex items-center justify-center gap-2 group mt-6"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    Register <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center mt-10 pt-6 border-t border-gray-50">
                        <Link to="/delivery/login" className="text-green-600 font-black text-[10px] hover:text-green-700 transition-colors uppercase tracking-[0.2em]">
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryRegister;
