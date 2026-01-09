export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  role?: string | {
    id: string;
    name: string;
    admin_access?: boolean;
  };
  date_created: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}
