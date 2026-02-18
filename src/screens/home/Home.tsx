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

  const getMessages = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      dispatch(setMessages(data.messages));
      dispatch(setError(null));
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'An error occurred'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getActiveUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/active');
      if (!response.ok) {
        throw new Error('Failed to fetch active users');
      }
      const data = await response.json();
      dispatch(setActiveUsersCount(data.users.length));
    } catch (err) {
      console.error('Failed to fetch active users:', err);
    }
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

      await getMessages();
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to post message'));
    }
  };

  useEffect(() => {
    getMessages();
    getActiveUsers();
    const messagesInterval = setInterval(getMessages, 3000);
    const usersInterval = setInterval(getActiveUsers, 5000);
    
    if (location.state?.fromLogin) {
      const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
      if (!hasShownWelcome) {
        setShowWelcome(true);
        sessionStorage.setItem('hasShownWelcome', 'true');
      }
    }
    
    return () => {
      clearInterval(messagesInterval);
      clearInterval(usersInterval);
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
      maxWidth="md"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingY: 2,
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
        <Typography variant="h4" component="h1">
          Chat
        </Typography>
        <Typography variant="body2" color="text.secondary">
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
