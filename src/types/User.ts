export type UserStatus = 'online' | 'offline';

export interface User {
  id: number;
  username: string;
  browser: string;
  status: UserStatus;
}

export interface UsersData {
  users: User[];
}
