import React from 'react';

const MessageBubble = ({ message }) => {
  return (
    <div className={`message-bubble ${message.direction}`}>
      <p>{message.text}</p>
      <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
    </div>
  );
};

export default MessageBubble;
