import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Aria.css';

const Aria = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi${user ? ` ${user.username}` : ''}! I'm Aria, your DriveEase assistant. How can I help you today? I can help with bookings, car recommendations, reviews or any questions you have.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/aria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          userContext: user
            ? `User is logged in as ${user.username} with role ${user.role}`
            : 'User is not logged in',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I am having trouble connecting right now. Please try again in a moment.',
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I could not connect to the server. Please check your connection.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([{
      role: 'assistant',
      content: `Hi${user ? ` ${user.username}` : ''}! I'm Aria, your DriveEase assistant. How can I help you today?`,
    }]);
  };

  return (
    <div className="aria-wrapper">

      {/* Chat Window */}
      {isOpen && (
        <div className="aria-window">
          <div className="aria-header">
            <div className="aria-header-info">
              <div className="aria-avatar">A</div>
              <div>
                <h4>Aria</h4>
                <span className="aria-status">DriveEase Assistant</span>
              </div>
            </div>
            <div className="aria-header-actions">
              <button className="aria-action-btn" onClick={handleReset} title="New conversation">
                New
              </button>
              <button className="aria-action-btn" onClick={() => setIsOpen(false)} title="Close">
                X
              </button>
            </div>
          </div>

          <div className="aria-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`aria-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="aria-msg-avatar">A</div>
                )}
                <div className="aria-msg-bubble">
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="aria-message assistant">
                <div className="aria-msg-avatar">A</div>
                <div className="aria-msg-bubble aria-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="aria-input-area">
            <textarea
              className="aria-input"
              placeholder="Ask Aria anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows="1"
              disabled={loading}
            />
            <button
              className="aria-send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`aria-float-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Chat with Aria"
      >
        {isOpen ? 'X' : 'Chat'}
      </button>

    </div>
  );
};

export default Aria;