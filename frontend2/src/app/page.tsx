'use client';
import React from 'react';

const HomePage = () => {
  const handleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the YouTube Manager</h1>
        <p className="text-lg text-gray-600 mb-8">
          Connect your Google account to manage your YouTube channels seamlessly.
        </p>
        <button
          onClick={handleLogin}
          className="px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default HomePage;
