export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow';
  meme_id: string;
  from_user_id: string | {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
  is_read: boolean;
  date_created: string;
  message: string;
}
