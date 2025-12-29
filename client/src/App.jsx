import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import UserLogin from './pages/UserLogin'
import UserRegister from './pages/UserRegister'
import About from './pages/About'
import Features from './pages/Features'
import Contact from './pages/Contact'

// Import Premium Components with Explicit Names
import PremiumAdminDashboard from './pages/admin/AdminDashboard'
import PremiumSaplingManager from './pages/admin/SaplingManager'
import PremiumUserManager from './pages/admin/UserManager'
import PremiumVerifyImages from './pages/admin/VerifyImages'
import PremiumUserHistory from './pages/admin/UserHistory'
import PremiumCarbonMetrics from './pages/admin/CarbonMetrics'
import PremiumRewardManagement from './pages/admin/RewardManagement'
import PremiumRewardCatalog from './pages/admin/RewardCatalog'
import PremiumCarbonCertification from './pages/admin/CarbonCertification'
import PremiumOrderManagement from './pages/admin/OrderManagement'
import PremiumSaplingOrderManager from './pages/admin/SaplingOrderManager'


import PremiumUserDashboard from './pages/user/UserDashboard'
import PremiumRegisterSapling from './pages/user/RegisterSapling'
import PremiumMyForest from './pages/user/MyForest'
import PremiumUploadUpdate from './pages/user/UploadUpdate'
import PremiumSaplingStats from './pages/user/SaplingStats'
import PremiumRewards from './pages/user/Rewards'
import PremiumUserSettings from './pages/user/UserSettings'
import PremiumCertificates from './pages/user/Certificates'
import PremiumUserOrders from './pages/user/UserOrders'

import DeliveryLogin from './pages/delivery/DeliveryLogin'
import DeliveryRegister from './pages/delivery/DeliveryRegister'
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'

// Debugging Boundary
function AppError({ title }) {
    return <div style={{ padding: '40px', background: '#f8d7da', color: '#721c24', textAlign: 'center' }}>
        <h2>System Error in {title}</h2>
        <p>Please try refreshing the page or logging out.</p>
        <a href="/">Go Home</a>
    </div>
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/admin" element={<AdminLogin />} />
                    <Route path="/login" element={<UserLogin />} />
                    <Route path="/register" element={<UserRegister />} />

                    {/* Admin Portal */}
                    <Route path="/admin/dashboard" element={<PremiumAdminDashboard />} />
                    <Route path="/admin/saplings" element={<PremiumSaplingManager />} />
                    <Route path="/admin/users" element={<PremiumUserManager />} />
                    <Route path="/admin/verify" element={<PremiumVerifyImages />} />
                    <Route path="/admin/users/:userId/history" element={<PremiumUserHistory />} />
                    <Route path="/admin/carbon" element={<PremiumCarbonMetrics />} />
                    <Route path="/admin/rewards" element={<PremiumRewardManagement />} />
                    <Route path="/admin/rewards/catalog" element={<PremiumRewardCatalog />} />
                    <Route path="/admin/certification" element={<PremiumCarbonCertification />} />
                    <Route path="/admin/orders" element={<PremiumOrderManagement />} />
                    <Route path="/admin/sapling-orders" element={<PremiumSaplingOrderManager />} />


                    {/* User Portal */}
                    <Route path="/user/dashboard" element={<PremiumUserDashboard />} />
                    <Route path="/user/register-sapling" element={<PremiumRegisterSapling />} />
                    <Route path="/user/my-forest" element={<PremiumMyForest />} />
                    <Route path="/user/upload/:saplingId" element={<PremiumUploadUpdate />} />
                    <Route path="/user/saplings/:saplingId/stats" element={<PremiumSaplingStats />} />
                    <Route path="/user/rewards" element={<PremiumRewards />} />
                    <Route path="/user/settings" element={<PremiumUserSettings />} />
                    <Route path="/user/certificates" element={<PremiumCertificates />} />
                    <Route path="/user/orders" element={<PremiumUserOrders />} />
                    <Route path="/user/upload" element={<Navigate to="/user/my-forest" replace />} />

                    {/* Delivery Portal */}
                    <Route path="/delivery/login" element={<DeliveryLogin />} />
                    <Route path="/delivery/register" element={<DeliveryRegister />} />
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />

                    {/* Catch All */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App
