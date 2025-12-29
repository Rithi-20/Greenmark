import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, ArrowLeft, Clock } from 'lucide-react';

const Contact = () => {
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

            <main className="pt-24 px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center min-h-[90vh]">
                <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-6">Get in Touch</h1>
                        <p className="text-lg text-gray-600 mb-8">
                            We'd love to hear from you. Our team is always here to chat about trees, tech, or the future of our planet.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-0.5">Email Us</h3>
                                    <p className="text-sm font-medium text-gray-500">For general inquiries & support</p>
                                    <a href="mailto:admin@greenmark.com" className="text-green-600 font-bold hover:underline">admin@greenmark.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-0.5">Call Us</h3>
                                    <p className="text-sm font-medium text-gray-500">Mon-Fri from 9am to 6pm</p>
                                    <a href="tel:9944335406" className="text-green-600 font-bold hover:underline">+91 9944335406</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-0.5">Visit Details</h3>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Main Operation Center</p>
                                    <p className="text-gray-900 font-medium leading-relaxed">
                                        Dr. N.G.P Institute of Technology,<br />
                                        Coimbatore, Tamil Nadu.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded-[40px] border border-gray-100 hidden lg:block overflow-hidden h-[450px]">
                        <iframe
                            src="https://www.google.com/maps?q=Dr.+N.G.P.+Institute+of+Technology,+Coimbatore&output=embed"
                            className="w-full h-full rounded-[35px]"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Contact;
