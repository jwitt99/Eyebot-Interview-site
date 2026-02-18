import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

interface MessageWriterProps {
  postMessage: (content: string) => void;
}

export default function MessageWriter({ postMessage }: MessageWriterProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      postMessage(message);
      setMessage('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'flex',
        gap: 2,
        padding: 2,
      }}
    >
      <TextField
        fullWidth
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        variant="outlined"
        size="small"
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!message.trim()}
      >
        Send
      </Button>
    </Box>
  );
}
