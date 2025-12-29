import React from 'react';
import UserSidebar from './UserSidebar';

const UserLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <UserSidebar />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
};

export default UserLayout;
