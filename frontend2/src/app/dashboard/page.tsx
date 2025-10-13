'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';

const DashboardPage = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      setToken(tokenFromUrl);
      router.replace('/dashboard', { scroll: false });
    } else {
      setToken(localStorage.getItem('token'));
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!token) {
        setLoading(false);
        setChannels([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get('http://localhost:3000/api/youtube/channels', {
          headers: {
            'x-auth-token': token,
          },
        });
        setChannels(res.data);
      } catch (err) {
        console.error('Error fetching channels:', err);
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [token]);

  const handleConnect = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  const handleDisconnect = async () => {
    try {
      await axios.put(
        'http://localhost:3000/api/youtube/disconnect',
        {},
        {
          headers: {
            'x-auth-token': token,
          },
        }
      );
      localStorage.removeItem('token');
      setToken(null);
    } catch (err) {
      console.error('Error disconnecting account:', err);
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {channels.length > 0 ? 'Select a Channel' : 'Your YouTube Channels'}
            </h2>
            <div>
              <button
                onClick={handleConnect}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
              >
                Refresh Connection / Add Account
              </button>
              {channels.length > 0 && (
                <button
                  onClick={handleDisconnect}
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Disconnect YouTube Account
                </button>
              )}
            </div>
          </div>
          {channels.length > 0 ? (
            <div>
              <ul className="space-y-4">
                {channels.map((channel: any) => (
                  <li
                    key={channel.id}
                    className={`p-4 rounded-lg flex items-center space-x-4 cursor-pointer transition-colors ${
                      selectedChannelId === channel.id
                        ? 'bg-indigo-100 border-indigo-500 border-2'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => handleChannelSelect(channel.id)}
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
              {selectedChannelId && (
                <div className="mt-6 text-right">
                  <button
                    onClick={() => router.push(`/upload/${selectedChannelId}`)}
                    className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700"
                  >
                    Continue to Upload for Selected Channel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                No YouTube channels found. Connect your YouTube account to see
                your channels here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
