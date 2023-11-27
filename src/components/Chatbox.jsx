import { useRef, useEffect, useState } from 'react'
import axios from 'axios';

function Chatbox({ channel_name, setOpenChats, openChats }) {
  const chatBodyRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [chatArray, setChatArray] = useState([
    // {
    //   message: 'Hi this is a message from user',
    //   from: 'user'
    // },
    // {
    //   message: 'Hi this is a message from operator',
    //   from: 'operator'
    // },
    // {
    //   message: 'Error message!',
    //   from: 'error'
    // },
    // {
    //   message: 'Notify message!',
    //   from: 'notify'
    // }
  ]);

  function addMessage(message, from) {
    const newMessage = {
      message,
      from,
      time: new Date().toLocaleTimeString(),
    };

    setChatArray((prevChatArray) => [...prevChatArray, newMessage]);
  }


  const openChat = () => {
    setIsOpen(true);
  }

  const handleImageUpload = async (e) => {
    const image = e.target.files[0];

    if (image) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataURL = e.target.result;
        addMessage(imageDataURL, 'image');
      };
      reader.readAsDataURL(image);
    } else {
      console.log('Could not upload the image', e);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputMessage) {
      return;
    }

    addMessage(inputMessage, 'operator');

    const url = 'http://localhost:8000/admin/memo/operatorMessage';
    const headers = {
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYWRtaW4vbG9naW4iLCJpYXQiOjE3MDA1NTY5NTYsIm5iZiI6MTcwMDU1Njk1NiwianRpIjoiR21QRmF2VFh4R3hGR09UWCIsInN1YiI6IjY1MGQ2MGNjZTUwZmE2OTMyZTBkZmY1NyIsInBydiI6IjJlODEwYWUzNDlhNGE2MTk1ODIyYWIzMzE2ZWJmY2FlNDg5Njc0YzUifQ.iG-wb_lp9Pm1a4t1qGD7Kp8z2iGG1fa282LYhvpmkd0',
      'content-type': 'application/json',
      'tenant_sub_domain': 'gamatron'
    };

    const data = {
      channelName: channel_name,
      message: inputMessage
    };

    try {
      const response = await axios.post(url, data, { headers });
      console.log(response);
    } catch (error) {
      console.error('Failed to send message:', error.message);
    }

    setInputMessage("");

  };

  const handleTransferChat = (channel_name) => {
    const url = 'http://localhost:8000/admin/memo/transferChatToQueue';
    const headers = {
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYWRtaW4vbG9naW4iLCJpYXQiOjE3MDA1NTY5NTYsIm5iZiI6MTcwMDU1Njk1NiwianRpIjoiR21QRmF2VFh4R3hGR09UWCIsInN1YiI6IjY1MGQ2MGNjZTUwZmE2OTMyZTBkZmY1NyIsInBydiI6IjJlODEwYWUzNDlhNGE2MTk1ODIyYWIzMzE2ZWJmY2FlNDg5Njc0YzUifQ.iG-wb_lp9Pm1a4t1qGD7Kp8z2iGG1fa282LYhvpmkd0',
      'content-type': 'application/json',
      'tenant_sub_domain': 'gamatron'
    };
    const data = {
      channelName: `${channel_name}`,
    };

    axios.post(url, data, { headers })
      .then(response => {
        console.log('Transfer chat request sent successfully');
        // Handle the response if needed
        // remove the channel from openChats
        setOpenChats(openChats.filter(chat => chat !== data.channelName));
      })
      .catch(error => {
        console.error('Failed to send transfer chat request:', error.message);
        // Handle the error if needed
      });
  }

  const closeChat = (channel_name) => {

    console.log('Closing the chat with channel name = ', channel_name);

    const url = 'http://localhost:8000/admin/memo/closeChat';
    const headers = {
      'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvYWRtaW4vbG9naW4iLCJpYXQiOjE3MDA1NTY5NTYsIm5iZiI6MTcwMDU1Njk1NiwianRpIjoiR21QRmF2VFh4R3hGR09UWCIsInN1YiI6IjY1MGQ2MGNjZTUwZmE2OTMyZTBkZmY1NyIsInBydiI6IjJlODEwYWUzNDlhNGE2MTk1ODIyYWIzMzE2ZWJmY2FlNDg5Njc0YzUifQ.iG-wb_lp9Pm1a4t1qGD7Kp8z2iGG1fa282LYhvpmkd0',
      'content-type': 'application/json',
      'tenant_sub_domain': 'gamatron'
    };
    const data = {
      channelName: `${channel_name}`,
    };

    axios.post(url, data, { headers })
      .then(response => {
        console.log('Chat closed successfully:', response.data);
        setIsOpen(false);
        setOpenChats(openChats.filter(chat => chat !== data.channelName));
      })
      .catch(error => {
        console.error('Failed to send close chat request:', error.message);
        // Handle the error if needed
      });
  }

  // using pusher js to listen to public New Message event
  useEffect(() => {
    if (channel_name) {

      // pusher client
      const client = new Pusher("app-key", {
        wsHost: "127.0.0.1",
        wsPort: 6001,
        wssPort: 6001,
        cluster: "mt1",
        forceTLS: false,
        encrypted: true,
        enableStats: false,
        enabledTransports: ["ws", "wss"],
      });

      let channel = client.subscribe(`${channel_name}`);

      channel.bind("pusher:subscription_succeeded", () => {
        console.log("Pusher: subscription_succeeded", channel);
        setSocketConnected(true);
      });

      channel.bind("pusher:subscription_error", (e) => {
        console.error("Pusher: subscription_error", e);
      });

      channel.bind("NewMessage", (data) => {
        console.log('Event Triggered = ', data);
        // addMessage(data.message, data.from);
      });

      // Clean up the subscription when the component unmounts
      return () => {
        channel.unsubscribe(channel_name);
      };
    }

  }, [channel_name]);

  useEffect(() => {
    // Scroll to the bottom of the chat body
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }

  }, [chatArray]);

  if (isOpen) {
    return (
      <div className='fixed flex flex-col bottom-0 left-4 h-[80vh] w-[35vw] border-x-4 border-t-4 border-gray-900'>
        {/* chatbot head */}
        <div className='flex flex-row justify-between h-[5vh] items-center p-2 border-b-2 border-gray-700'>
          <div className='flex flex-row gap-2'>
            <div></div>
            <button className='font-bold cursor-pointer' onClick={() => { handleTransferChat(channel_name) }}>Transfer Chat</button>
          </div>
          <div className='flex flex-row gap-2'>
            <div className='text-gray-800 font-semibold hover:cursor-pointer' onClick={() => setIsOpen(false)} >Min</div>
            <div className='text-gray-800 font-semibold hover:cursor-pointer' onClick={() => closeChat(channel_name)}>Close</div>
          </div>
        </div>
        {/* chatbot head end */}
        {/* chatbot body */}
        <div className='h-full max-h-[100%] p-4 overflow-y-scroll' ref={chatBodyRef}>
          {chatArray?.map((chat, index) => {
            switch (chat.from) {
              case 'notify':
                return (
                  <div className='float-none bg-gray-900 text-white border-2 border-gray-900 rounded-lg p-4 clear-both my-2 shadow-md shadow-gray-300/30' key={index}>
                    <p>{chat.message}</p>
                  </div>
                )

              case "user":
                return (
                  <div className='float-left border-2 border-gray-700 rounded-lg p-4 clear-both my-2 shadow-md shadow-gray-600/30 bg-gray-700 text-white' key={index}>
                    <p>{chat.message}</p>
                  </div>
                );

              case "operator":
                return (
                  <div className='float-right border-2 border-gray-700 rounded-lg p-4 clear-both my-2 shadow-md shadow-gray-600/30' key={index}>
                    <p>{chat.message}</p>
                  </div>
                );

              case "error":
                return (
                  <div className='float-none border-2 border-red-600 rounded-lg p-4 clear-both my-2 shadow-md shadow-red-300/30' key={index}>
                    <p>{chat.message}</p>
                  </div>
                );

              case "image":
                return (
                  <div className='float-left clear-both max-w-[80%]' key={index}>
                    <img src={chat.message} alt='chat-image' className=' w-full' />
                  </div>
                )

              default:
                return null;
            }
          })}
        </div>
        {/* chatbot body end */}
        <div>
          <form className='flex flex-row w-full border-t-2 border-gray-900' onSubmit={(e) => handleSubmit(e)}>
            <input className='w-[80%] p-2' type="text" placeholder='Enter message' value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} />
            <label className='relative cursor-pointer flex items-center'>
              <input type="file" className='hidden' accept="image/*" onChange={(e) => handleImageUpload(e)} />
              <div className='text-gray-600 border-l-2 border-gray-900 h-full p-2'>
                <svg width="20px" height="20px" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 1H12.5C13.3284 1 14 1.67157 14 2.5V12.5C14 13.3284 13.3284 14 12.5 14H2.5C1.67157 14 1 13.3284 1 12.5V2.5C1 1.67157 1.67157 1 2.5 1ZM2.5 2C2.22386 2 2 2.22386 2 2.5V8.3636L3.6818 6.6818C3.76809 6.59551 3.88572 6.54797 4.00774 6.55007C4.12975 6.55216 4.24568 6.60372 4.32895 6.69293L7.87355 10.4901L10.6818 7.6818C10.8575 7.50607 11.1425 7.50607 11.3182 7.6818L13 9.3636V2.5C13 2.22386 12.7761 2 12.5 2H2.5ZM2 12.5V9.6364L3.98887 7.64753L7.5311 11.4421L8.94113 13H2.5C2.22386 13 2 12.7761 2 12.5ZM12.5 13H10.155L8.48336 11.153L11 8.6364L13 10.6364V12.5C13 12.7761 12.7761 13 12.5 13ZM6.64922 5.5C6.64922 5.03013 7.03013 4.64922 7.5 4.64922C7.96987 4.64922 8.35078 5.03013 8.35078 5.5C8.35078 5.96987 7.96987 6.35078 7.5 6.35078C7.03013 6.35078 6.64922 5.96987 6.64922 5.5ZM7.5 3.74922C6.53307 3.74922 5.74922 4.53307 5.74922 5.5C5.74922 6.46693 6.53307 7.25078 7.5 7.25078C8.46693 7.25078 9.25078 6.46693 9.25078 5.5C9.25078 4.53307 8.46693 3.74922 7.5 3.74922Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              </div>
            </label>
            <button className='w-[20%] p-2 border-l-2 border-gray-900' onClick={(e) => handleSubmit(e)}>Send</button>
          </form>
        </div>
      </div>
    )
  } else {
    return (
      <div className='fixed flex flex-col bottom-0 left-4 h-[5vh] w-[400px] border-x-4 border-t-4 border-gray-900'>
        <div className='flex flex-row justify-between h-[5vh] items-center p-2'>
          <div className='flex flex-row gap-2'>
            <div></div>
            <div className='flex flex-row'>Channel:
              <p className='text-sm font-light items-center justify-center'>{channel_name.substring(0, 10)}</p>
            </div>
          </div>
          <div className='flex flex-row gap-2'>
            <div className='text-gray-800 font-semibold hover:cursor-pointer' onClick={(e) => openChat(e)} >Max</div>
            <div className='text-gray-800 font-semibold hover:cursor-pointer' onClick={closeChat}>Close</div>
          </div>
        </div>
      </div>
    )
  }
}

export default Chatbox