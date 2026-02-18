import { Box, Typography } from '@mui/material';
import type { Message as MessageType } from '../../../types/Message';

interface MessageProps {
  message: MessageType;
  index: number;
}

export default function Message({ message, index }: MessageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        padding: 1.5,
        borderRadius: 1,
        backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F0F0F0',
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
      <Typography component="span" sx={{ flex: 1, color: '#000000' }}>
        {message.content}
      </Typography>
    </Box>
  );
}
