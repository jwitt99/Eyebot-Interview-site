import { Box } from '@mui/material';
import type { Message as MessageType } from '../../../types/Message';
import Message from './Message';

interface FeedProps {
  messages: MessageType[];
}

export default function Feed({ messages }: FeedProps) {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
      }}
    >
      {messages.map((message, index) => (
        <Message key={`${message.username}-${message.timestamp}-${index}`} message={message} index={index} />
      ))}
    </Box>
  );
}
