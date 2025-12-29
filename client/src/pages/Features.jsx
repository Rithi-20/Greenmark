import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Shield, Smartphone, ArrowLeft, Camera, LineChart, Gift } from 'lucide-react';

const Features = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Camera,
            title: "AI Growth Verification",
            desc: "Advanced computer vision algorithms analyze your sapling photos to detect species, verify authenticity, and measure growth rates automatically.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            icon: Shield,
            title: "Anti-Fraud Protocol",
            desc: "Prevents duplicate uploads and fake photos by comparing image fingerprints against a database of millions of plant images.",
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            icon: LineChart,
            title: "Carbon Impact Tracking",
            desc: "Real-time calculation of carbon sequestration based on tree species, age, and growth data, translated into kg of CO2 offset.",
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            icon: Gift,
            title: "Reward Marketplace",
            desc: "A fully integrated economy where EcoCoins earned from maintenance can be exchanged for sustainable products or monetary value.",
            color: "text-amber-600",
            bg: "bg-amber-50"
        }
    ];

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

            <main className="pt-24 px-6 lg:px-8 max-w-7xl mx-auto pb-20">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black text-gray-900 mb-6">Built for Transparency</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Our platform combines nature with blockchain-inspired verification to ensure every credit earned is backed by real, living impact.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {features.map((f, i) => (
                        <div key={i} className="flex gap-6 p-6 rounded-3xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group">
                            <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                <f.icon className={`w-7 h-7 ${f.color}`} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">
                                    {f.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Features;
