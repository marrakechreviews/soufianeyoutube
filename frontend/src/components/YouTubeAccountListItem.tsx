import React from 'react';

interface Account {
  id: string;
  name: string;
}

interface YouTubeAccountListItemProps {
  account: Account;
}

const YouTubeAccountListItem: React.FC<YouTubeAccountListItemProps> = ({ account }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
      <span className="font-medium">{account.name}</span>
      <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
        Disconnect
      </button>
    </div>
  );
};

export default YouTubeAccountListItem;
