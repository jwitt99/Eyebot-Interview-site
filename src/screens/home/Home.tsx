import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Box, Typography, Snackbar, Alert } from '@mui/material';
import Feed from './components/Feed';
import MessageWriter from './components/MessageWriter';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setMessages,
  setActiveUsersCount,
  setLoading,
  setError,
} from '../../store/chatSlice';

export default function Home() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { messages, activeUsersCount, loading, error } = useAppSelector(
    (state) => state.chat
  );
  const [showWelcome, setShowWelcome] = useState(false);

  const connectToMessagesStream = () => {
    const eventSource = new EventSource('http://localhost:3001/api/messages/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(setMessages(data.messages));
      dispatch(setError(null));
      dispatch(setLoading(false));
    };
    
    eventSource.onerror = (error) => {
      console.error('Messages SSE connection error:', error);
      dispatch(setError('Failed to connect to message stream'));
      eventSource.close();
    };
    
    return eventSource;
  };

  const connectToActiveUsersStream = () => {
    const eventSource = new EventSource('http://localhost:3001/api/users/active/stream');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(setActiveUsersCount(data.activeUsersCount));
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };
    
    return eventSource;
  };

  const postMessage = async (content: string) => {
    try {
      const username = localStorage.getItem('username') || 'Anonymous';
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          content,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post message');
      }

      // Messages will update automatically via SSE
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to post message'));
    }
  };

  const login = async () => {
    try {
      const username = localStorage.getItem('username');
      if (!username) return;

      await fetch('http://localhost:3001/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
    } catch (err) {
      console.error('Failed to login:', err);
    }
  };

  const logout = async () => {
    try {
      const username = localStorage.getItem('username');
      if (!username) return;

      await fetch('http://localhost:3001/api/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  useEffect(() => {
    // Set user status to online when page loads
    login();
    
    // Connect to SSE for real-time updates
    const messagesEventSource = connectToMessagesStream();
    const activeUsersEventSource = connectToActiveUsersStream();
    
    if (location.state?.fromLogin) {
      const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
      if (!hasShownWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('hasShownWelcome', 'true');
      }
    }
    
    // Cleanup function: When the component unmounts (user navigates away or component is removed), close SSE connections and log user out 
    return () => {
      messagesEventSource.close();
      activeUsersEventSource.close();
      logout();
    };
  }, []);

  if (loading) {
    return (
      <Container>
        <Typography>Loading messages...</Typography>
      </Container>
    );
  }

  return (
    <Container
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingY: 2,
        backgroundColor: '#F5F5DC',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <Typography variant="h4" component="h1" color="primary">
          Chat
        </Typography>
        <Typography variant="body2" color="green">
          {activeUsersCount} active {activeUsersCount === 1 ? 'user' : 'users'}
        </Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ marginBottom: 2 }}>
          {error}
        </Typography>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, overflow: 'auto', marginBottom: 2 }}>
          <Feed messages={messages} />
        </Box>

        <MessageWriter postMessage={postMessage} />
      </Box>

      <Snackbar
        open={showWelcome}
        autoHideDuration={4000}
        onClose={() => setShowWelcome(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowWelcome(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          Welcome, {localStorage.getItem('username')}! You've successfully joined the chat.
        </Alert>
      </Snackbar>
    </Container>
  );
}
