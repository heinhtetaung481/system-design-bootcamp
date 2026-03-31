export interface AllowedUser {
  id: string;
  email: string | null;
  github_username: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  selected_model: string;
  openrouter_api_key: string | null;
  created_at: string;
  updated_at: string;
}
