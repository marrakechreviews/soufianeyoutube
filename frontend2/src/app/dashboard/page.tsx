'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

interface GoogleAccount {
  _id: string;
  name: string;
  email: string;
}

interface Channel {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
  };
}

const DashboardPage = () => {
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessedToken = useRef(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const effectiveToken = tokenFromUrl || localStorage.getItem('token');

    if (!effectiveToken) {
      router.push('/');
      return;
    }

    setIsAuthenticated(true);
    setToken(effectiveToken);

    if (tokenFromUrl && !hasProcessedToken.current) {
      hasProcessedToken.current = true;
      localStorage.setItem('token', tokenFromUrl);
      router.replace('/dashboard', { scroll: false });
    }

    const fetchAccounts = async () => {
      // setLoading is already true, no need to set it again.
      try {
        const res = await axios.get('/api/youtube/accounts', {
          headers: { 'x-auth-token': effectiveToken },
        });
        setGoogleAccounts(res.data);
        if (res.data.length > 0 && !selectedAccountId) {
          setSelectedAccountId(res.data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching Google accounts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [searchParams, router, selectedAccountId]);

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
    } finally {
      setLoadingChannels(false);
    }
  }, [selectedAccountId, token]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleConnect = () => {
    const storedToken = localStorage.getItem('token');
    window.location.href = `/api/auth/google?token=${storedToken}`;
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      await axios.delete(`/api/youtube/accounts/${accountId}`, {
        headers: { 'x-auth-token': token },
      });
      setGoogleAccounts((prev) => prev.filter((acc) => acc._id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null);
        setChannels([]);
      }
    } catch (err) {
      console.error('Error disconnecting account:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/');
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/templates')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Manage Templates
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
          <h2 className="text-xl font-semibold mb-4">Connected Google Accounts</h2>
          <ul className="space-y-2">
            {googleAccounts.map((account) => (
              <li
                key={account._id}
                onClick={() => setSelectedAccountId(account._id)}
                className={`p-3 rounded-md cursor-pointer flex justify-between items-center transition-colors ${
                  selectedAccountId === account._id ? 'bg-indigo-900' : 'hover:bg-gray-700'
                }`}
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-400">{account.email}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnect(account._id);
                  }}
                  className="px-3 py-1 text-sm font-medium text-red-400 border border-red-400 rounded-md hover:bg-red-900"
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

        {selectedAccountId && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">YouTube Channels</h2>
              <button
                onClick={fetchChannels}
                className="px-3 py-1 text-sm font-medium text-indigo-400 border border-indigo-400 rounded-md hover:bg-indigo-900"
              >
                Refresh Channel List
              </button>
            </div>

            {loadingChannels ? (
              <p>Loading channels...</p>
            ) : channels.length > 0 ? (
              <ul className="space-y-4">
                {channels.map((channel) => (
                  <li
                    key={channel.id}
                    onClick={() => router.push(`/upload/${selectedAccountId}/${channel.id}`)}
                    className="p-4 rounded-lg flex items-center space-x-4 cursor-pointer bg-gray-700 hover:bg-gray-600 border-2 border-transparent hover:border-indigo-500"
                  >
                    <img
                      src={channel.snippet.thumbnails.default.url}
                      alt={channel.snippet.title}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">
                        {channel.snippet.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Subscribers: {channel.statistics.subscriberCount} | Videos:{' '}
                        {channel.statistics.videoCount}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">No YouTube Channels Found</h3>
                <p className="text-sm text-gray-400 mt-1">
                  This Google account does not have any YouTube channels associated with it yet.
                </p>
                <button
                  onClick={() => window.open('https://www.youtube.com/create_channel', '_blank')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                >
                  Create a Channel on YouTube
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
