import React from 'react';
import YouTubeAccountListItem from './YouTubeAccountListItem';

const YouTubeAccountList = () => {
  const mockAccounts = [
    { id: '1', name: 'Tech Tutorials' },
    { id: '2', name: 'Gaming Channel' },
    { id: '3', name: 'Cooking Show' },
  ];

  return (
    <div className="space-y-4">
      {mockAccounts.map((account) => (
        <YouTubeAccountListItem key={account.id} account={account} />
      ))}
    </div>
  );
};

export default YouTubeAccountList;
