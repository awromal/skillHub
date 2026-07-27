
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  fee numeric NOT NULL DEFAULT 0,
  trainer text NOT NULL DEFAULT '',
  seats integer NOT NULL DEFAULT 0,
  start_date date,
  image_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active courses" ON public.courses FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "Authenticated can view all courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE SEQUENCE public.application_seq START 1;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  admission_number text NOT NULL,
  roll_number text NOT NULL,
  department text NOT NULL,
  semester text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  gender text NOT NULL,
  address text NOT NULL DEFAULT '',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  course_name text NOT NULL,
  parent_name text NOT NULL DEFAULT '',
  parent_phone text NOT NULL DEFAULT '',
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anyone auth can submit applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins view all applications" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete applications" ON public.applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed 10 courses
INSERT INTO public.courses (name, description, duration, fee, trainer, seats, start_date) VALUES
('Python Programming', 'Learn Python from basics to advanced with hands-on projects.', '3 months', 4500, 'Dr. Anil Kumar', 40, CURRENT_DATE + 14),
('Full Stack Web Development', 'Build modern web apps with React, Node.js, and databases.', '6 months', 9500, 'Ms. Reshma Nair', 30, CURRENT_DATE + 21),
('Artificial Intelligence Fundamentals', 'Introduction to AI, ML models, and real-world applications.', '4 months', 7500, 'Dr. Rajesh Menon', 25, CURRENT_DATE + 28),
('Data Science Basics', 'Data analysis, visualization, and predictive modeling.', '4 months', 7000, 'Mr. Vishnu Prasad', 30, CURRENT_DATE + 14),
('UI/UX Design', 'Design beautiful, user-friendly interfaces with Figma.', '2 months', 4000, 'Ms. Aiswarya Menon', 25, CURRENT_DATE + 10),
('Digital Marketing', 'SEO, social media, content, and paid advertising.', '3 months', 5000, 'Mr. Sanjay Thomas', 40, CURRENT_DATE + 7),
('Cyber Security', 'Ethical hacking, network security, and threat analysis.', '4 months', 8000, 'Dr. Neeraj Pillai', 20, CURRENT_DATE + 30),
('Graphic Design', 'Photoshop, Illustrator, and creative design principles.', '2 months', 4200, 'Ms. Lakshmi Devi', 30, CURRENT_DATE + 14),
('MS Office Professional', 'Advanced Word, Excel, PowerPoint, and productivity tools.', '1 month', 2500, 'Mr. George Mathew', 50, CURRENT_DATE + 5),
('Mobile App Development', 'Build cross-platform apps with React Native.', '5 months', 8500, 'Ms. Divya Krishnan', 25, CURRENT_DATE + 21);
