import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Message } from '../types/Message';

interface ChatState {
  messages: Message[];
  activeUsersCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  activeUsersCount: 0,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setActiveUsersCount: (state, action: PayloadAction<number>) => {
      state.activeUsersCount = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setActiveUsersCount,
  setLoading,
  setError,
} = chatSlice.actions;

export default chatSlice.reducer;
