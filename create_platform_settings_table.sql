-- Drop table if exists to ensure clean slate and correct schema
DROP TABLE IF EXISTS public.platform_settings;

-- Create platform_settings table
CREATE TABLE public.platform_settings (
    id BIGINT PRIMARY KEY DEFAULT 1, -- Singleton pattern, always use ID 1
    site_name TEXT DEFAULT 'Garagem de Micro SaaS',
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_allowed_users UUID[] DEFAULT '{}', -- Array of user UUIDs
    allow_signups BOOLEAN DEFAULT true,
    global_announcement TEXT DEFAULT '',
    enable_showroom BOOLEAN DEFAULT true,
    enable_roadmap BOOLEAN DEFAULT true,
    enable_nps BOOLEAN DEFAULT true,
    primary_color TEXT DEFAULT '#000000',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1) -- Ensure only one row exists
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read settings (needed for maintenance check)
CREATE POLICY "Everyone can read platform settings" 
ON public.platform_settings FOR SELECT 
USING (true);

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update platform settings" 
ON public.platform_settings FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Policy: Only admins can insert (for the initial row)
CREATE POLICY "Admins can insert platform settings" 
ON public.platform_settings FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Insert default row
INSERT INTO public.platform_settings (id)
VALUES (1);

-- Grant permissions
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
