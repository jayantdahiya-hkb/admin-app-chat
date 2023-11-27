import { useEffect, useState } from 'react';
import './App.css';
import Pusher from 'pusher-js';
import Chatbox from './components/Chatbox';
import axios from 'axios';

function App() {
  const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYWRtaW4vbG9naW4iLCJpYXQiOjE3MDA1NTY5NTYsIm5iZiI6MTcwMDU1Njk1NiwianRpIjoiR21QRmF2VFh4R3hGR09UWCIsInN1YiI6IjY1MGQ2MGNjZTUwZmE2OTMyZTBkZmY1NyIsInBydiI6IjJlODEwYWUzNDlhNGE2MTk1ODIyYWIzMzE2ZWJmY2FlNDg5Njc0YzUifQ.iG-wb_lp9Pm1a4t1qGD7Kp8z2iGG1fa282LYhvpmkd0';

  const operatorId = '650d60cce50fa6932e0dff57';

  const [activeChats, setActiveChats] = useState([]);
  const [openChats, setOpenChats] = useState([]);



  const getActiveChats = async () => {
    const url = 'http://localhost:8000/admin/memo/getActiveChats';

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'tenant_sub_domain': 'gamatron',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Active Chats:', data.activeChats);
      setActiveChats(data.activeChats);
    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  // Function to check the activeChats array if the operator_id locked chat already exists
  const checkActiveChats = () => {
    activeChats.forEach((chat) => {
      if (chat.operator_id === operatorId) {
        if (!openChats.includes(chat.channel_name)) {
          setOpenChats((prevOpenChats) => [...prevOpenChats, chat.channel_name]);
        }
      }
    });
  };

  useEffect(() => {
    getActiveChats();
    console.log('Current Active Chats =', activeChats);
  }, []);

  useEffect(() => {
    checkActiveChats();
    console.log('Open chats array = ', openChats);
  }, [activeChats]);



  const handleChatClick = async (channel_name) => {
    const url = 'http://localhost:8000/admin/memo/setOperatorChat';

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'tenant_sub_domain': 'gamatron',
    };

    const data = {
      channelName: channel_name,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Selected a chat by operator. Chat response:', responseData);

      if (!openChats.includes(channel_name)) {
        // update openChats
        setOpenChats([...openChats, channel_name]);
        //remove from activeChats
        setActiveChats(activeChats.filter(chat => chat.channel_name !== channel_name));
      }

    } catch (error) {
      console.error('Error:', error.message);
    }
  };


  // listener for Active Chat Event
  useEffect(() => {

    // pusher client
    const client = new Pusher('app-key', {
      wsHost: '127.0.0.1',
      wsPort: 6001,
      wssPort: 6001,
      cluster: 'mt1',
      forceTLS: false,
      encrypted: true,
      enableStats: false,
      enabledTransports: ['ws', 'wss'],
    });

    let channel = client.subscribe('active-chats');
    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Subscription succeeded');
    });

    channel.bind('ChatActive', (data) => {
      console.log('Data received:', data);
      setActiveChats(data);
    });

    // Clean up the subscription when the component unmounts
    return () => {
      client.unsubscribe('active-chats');
    };
  }, [activeChats]);

  function getTimeSinceLastActive(updatedAt) {
    const currentTime = new Date();
    const lastActiveTime = new Date(updatedAt);
    const timeDifference = currentTime - lastActiveTime;
    const seconds = Math.floor(timeDifference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} days ago`;
    } else if (hours > 0) {
      return `${hours} hours ago`;
    } else if (minutes > 0) {
      return `${minutes} minutes ago`;
    } else {
      return `${seconds} seconds ago`;
    }
  }

  return (
    <>
      <div className='min-h-screen w-screen'>
        <div className='absolute right-2 top-0 border-2 border-gray-800 h-screen min-w-[500px] p-4'>
          <div className='text-2xl underline'>Active Chats</div>
          <div className='border-2 border-gray-600 p-2 h-[90%] mt-4 mx-1 overflow-y-scroll'>
            <ul className='flex flex-col'>
              {activeChats.length > 0 &&
                activeChats.map((chat, index) => (
                  chat.locked === 'false' && (
                    <li key={index}>
                      <a
                        className='flex flex-col border-2 border-slate-600 mt-3 mb-3 p-4'
                      >
                        <p>Chat Name: {chat.channel_name}</p>
                        <p className="text-sm font-light">Active since: {getTimeSinceLastActive(chat.updated_at)}</p>
                        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2' onClick={() => handleChatClick(chat.channel_name)}>Open</button>
                      </a>
                    </li>
                  )
                ))
              }
            </ul>
          </div>
        </div>

        {/* Chatbox that comes up when admin clicks on an active chat */}
        <div className='flex flex-col gap-y-4 h-screen'>
          {openChats.length > 0 && openChats.map((chat, index) => (
            <Chatbox key={index} channel_name={chat} openChats={openChats} setOpenChats={setOpenChats} />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
