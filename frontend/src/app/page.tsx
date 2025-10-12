import React from 'react';
import YouTubeAccountList from '@/components/YouTubeAccountList';
import ConnectAccountButton from '@/components/ConnectAccountButton';

const DashboardPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ConnectAccountButton />
      </div>
      <YouTubeAccountList />
    </div>
  );
};

export default DashboardPage;
