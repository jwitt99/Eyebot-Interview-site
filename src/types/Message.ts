export interface Message {
  username: string;
  timestamp: string;
  content: string;
}

export interface MessagesData {
  messages: Message[];
}
