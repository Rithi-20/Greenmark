import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Download, DownloadCloud, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';
import CertificateTemplate from '../../components/CertificateTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Certificates = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCertificates();
        }
    }, [user]);

    const fetchCertificates = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/user/${user.user_id}/certificates`);

            setCertificates(data);
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (certId) => {
        const element = document.getElementById(`cert-${certId}`);
        if (!element) return;

        setDownloading(true);
        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher scale for better resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Determine orientation based on canvas dimensions
            const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';

            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const widthRatio = pageWidth / canvas.width;
            const heightRatio = pageHeight / canvas.height;
            const ratio = widthRatio < heightRatio ? widthRatio : heightRatio;

            const finalWidth = canvas.width * ratio;
            const finalHeight = canvas.height * ratio;

            // Center image
            const x = (pageWidth - finalWidth) / 2;
            const y = (pageHeight - finalHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
            pdf.save(`GreenMark_Certificate_${certId.slice(-6)}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Wall of Impact</h1>
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Your Carbon Certifications</p>
                        </div>
                    </div>
                    <Award className="w-6 h-6 text-amber-500" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-bold">Retrieving your awards...</p>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-16 text-center shadow-sm border border-slate-100 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Award className="w-10 h-10 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">No Certificates Issued Yet</h2>
                        <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                            Certificates are awarded when you reach major carbon offset milestones (50kg, 100kg, 500kg). Keep caring for your forest to earn your first official recognition!
                        </p>
                        <button
                            onClick={() => navigate('/user/my-forest')}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-green-600 transition-all hover:-translate-y-1"
                        >
                            Visit My Forest
                        </button>
                    </div>
                ) : (
                    <div className="space-y-20">
                        <div className="bg-green-600 rounded-xl p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-green-100">
                            <div>
                                <h2 className="text-xl font-black mb-0.5 antialiased">Congratulations, {user?.name?.split(' ')[0]}!</h2>
                                <p className="text-green-50 opacity-80 font-medium text-xs">You have earned {certificates.length} official environmental certifications.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                                <DownloadCloud className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5">Impact Tip</p>
                                    <p className="text-[10px] font-bold leading-tight">Click download for a high-res PDF version.</p>
                                </div>
                            </div>
                        </div>

                        {certificates.map((cert) => (
                            <div key={cert._id} className="relative group">
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <button
                                        onClick={() => handleDownload(cert._id)}
                                        disabled={downloading}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {downloading ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" /> Download Certificate
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="transform transition-transform group-hover:scale-[1.01] duration-500">
                                    <CertificateTemplate cert={cert} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="py-20 text-center opacity-30 select-none grayscale">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-400">GreenMark Sustainability Proof-of-Work Protocol v1.0</p>
                </div>
            </footer>
        </div>
    );
};

export default Certificates;
