import React from 'react';
import { Sprout, ShieldCheck, Award } from 'lucide-react';

const CertificateTemplate = ({ cert }) => {
    if (!cert) return null;

    const issueDate = new Date(cert.issue_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div id={`cert-${cert._id}`} className="certificate-container p-4 bg-white shadow-2xl rounded-sm max-w-[800px] mx-auto my-8 border-[12px] border-double border-slate-200 relative overflow-hidden ring-1 ring-slate-100 ring-offset-8 ring-offset-white">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full -ml-32 -mb-32 opacity-20 blur-3xl pointer-events-none" />

            <div className="relative z-10 border-2 border-slate-100 p-12 text-center bg-white/50 backdrop-blur-sm">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-2 opacity-60">
                        <Sprout className="w-5 h-5 text-green-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">GreenMark Ecosystem</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-60">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serial No: {cert.serial_number}</span>
                    </div>
                </div>

                <h1 className="text-5xl font-['Playfair_Display',serif] text-slate-800 mb-4 tracking-tight italic">
                    Carbon Credit Certificate
                </h1>

                <p className="text-xs font-medium text-slate-400 uppercase tracking-[0.3em] mb-12">
                    This certificate confirms that
                </p>

                <div className="mb-12">
                    <h2 className="text-4xl font-black text-slate-900 mb-2">
                        {cert.total_carbon.toFixed(1)} carbon credits
                    </h2>
                    <p className="text-sm font-serif italic text-slate-500">
                        equivalent to {cert.total_carbon.toFixed(1)} metric tonnes of CO2e
                    </p>
                </div>

                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto leading-relaxed italic">
                    have been generated and verified through the consistent care and active preservation of urban forest saplings.
                </p>

                <div className="w-24 h-px bg-slate-200 mx-auto my-8" />

                <div className="mb-12">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">On behalf of</p>
                    <h3 className="text-5xl font-['Playfair_Display',serif] text-slate-800 italic underline decoration-slate-200 underline-offset-8">
                        {cert.user_name}
                    </h3>
                </div>

                <div className="flex justify-between items-end mt-20 px-8">
                    <div className="text-left">
                        <p className="text-lg font-serif italic text-slate-800 mb-1">{issueDate}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Issuance</p>
                    </div>

                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-double border-green-600 rounded-full flex items-center justify-center rotate-12 opacity-80 scale-110">
                            <div className="text-center">
                                <ShieldCheck className="w-10 h-10 text-green-600 mx-auto" />
                                <p className="text-[8px] font-black text-green-600 uppercase mt-1">Verified</p>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center -z-10 bg-green-50 rounded-full blur-xl opacity-50" />
                    </div>

                    <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-1">
                            <Award className="w-5 h-5 text-amber-500" />
                            <span className="text-lg font-black text-slate-800">{cert.eco_coins}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sustainability Credits</p>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="mt-16 pt-8 border-t border-slate-50 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">
                    Officially Issued by GreenMark Carbon Mitigation Authority
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .certificate-container, .certificate-container * { visibility: visible; }
                    .certificate-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: auto; 
                        margin: 0; 
                        box-shadow: none; 
                        border: 12px border-double border-slate-200 !important;
                    }
                    button { display: none !important; }
                }
            ` }} />
        </div>
    );
};

export default CertificateTemplate;
