'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

// ... (interfaces)

const DashboardPage = () => {
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [channels, setChannels]        = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ... (useEffect hooks)

  const handleConnect = () => {
    window.location.href = `/api/auth/google?token=${token}`;
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await axios.delete(`/api/youtube/accounts/${accountId}`, {
        headers: { 'x-auth-token': token },
      });
      // Refresh the list of accounts
      setGoogleAccounts((prev) => prev.filter((acc) => acc._id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        setChannels([]);
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
    }
  };

  // ... (loading state)

  return (
    <div className="container mx-auto p-8">
      {/* ... */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Connected Google Accounts</h2>
        <ul className="space-y-2">
          {googleAccounts.map((account) => (
            <li
              key={account._id}
              onClick={() => setSelectedAccountId(account._id)}
              className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                selectedAccountId === account._id ? 'bg-indigo-100' : 'hover:bg-gray-50'
              }`}
            >
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-gray-500">{account.email}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent li onClick from firing
                  handleDisconnect(account._id);
                }}
                className="px-3 py-1 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Disconnect
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={handleConnect}
          className="mt-4 w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          Add Another Google Account
        </button>
      </div>

      {/* ... (channel list) */}
    </div>
  );
};

export default DashboardPage;
