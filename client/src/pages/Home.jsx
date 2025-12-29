import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Leaf, ShieldCheck, Truck } from 'lucide-react';

const Home = () => {
    return (
        <div className="h-screen bg-white relative overflow-hidden font-sans selection:bg-green-100 selection:text-green-900 flex flex-col">
            {/* Background Gradients */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
                <div
                    className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ff8c] to-[#047857] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                ></div>
            </div>

            <header className="z-50 w-full">
                <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-green-200 group-hover:bg-green-700 transition-colors">
                                <Leaf className="w-5 h-5 fill-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-gray-900">GreenMark</span>
                        </Link>
                    </div>
                    <div className="hidden lg:flex lg:gap-x-12">
                        {['About', 'Features', 'Contact'].map((item) => (
                            <Link key={item} to={`/${item.toLowerCase()}`} className="text-sm font-semibold leading-6 text-gray-600 hover:text-green-600 transition-colors">
                                {item}
                            </Link>
                        ))}
                    </div>
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-3">
                        <Link to="/login">
                            <Button variant="ghost" className="text-gray-600 hover:text-gray-900 font-bold">Log in</Button>
                        </Link>
                        <Link to="/register">
                            <Button className="rounded-full px-6 shadow-lg shadow-green-200 hover:shadow-green-300 transition-all hover:-translate-y-0.5 font-bold">Sign up</Button>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="flex-1 flex items-center justify-center relative px-6 lg:px-8">
                <div className="max-w-3xl text-center pb-12">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl mb-4">
                        Track your plants, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Redeem rewards</span>
                    </h1>

                    <p className="mt-4 text-base leading-7 text-gray-600 max-w-xl mx-auto font-medium">
                        GreenMark connects sapling owners with authorities to ensure every plant is accounted for. Upload photos, verify growth with AI, and earn carbon credits.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto rounded-full px-8 py-4 text-base font-bold shadow-xl shadow-green-200 hover:shadow-2xl hover:shadow-green-300 transition-all hover:-translate-y-1 bg-green-600 hover:bg-green-700 border-none">
                                Get started free
                            </Button>
                        </Link>

                        <div className="flex flex-col sm:flex-row items-center gap-3 text-sm font-bold mt-4 sm:mt-0">
                            <Link to="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors px-4 py-2 rounded-full hover:bg-gray-100">
                                <ShieldCheck className="w-4 h-4" /> Admin Access
                            </Link>
                            <Link to="/delivery/login" className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors px-4 py-2 rounded-full hover:bg-gray-50">
                                <Truck className="w-4 h-4" /> Delivery Partner
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Gradient for Depth */}
            <div
                className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                aria-hidden="true"
            >
                <div
                    className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                    style={{
                        clipPath:
                            "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                    }}
                ></div>
            </div>
        </div>
    );
}

export default Home;
