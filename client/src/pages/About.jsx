import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Award, TrendingUp, Users, ArrowLeft } from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-green-100 selection:text-green-900">
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                        <span className="font-bold text-gray-900 text-sm">Back to Home</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <Leaf className="w-5 h-5 fill-white" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-gray-900">GreenMark</span>
                    </div>
                </nav>
            </header>

            <main className="pt-24 px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="max-w-4xl mx-auto text-center py-12">
                    <h1 className="text-4xl font-black text-gray-900 mb-6">Our Mission</h1>
                    <p className="text-xl text-gray-600 leading-relaxed mb-12">
                        To incentivize environmental stewardship through technology, creating a verifiable link between <span className="text-green-600 font-bold">planting trees</span> and <span className="text-green-600 font-bold">real-world rewards</span>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-16">
                        <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                <Leaf className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Grow</h3>
                            <p className="text-gray-600 text-sm">
                                Adopt saplings and nurture them. We track each plant's journey from seed to tree using unique identifiers.
                            </p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Track</h3>
                            <p className="text-gray-600 text-sm">
                                Upload monthly photos. Our AI analyzes growth, health, and authenticity to verify your environmental impact.
                            </p>
                        </div>
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                                <Award className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Earn</h3>
                            <p className="text-gray-600 text-sm">
                                Convert your "green efforts" into EcoCoins. Redeem them for products, discounts, or cash rewards.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;
