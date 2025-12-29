import React, { useState, useEffect } from 'react';
import UserLayout from '../../components/UserLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../../config';

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserSettings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                mobile: user.mobile || '',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate password match if changing password
        if (formData.newPassword || formData.confirmPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            if (formData.newPassword.length < 6) {
                alert('Password must be at least 6 characters long!');
                return;
            }
        }

        setLoading(true);
        try {
            const updateData = {
                name: formData.name,
                mobile: formData.mobile
            };

            // Only include password if it's being changed
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await axios.put(`${API_URL}/user/${user.user_id}/update`, updateData);

            alert('Settings updated successfully!');

            // Clear password fields
            setFormData({
                ...formData,
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-6">
                <div className="flex items-center gap-3 mb-5">
                    <button
                        onClick={() => navigate('/user/dashboard')}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900">Account Settings</h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Input
                                    label="Full Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Email Address"
                                    value={user?.email}
                                    disabled
                                />
                                <Input
                                    label="Mobile Number"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-100 my-6" />

                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                                Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Input
                                    label="New Password"
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                />
                                <Input
                                    label="Confirm New Password"
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <Button
                                variant="ghost"
                                onClick={(e) => { e.preventDefault(); navigate('/user/dashboard'); }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserSettings;
