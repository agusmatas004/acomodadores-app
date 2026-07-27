-- Crear tabla de acomodadores
CREATE TABLE IF NOT EXISTS public.ushers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    province TEXT NOT NULL,
    circuit TEXT NOT NULL,
    congregation TEXT NOT NULL,
    captain_name TEXT NOT NULL,
    usher_name TEXT NOT NULL,
    sector TEXT,
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.ushers ENABLE ROW LEVEL SECURITY;

-- Política: Solo usuarios autenticados (el administrador) pueden leer, insertar, actualizar y borrar
-- Las inserciones públicas se harán mediante Server Actions de Next.js usando la Service Role Key, 
-- por lo que pueden saltarse el RLS.
CREATE POLICY "Permitir todo a usuarios autenticados" 
ON public.ushers 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Activar Realtime para esta tabla (esencial para que el panel se actualice solo)
alter publication supabase_realtime add table public.ushers;

-- Tabla para el Mapa del Estadio y Hombres Claves
CREATE TABLE public.stadium_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager_name TEXT NOT NULL,
    auxiliary_name TEXT,
    color TEXT NOT NULL,
    pos_x FLOAT NOT NULL,
    pos_y FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.stadium_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados" 
ON public.stadium_sectors 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

alter publication supabase_realtime add table public.stadium_sectors;

-- Insertar los datos base basados en el organigrama del usuario
INSERT INTO public.stadium_sectors (name, manager_name, auxiliary_name, color, pos_x, pos_y) VALUES
('Pasillos y escaleras - Sur', 'Juan Molina', 'Daniel Guzman', 'bg-red-500', 80, 20),
('Auditorio y pasillo interior - Sur', 'Alejandro Cuenca', 'Gabriel Carbajal', 'bg-orange-500', 80, 50),
('Campo de Juego y plataforma', 'Miguel Pumara', 'Mariano Marker', 'bg-emerald-500', 50, 50),
('Presidencia y Administracion', 'Mauricio Orellano', 'Mariano Marker', 'bg-green-400', 50, 40),
('Sector Sur', 'Claudio Weber', 'Hugo Barreto', 'bg-purple-500', 50, 90),
('Sector Norte', 'Eduardo Nuñez', 'Hugo Barreto', 'bg-purple-500', 50, 10),
('Ascensores', 'Alejandro Guerrero', 'Hugo Barreto', 'bg-purple-500', 20, 50),
('Auditorio y pasillo interior - Norte', 'David Leal', 'Luis Lopez', 'bg-red-800', 20, 30),
('Pasillos y escaleras - Norte', 'Ricardo Silva', 'Javier Rios', 'bg-green-800', 20, 70);
