'use client';
import React from 'react';

const HomePage = () => {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-10 rounded-lg shadow-xl text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Welcome to the YouTube Manager</h1>
        <p className="text-lg text-gray-300 mb-8">
          Connect your Google account to manage your YouTube channels seamlessly.
        </p>
        <button
          onClick={handleLogin}
          className="px-6 py-3 font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default HomePage;
