import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Snackbar, Alert, Button } from '@mui/material';
import Feed from './components/Feed';
import MessageWriter from './components/MessageWriter';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setMessages,
  setActiveUsersCount,
  setLoading,
  setError,
} from '../../store/chatSlice';

const API_BASE_URL = 'http://localhost:3001/api';

export default function Home() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { messages, activeUsersCount, loading, error } = useAppSelector(
    (state) => state.chat
  );
  const [showWelcome, setShowWelcome] = useState(false);

  const connectToMessagesStream = () => {
    const eventSource = new EventSource(`${API_BASE_URL}/messages/stream`);
    
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
    const username = localStorage.getItem('username');
    const eventSource = new EventSource(`${API_BASE_URL}/users/active/stream?username=${encodeURIComponent(username || '')}`);
    
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
      const response = await fetch(`${API_BASE_URL}/messages`, {
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
      await fetch(`${API_BASE_URL}/users/login`, {
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

      await fetch(`${API_BASE_URL}/users/logout`, {
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

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('username');
    navigate('/login');
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
    
    // Cleanup function: When the component unmounts or user closes tab, close SSE connections
    // The server will automatically mark user as offline when SSE connection closes
    return () => {
      messagesEventSource.close();
      activeUsersEventSource.close();
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="green">
            {activeUsersCount} active {activeUsersCount === 1 ? 'user' : 'users'}
          </Typography>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
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
        autoHideDuration={3000}
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
