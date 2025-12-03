import { useState, useRef, useEffect } from 'react';

const ChatWidget = ({ businessId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !businessId) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    try {
      const response = await fetch(`/api/public/chat/${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Error');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка отправки сообщения.' }]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!businessId) {
    return <div>Business ID required (?businessId=123)</div>;
  }

  return (
    <div style={{ 
      height: '400px', 
      width: '300px', 
      border: '1px solid #ccc', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '10px',
        backgroundColor: '#f9f9f9'
      }}>
        {messages.map((msg, i) => (
          <div 
            key={i} 
            style={{ 
              marginBottom: '10px', 
              textAlign: msg.role === 'user' ? 'right' : 'left' 
            }}
          >
            <span style={{
              background: msg.role === 'user' ? '#007bff' : '#e9ecef',
              color: msg.role === 'user' ? 'white' : 'black',
              padding: '8px 12px',
              borderRadius: '18px',
              maxWidth: '80%',
              display: 'inline-block',
              wordWrap: 'break-word'
            }}>
              {msg.content}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ 
        padding: '10px', 
        borderTop: '1px solid #ccc', 
        display: 'flex',
        backgroundColor: 'white'
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ 
            flex: 1, 
            border: '1px solid #ddd', 
            borderRadius: '20px', 
            padding: '8px 12px', 
            outline: 'none',
            marginRight: '10px'
          }}
          placeholder="Введите сообщение..."
        />
        <button 
          onClick={sendMessage} 
          style={{ 
            padding: '8px 16px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '20px', 
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          disabled={!input.trim()}
        >
          Отправить
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;