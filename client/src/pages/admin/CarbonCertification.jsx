import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ShieldCheck, Mail, Send, Filter, Search, CheckCircle2, Trophy, Medal, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';

const CarbonCertification = () => {
    const navigate = useNavigate();
    const [eligibleUsers, setEligibleUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEligible();
    }, []);

    const fetchEligible = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/admin/certificates/eligible`);

            setEligibleUsers(data);
        } catch (error) {
            console.error('Error fetching eligible users:', error);
        } finally {
            setLoading(false);
        }
    };

    const issueCert = async (userId, level) => {
        try {
            await axios.post(`${API_URL}/admin/certificates/issue/${userId}`, {

                certificateType: level
            });
            alert(`${level} Carbon Offset Certificate issued and notified!`);
            fetchEligible(); // Refresh the list to show updated status
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to issue certificate');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold text-sm">Identifying Eligible Citizens...</div>;

    const filteredUsers = eligibleUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">Certification Center</h1>
                            </div>
                            <p className="text-slate-500 font-medium text-xs">Verify impact milestones and issue official Carbon Offset Certificates.</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by ID or Name..."
                            className="bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold w-full md:w-64 shadow-sm focus:ring-1 focus:ring-green-100 focus:border-green-600 transition-all outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <ThresholdCard
                        icon={Award}
                        level="Silver"
                        threshold="50kg"
                        description="Initial recognition for consistent environmental maintenance."
                        color="text-slate-400"
                        count={eligibleUsers.filter(u => u.level === 'Silver').length}
                    />
                    <ThresholdCard
                        icon={Medal}
                        level="Gold"
                        threshold="100kg"
                        description="Intermediate honor for dedicated forest preservation."
                        color="text-amber-500"
                        count={eligibleUsers.filter(u => u.level === 'Gold').length}
                    />
                    <ThresholdCard
                        icon={Trophy}
                        level="Platinum"
                        threshold="500kg"
                        description="Highest distinction for massive scale carbon sequestration."
                        color="text-emerald-600"
                        count={eligibleUsers.filter(u => u.level === 'Platinum').length}
                    />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-50">
                        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                            Eligible Citizens
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest font-black">
                                {filteredUsers.length} Qualifying
                            </span>
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left bg-slate-50/50">
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen Details</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Offset</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tier Level</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                    {u.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-xs">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium tracking-widest">{u.user_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <p className="font-black text-slate-900 tabular-nums text-xs">{u.total_carbon.toFixed(1)} kg</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm
                                                ${u.level === 'Platinum' ? 'bg-emerald-100 text-emerald-700' :
                                                    u.level === 'Gold' ? 'bg-amber-100 text-amber-700' :
                                                        u.level === 'Silver' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}
                                            >
                                                {u.level} Tier
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {u.certificateIssued ? (
                                                <div className="flex items-center gap-1.5 text-green-600 text-[9px] font-black uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3 h-3" /> Issued
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                                    <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" /> Not Issued
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                onClick={() => issueCert(u.user_id, u.level)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-95"
                                            >
                                                <Send className="w-3 h-3" /> Issue
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ThresholdCard = ({ icon: Icon, level, threshold, description, color, count }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 relative group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 bg-slate-50 ${color} rounded-lg group-hover:rotate-12 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-100 group-hover:text-slate-200 transition-colors uppercase tracking-tighter">
                {level}
            </span>
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1">{threshold} Goal</h3>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-4">{description}</p>
        <div className="flex items-center justify-between">
            <div className="flex -space-x-1.5">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-5 h-5 border-2 border-white rounded-full bg-slate-200" />
                ))}
                <div className="w-5 h-5 border-2 border-white rounded-full bg-slate-100 flex items-center justify-center text-[7px] font-black">+8</div>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{count} Eligible</p>
        </div>
    </div>
);

export default CarbonCertification;
