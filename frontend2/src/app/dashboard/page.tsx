'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

// ... (interfaces)

const DashboardPage = () => {
  const [googleAccounts, setGoogleAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ... (useEffect for token and accounts)

  const fetchChannels = useCallback(async () => {
    if (!selectedAccountId || !token) {
      setChannels([]);
      return;
    }

    setLoadingChannels(true);
    try {
      const res = await axios.get(`/api/youtube/channels?googleAccountId=${selectedAccountId}`, {
        headers: { 'x-auth-token': token },
      });
      setChannels(res.data);
    } catch (err) {
      console.error('Error fetching channels:', err);
    }
    setLoadingChannels(false);
  }, [selectedAccountId, token]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // ... (handleConnect, handleDisconnect)

  const handleCreateChannel = () => {
    window.open('https://www.youtube.com/create_channel', '_blank');
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container mx-auto p-8">
      {/* ... (header and accounts list) */}

      {selectedAccountId && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">YouTube Channels</h2>
            <button
              onClick={fetchChannels}
              className="px-3 py-1 text-sm font-medium text-indigo-600 border border-indigo-300 rounded-md hover:bg-indigo-50"
            >
              Refresh Channel List
            </button>
          </div>

          {loadingChannels ? (
            <p>Loading channels...</p>
          ) : channels.length > 0 ? (
            <ul className="space-y-4">
              {/* ... (channel list mapping) */}
            </ul>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">No YouTube Channels Found</h3>
              <p className="text-sm text-gray-500 mt-1">
                This Google account does not have any YouTube channels associated with it yet.
              </p>
              <button
                onClick={handleCreateChannel}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                Create a Channel on YouTube
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
