import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWebSocket } from '@/lib/ws';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { MessageSquare, Shield, Paperclip, Send, User } from 'lucide-react';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  verified: boolean;
  type: 'sent' | 'received' | 'system';
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  verified: boolean;
  unreadCount: number;
}

export default function Chat() {
  const [message, setMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string>('bob-martinez');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      from: 'bob-martinez',
      to: 'current-user',
      content: 'The Merkle tree root matches perfectly. All 892 STH entries have been verified successfully.',
      timestamp: Date.now() - 180000,
      verified: true,
      type: 'received'
    },
    {
      id: '2',
      from: 'current-user',
      to: 'bob-martinez',
      content: 'Great! I can see the 2-of-3 signatures are valid too. The transparency log is working perfectly.',
      timestamp: Date.now() - 120000,
      verified: true,
      type: 'sent'
    },
    {
      id: '3',
      from: 'system',
      to: 'system',
      content: 'End-to-end encryption verified with fresh keys',
      timestamp: Date.now() - 60000,
      verified: true,
      type: 'system'
    },
    {
      id: '4',
      from: 'bob-martinez',
      to: 'current-user',
      content: 'Here\'s the latest STH data:\n\ntree_size: 892\nroot: eyJ0cmVlX3Npe...\ntimestamp: 1735689247\nsignatures: [2/3 valid]',
      timestamp: Date.now() - 30000,
      verified: true,
      type: 'received'
    }
  ]);

  const conversations: Conversation[] = [
    {
      id: 'alice-chen',
      name: 'Alice Chen',
      avatar: 'A',
      lastMessage: 'Hey, the STH verification is complete...',
      timestamp: '2m',
      verified: true,
      unreadCount: 0
    },
    {
      id: 'bob-martinez',
      name: 'Bob Martinez',
      avatar: 'B',
      lastMessage: 'The Merkle tree root matches perfectly',
      timestamp: '5m',
      verified: true,
      unreadCount: 2
    },
    {
      id: 'security-team',
      name: 'Security Team',
      avatar: 'S',
      lastMessage: 'New cosigner keys have been rotated',
      timestamp: '1h',
      verified: true,
      unreadCount: 0
    }
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: health } = useQuery({
    queryKey: ['/health'],
  });

  const ws = useWebSocket('current-user-session');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      from: 'current-user',
      to: selectedConversation,
      content: message,
      timestamp: Date.now(),
      verified: true,
      type: 'sent'
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Send via WebSocket
    if (ws) {
      ws.send({
        to: selectedConversation,
        payload: btoa(message) // Base64 encode for opaque transport
      });
    }

    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Chat Sidebar */}
        <div className="w-80 bg-card border-r border-border">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search conversations..."
                className="pl-10"
                data-testid="input-search-conversations"
              />
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="overflow-y-auto">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
                  selectedConversation === conversation.id ? 'bg-accent' : ''
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
                data-testid={`conversation-${conversation.id}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {conversation.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground truncate">{conversation.name}</h4>
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      <span className="text-xs text-muted-foreground">E2EE Verified</span>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full ml-auto">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Main */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {selectedConv?.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{selectedConv?.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm text-muted-foreground">E2EE Active • Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" data-testid="button-security-info">
                  <Shield className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" data-testid="button-more-options">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {msg.content}
                    </div>
                  </div>
                );
              }

              if (msg.type === 'sent') {
                return (
                  <div key={msg.id} className="flex items-end justify-end space-x-3">
                    <div className="max-w-[70%] p-3 bg-primary text-primary-foreground rounded-2xl rounded-br-sm">
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div className="flex items-center justify-end mt-2 space-x-2">
                        <span className="text-xs text-primary-foreground/80">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.verified && (
                          <div className="text-primary-foreground/80 text-xs">✓✓</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {selectedConv?.avatar}
                  </div>
                  <div className="max-w-[70%] p-3 bg-card border border-border rounded-2xl rounded-bl-sm">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.verified && (
                        <>
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-xs text-muted-foreground">Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    placeholder="Type a message..."
                    className="w-full p-3 border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] max-h-[120px]"
                    rows={1}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyPress={handleKeyPress}
                    data-testid="textarea-message-input"
                  />
                  <Button variant="ghost" size="sm" className="absolute right-2 bottom-2">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button 
                onClick={handleSendMessage}
                className="p-3 bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>End-to-end encrypted</span>
              </div>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
