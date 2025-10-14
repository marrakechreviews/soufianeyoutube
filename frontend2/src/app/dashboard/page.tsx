'use client';

import React, { useState, useEffect } from 'react';
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
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    const effectiveToken = tokenFromUrl || localStorage.getItem('token');

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      router.replace('/dashboard', { scroll: false });
    }
    setToken(effectiveToken);

    if (effectiveToken) {
      const fetchAccounts = async () => {
        setLoading(true);
        try {
          const res = await axios.get('/api/youtube/accounts', {
            headers: { 'x-auth-token': effectiveToken },
          });
          setGoogleAccounts(res.data);
          if (res.data.length > 0) {
            setSelectedAccountId(res.data[0]._id);
          }
        } catch (err) {
          console.error('Error fetching Google accounts:', err);
        }
        setLoading(false);
      };
      fetchAccounts();
    } else {
      setLoading(false);
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!selectedAccountId || !token) {
      setChannels([]);
      return;
    }

    const fetchChannels = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/youtube/channels?googleAccountId=${selectedAccountId}`, {
          headers: { 'x-auth-token': token },
        });
        setChannels(res.data);
      } catch (err) {
        console.error('Error fetching channels:', err);
      }
      setLoading(false);
    };
    fetchChannels();
  }, [selectedAccountId, token]);

  const handleConnect = () => {
    window.location.href = `/api/auth/google?token=${token}`;
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

  if (loading && googleAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={() => router.push('/templates')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Manage Templates
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Connected Google Accounts</h2>
          <ul className="space-y-2">
            {googleAccounts.map((account) => (
              <li
                key={account._id}
                onClick={() => setSelectedAccountId(account._id)}
                className={`p-3 rounded-md cursor-pointer flex justify-between items-center transition-colors ${
                  selectedAccountId === account._id ? 'bg-indigo-100' : 'hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-sm text-gray-500">{account.email}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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

        {selectedAccountId && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Select a YouTube Channel to Continue</h2>
            {loading ? (
              <p>Loading channels...</p>
            ) : (
              <ul className="space-y-4">
                {channels.map((channel) => (
                  <li
                    key={channel.id}
                    onClick={() => router.push(`/upload/${selectedAccountId}/${channel.id}`)}
                    className="p-4 rounded-lg flex items-center space-x-4 cursor-pointer bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-indigo-500"
                  >
                    <img
                      src={channel.snippet.thumbnails.default.url}
                      alt={channel.snippet.title}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {channel.snippet.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Subscribers: {channel.statistics.subscriberCount} | Videos:{' '}
                        {channel.statistics.videoCount}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
