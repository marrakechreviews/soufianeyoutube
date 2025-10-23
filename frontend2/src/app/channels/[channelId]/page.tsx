'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
    publishTime: string;
  };
}

const ManageVideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [videoStats, setVideoStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', privacyStatus: 'private' });
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;

  const fetchVideos = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`/api/videos/channel/${channelId}`, {
        headers: { 'x-auth-token': token },
      });
      setVideos(res.data);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to fetch videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [channelId, router]);

  useEffect(() => {
    if (channelId) {
      fetchVideos();
    }
  }, [channelId, fetchVideos]);

  const handleOpenManageModal = async (videoId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`/api/videos/${videoId}`, {
        headers: { 'x-auth-token': token },
      });
      setSelectedVideo(res.data);
      setFormData({
        title: res.data.snippet.title,
        description: res.data.snippet.description,
        privacyStatus: res.data.status.privacyStatus,
      });
      setIsManageModalOpen(true);
    } catch (err) {
      console.error('Error fetching video details:', err);
      setError('Could not fetch video details.');
    }
  };

  const handleCloseManageModal = () => {
    setIsManageModalOpen(false);
    setSelectedVideo(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`/api/videos/${selectedVideo.id}`, formData, {
        headers: { 'x-auth-token': token },
      });
      handleCloseManageModal();
      fetchVideos(); // Refresh the list
    } catch (err) {
      console.error('Error updating video:', err);
      setError('Failed to update video.');
    }
  };

  const handleDeleteVideo = async () => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`/api/videos/${selectedVideo.id}`, {
            headers: { 'x-auth-token': token },
            });
            handleCloseManageModal();
            fetchVideos(); // Refresh the list
        } catch (err) {
            console.error('Error deleting video:', err);
            setError('Failed to delete video.');
        }
    }
  };

  const handleOpenStatsModal = async (videoId: string) => {
    const token = localStorage.getItem('token');
    setIsStatsModalOpen(true);
    setLoadingStats(true);
    try {
      const res = await axios.get(`/api/videos/stats/${videoId}`, {
        headers: { 'x-auth-token': token },
      });
      setVideoStats(res.data);
    } catch (err) {
      console.error('Error fetching video stats:', err);
      setError('Could not fetch video stats.');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleCloseStatsModal = () => {
    setIsStatsModalOpen(false);
    setVideoStats(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading Videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <button onClick={() => router.back()} className="mb-6 text-indigo-400 hover:underline">
        &larr; Back to Dashboard
      </button>
      <h1 className="text-3xl font-bold mb-6">Manage Videos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id.videoId} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <img src={video.snippet.thumbnails.default.url} alt={video.snippet.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2" title={video.snippet.title}>
                {video.snippet.title.length > 50 ? `${video.snippet.title.substring(0, 50)}...` : video.snippet.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Published on: {new Date(video.snippet.publishTime).toLocaleDateString()}
              </p>
              <div className="flex justify-between space-x-2">
                <button onClick={() => handleOpenManageModal(video.id.videoId)} className="w-full px-4 py-2 text-sm font-medium bg-indigo-600 rounded-md hover:bg-indigo-700">
                  Manage
                </button>
                <button onClick={() => handleOpenStatsModal(video.id.videoId)} className="w-full px-4 py-2 text-sm font-medium bg-gray-600 rounded-md hover:bg-gray-500">
                  View Stats
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isStatsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6">Video Statistics</h2>
                {loadingStats ? (
                    <p>Loading stats...</p>
                ) : videoStats ? (
                    <div>
                        <div className="grid grid-cols-3 gap-4 text-center mb-6">
                            <div>
                                <p className="text-2xl font-bold">{videoStats.basicStats[0]}</p>
                                <p className="text-sm text-gray-400">Views</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{videoStats.basicStats[1]}</p>
                                <p className="text-sm text-gray-400">Likes</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{videoStats.basicStats[2]}</p>
                                <p className="text-sm text-gray-400">Comments</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Top 5 Viewer Countries</h3>
                            <ul>
                                {videoStats.topCountries.map(([country, views]: [string, number]) => (
                                    <li key={country} className="flex justify-between items-center py-1">
                                        <span>{country}</span>
                                        <span>{views} views</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <p>No stats available for this video.</p>
                )}
                <div className="mt-6 text-right">
                    <button onClick={handleCloseStatsModal} className="px-4 py-2 font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {isManageModalOpen && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Manage Video</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  name="description"
                  id="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                ></textarea>
              </div>
              <div className="mb-6">
                <label htmlFor="privacyStatus" className="block text-sm font-medium text-gray-300 mb-1">Privacy</label>
                <select
                  name="privacyStatus"
                  id="privacyStatus"
                  value={formData.privacyStatus}
                  onChange={handleFormChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                </select>
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Video
                </button>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={handleCloseManageModal}
                        className="px-4 py-2 font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Save Changes
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVideosPage;
