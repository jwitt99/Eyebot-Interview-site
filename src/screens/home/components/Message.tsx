import { Box, Typography } from '@mui/material';
import type { Message as MessageType } from '../../../types/Message';

interface MessageProps {
  message: MessageType;
}

export default function Message({ message }: MessageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        padding: 1.5,
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
    >
      <Typography
        component="span"
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          minWidth: 'fit-content',
        }}
      >
        {message.username}:
      </Typography>
      <Typography component="span" sx={{ flex: 1 }}>
        {message.content}
      </Typography>
    </Box>
  );
}
