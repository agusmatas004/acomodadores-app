-- Crear tabla de acomodadores
CREATE TABLE IF NOT EXISTS public.ushers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    province TEXT NOT NULL,
    circuit TEXT NOT NULL,
    congregation TEXT NOT NULL,
    captain_name TEXT NOT NULL,
    usher_name TEXT NOT NULL,
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
