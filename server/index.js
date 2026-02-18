import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const USERS_FILE = path.join(__dirname, '../database/users.json');
const MESSAGES_FILE = path.join(__dirname, '../database/messages.json');


// ideally would use websocket to track changes and update accordingly
fs.watch(USERS_FILE, (eventType, filename) => {
  console.log("\nUsers file modified:", eventType);
});

fs.watch(MESSAGES_FILE, (eventType, filename) => {
  console.log("\nMessages file modified:", eventType);
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
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users file:', error);
    throw error;
  }
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

app.get('/api/users/active', async (req, res) => {
  try {
    const data = await readUsersData();
    const activeUsers = data.users.filter(user => user.status === 'online');
    res.json({ users: activeUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
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

    const data = await readUsersData();

    const existingUser = data.users.find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

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

    res.status(201).json({ 
      message: 'User created successfully', 
      user: newUser 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
