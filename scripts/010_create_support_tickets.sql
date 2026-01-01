-- scripts/010_create_support_tickets.sql
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'technical',
  plan TEXT DEFAULT 'free-trial',
  status TEXT DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'normal',
  response_time_hours INTEGER DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can see their own tickets
CREATE POLICY "Users can view own tickets" 
  ON support_tickets FOR SELECT 
  USING (user_id = auth.uid());

-- Users can insert their own tickets
CREATE POLICY "Users can create tickets" 
  ON support_tickets FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tickets (for adding follow-ups)
CREATE POLICY "Users can update own tickets" 
  ON support_tickets FOR UPDATE 
  USING (user_id = auth.uid());