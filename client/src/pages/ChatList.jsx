import React, { useEffect, useState } from 'react';
import { fetchConversations, initSocket } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations().then(setConversations);

    const socket = initSocket();

    socket?.on('new_message', (msg) => {
      console.log('New message received:', msg);
      fetchConversations().then(setConversations);
    });

    socket?.on('status_update', ({ id, status }) => {
      console.log('Message status updated:', id, status);
    });

    return () => {
      socket?.off('new_message');
      socket?.off('status_update');
    };
  }, []);

  return (
    <div className="chat-list">
      {conversations.length === 0 && <p>No conversations found</p>}
      {conversations.map((conv) => (
        <div
          key={conv.wa_id}
          className="chat-item"
          onClick={() => navigate(`/chat/${conv.wa_id}`)}
        >
          <div className="chat-name">{conv.name || conv.wa_id}</div>
          <div className="chat-last">{conv.lastMessage || 'No messages yet'}</div>
        </div>
      ))}
    </div>
  );
}
