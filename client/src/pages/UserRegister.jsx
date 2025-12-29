import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { API_URL } from '../config';
import { Leaf, ArrowLeft, ArrowRight } from 'lucide-react';

const UserRegister = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { name, email, mobile, password } = formData;
            const { data } = await axios.post(`${API_URL}/auth/user/register`, {
                name, email, mobile, password
            });
            login(data);
            navigate('/user/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
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
                <h2 className="text-4xl font-black text-gray-900 tracking-tight text-center">Join Us Today</h2>
                <p className="mt-3 text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
                    Start your carbon offsetting journey
                </p>
            </div>

            <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-10 rounded-[2rem] shadow-2xl border-t-[8px] border-green-500 relative overflow-hidden">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Full Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Mobile Number</label>
                                <input
                                    name="mobile"
                                    type="tel"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Confirm Password</label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10 outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
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
                            {loading ? 'Creating Account...' : (
                                <>
                                    Register <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center bg-gradient-to-r from-transparent via-gray-100 to-transparent bg-[length:100%_1px] bg-no-repeat bg-top pt-6">
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                            Already have an account? {' '}
                            <Link to="/login" className="text-green-600 hover:text-green-700 underline decoration-2 underline-offset-4">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRegister;
