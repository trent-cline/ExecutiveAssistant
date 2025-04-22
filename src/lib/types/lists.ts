export interface ListItem {
  id: string;
  created_at: string;
  name: string;
  summary?: string;
  description?: string;
  status: string;
  priority: string;
  checked?: boolean;
  original_note_id?: string;
  user_id: string;
  [key: string]: any; // For additional properties specific to list types
}
