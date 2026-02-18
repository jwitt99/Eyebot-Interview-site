import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

const USERS_FILE = path.join(__dirname, '../database/users.json');
const MESSAGES_FILE = path.join(__dirname, '../database/messages.json');

// Store SSE clients
const activeUserClients = [];
const messageClients = [];

// Write queues to prevent race conditions
let usersWriteQueue = Promise.resolve();
let messagesWriteQueue = Promise.resolve();

// Broadcast active user count to all connected clients
const broadcastActiveUserCount = async () => {
  try {
    const data = await readUsersData();
    const activeUsers = data.users.filter(user => user.status === 'online');
    const count = activeUsers.length;
    
    activeUserClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify({ activeUsersCount: count })}\n\n`);
    });
  } catch (error) {
    console.error('Error broadcasting active user count:', error);
  }
};

// Broadcast messages to all connected clients
const broadcastMessages = async () => {
  try {
    const data = await readMessagesData();
    const sortedMessages = data.messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    messageClients.forEach(client => {
      client.res.write(`data: ${JSON.stringify({ messages: sortedMessages })}\n\n`);
    });
  } catch (error) {
    console.error('Error broadcasting messages:', error);
  }
};

// Watch users file for changes and broadcast updates
fsSync.watch(USERS_FILE, (eventType, filename) => {
  broadcastActiveUserCount();
});

fsSync.watch(MESSAGES_FILE, (eventType, filename) => {
  broadcastMessages();
});

const readUsersData = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    throw error;
  }
};

const writeUsersData = async (data) => {
  // Queue the write operation to prevent race conditions
  usersWriteQueue = usersWriteQueue.then(async () => {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing users file:', error);
      throw error;
    }
  });
  return usersWriteQueue;
};

const readMessagesData = async () => {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading messages file:', error);
    throw error;
  }
};

const writeMessagesData = async (data) => {
  // Queue the write operation to prevent race conditions
  messagesWriteQueue = messagesWriteQueue.then(async () => {
    try {
      await fs.writeFile(MESSAGES_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing messages file:', error);
      throw error;
    }
  });
  return messagesWriteQueue;
};

const findUser = async (username) => {
  try {
    const data = await readUsersData();
    return data.users.find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return null;
  }
};

app.get('/api/users/active', async (req, res) => {
  try {
    const data = await readUsersData();
    const activeUsers = data.users.filter(user => user.status === 'online');
    res.json({ users: activeUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

app.get('/api/users/active/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const username = req.query.username; // Get username from query params
  const client = { id: clientId, res, username };
  activeUserClients.push(client);

  console.log(`Client ${clientId} connected for user: ${username}`);

  // Send initial active user count
  readUsersData().then(data => {
    const activeUsers = data.users.filter(user => user.status === 'online');
    res.write(`data: ${JSON.stringify({ activeUsersCount: activeUsers.length })}\n\n`);
  });

  req.on('close', async () => {
    const index = activeUserClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      activeUserClients.splice(index, 1);
    }
    console.log(`Client ${clientId} disconnected from active users SSE`);
    
    // Mark user as offline when SSE connection closes
    if (username) {
      try {
        const data = await readUsersData();
        const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user && user.status === 'online') {
          console.log(`Marking user ${username} as offline due to SSE disconnect`);
          user.status = 'offline';
          await writeUsersData(data);
        }
      } catch (error) {
        console.error('Error marking user offline on disconnect:', error);
      }
    }
  });
});

app.get('/api/messages/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  messageClients.push(client);

  // Send initial messages
  readMessagesData().then(data => {
    const sortedMessages = data.messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    res.write(`data: ${JSON.stringify({ messages: sortedMessages })}\n\n`);
  });

  req.on('close', () => {
    const index = messageClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      messageClients.splice(index, 1);
    }
    console.log(`Client ${clientId} disconnected from messages SSE`);
  });
});

app.get('/api/users/usernames', async (req, res) => {
  try {
    const data = await readUsersData();
    const usernames = data.users.map(user => user.username);
    res.json({ usernames });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch usernames' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const data = await readUsersData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, browser, status } = req.body;

    if (!username || !browser) {
      return res.status(400).json({ 
        error: 'Username and browser are required' 
      });
    }

    const existingUser = await findUser(username);

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

    const data = await readUsersData();

    const newUser = {
      id: data.users.length > 0 
        ? Math.max(...data.users.map(u => u.id)) + 1 
        : 1,
      username,
      browser,
      status: status || 'offline'
    };

    data.users.push(newUser);
    await writeUsersData(data);

    // Broadcast will happen automatically via fs.watch

    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username } = req.body;
    const data = await readUsersData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user) {
      user.status = 'online';
      await writeUsersData(data);
    }
    
    res.status(200).json({ message: 'User logged in', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/users/logout', async (req, res) => {
  try {
    console.log('Logout request received:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    
    let username;
    
    // Handle both JSON object and text/plain string from sendBeacon
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        username = parsed.username;
      } catch (e) {
        console.log('Failed to parse body as JSON:', e);
        username = req.body;
      }
    } else if (typeof req.body === 'object' && req.body !== null) {
      username = req.body.username;
    }
    
    if (!username) {
      console.log('No username provided in logout request');
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const data = await readUsersData();
    const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (user) {
      console.log(`Logging out user: ${username}`);
      user.status = 'offline';
      await writeUsersData(data);
    } else {
      console.log(`User not found: ${username}`);
    }
    
    res.status(200).json({ message: 'User logged out', user });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const data = await readMessagesData();
    
    // Sort messages by timestamp in ascending order (oldest first)
    const sortedMessages = data.messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
    
    res.json({ messages: sortedMessages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});


app.post('/api/messages', async (req, res) => {
  try {
    const { username, content, timestamp } = req.body;

    if (!username || !content) {
      return res.status(400).json({ 
        error: 'Username and content are required' 
      });
    }

    const data = await readMessagesData();

    const newMessage = {
      username,
      content,
      timestamp: timestamp || new Date().toISOString()
    };

    data.messages.push(newMessage);
    await writeMessagesData(data);

    res.status(201).json({ 
      message: 'Message posted successfully', 
      data: newMessage 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to post message' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
