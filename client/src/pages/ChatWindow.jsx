import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { sendMessage } from '../services/api';

export default function ChatWindow({ initialMessages = [] }) {
  const { wa_id: currentChatWaId } = useParams();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState('');

  async function handleSend() {
    if (!text.trim()) return;

    const payload = {
      wa_id: currentChatWaId,
      to: currentChatWaId,
      from: 'me',
      text,
      direction: 'out',
      status: 'sent',
      timestamp: new Date().toISOString(),
    };

    try {
      const saved = await sendMessage(payload);
      setMessages(prev => [...prev, saved]);
      setText('');
    } catch (err) {
      console.error('Send message failed', err);
    }
  }

  return (
    <div className="chat-window">
      <div className="messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`bubble ${msg.direction === 'out' ? 'outgoing' : 'incoming'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="send-box">
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
