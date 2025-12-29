import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../../components/UserLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Upload as UploadIcon, Camera, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config';
import { useAuth } from '../../context/AuthContext';

const UploadImage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [saplings, setSaplings] = useState([]);
    const [selectedSapling, setSelectedSapling] = useState('');
    const [status, setStatus] = useState('Healthy');
    const [growthIndicators, setGrowthIndicators] = useState('');
    const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
    const [loading, setLoading] = useState(false);

    // In a real scenario, we handle file input -> IPFS upload -> get hash.
    // Here we will simulate it.
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (user) {
            axios.get(`${API_URL}/user/${user.user_id}/saplings`)
                .then(res => setSaplings(res.data))
                .catch(err => console.error(err));
        }
    }, [user]);

    const handleUpload = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('userId', user.user_id);
            formData.append('sapling_id', selectedSapling);
            formData.append('image', file);
            formData.append('plant_status', status);
            formData.append('growth_indicators', growthIndicators);

            await axios.post(`${API_URL}/user/upload`, formData);

            alert('✨ Growth update uploaded successfully. Our AI will verify it shortly.');

            // Clear form
            setFile(null);
            setGrowthIndicators('');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserLayout>
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/user/dashboard')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Monthly Growth Update</h2>
            </div>

            <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Sapling</label>
                        <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            value={selectedSapling}
                            onChange={(e) => setSelectedSapling(e.target.value)}
                            required
                        >
                            <option value="">-- Choose a plant --</option>
                            {saplings.map(s => (
                                <option key={s._id} value={s.sapling_id}>{s.plant_name} ({s.sapling_id})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                        <select
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="Healthy">Healthy & Growing</option>
                            <option value="Needs Water">Needs Water / Dry Soil</option>
                            <option value="Dry">Dried / Withering</option>
                            <option value="Dead">Dead / Critical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Growth Indicators</label>
                        <textarea
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="e.g., New leaves spotted, increased height, vibrant green color..."
                            value={growthIndicators}
                            onChange={(e) => setGrowthIndicators(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="space-y-2">
                            <div className="mx-auto h-12 w-12 text-gray-400">
                                <Camera className="w-full h-full" />
                            </div>
                            <div className="text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>

                    {file && <p className="text-sm text-green-600 font-medium">Selected: {file.name}</p>}

                    <Button type="submit" className="w-full" disabled={loading || !selectedSapling}>
                        {loading ? 'Uploading...' : 'Submit Update'}
                    </Button>
                </form>
            </div>
        </UserLayout>
    );
};

export default UploadImage;
