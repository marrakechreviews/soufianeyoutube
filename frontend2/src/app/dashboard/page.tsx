'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const DashboardPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store the token (e.g., in localStorage or a cookie)
      localStorage.setItem('token', token);
      // Redirect to the main dashboard or home page, without the token in the URL
      router.push('/');
    }
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading...</p>
    </div>
  );
};

export default DashboardPage;
