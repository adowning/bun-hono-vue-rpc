import { createClient } from "@supabase/supabase-js";

let { SUPABASE_URL, SUPABASE_SERVICE_KEY } = Bun.env;
if (!SUPABASE_URL) SUPABASE_URL = "https://crqbazcsrncvbnapuxcp.supabase.co";
if (!SUPABASE_SERVICE_KEY)
    SUPABASE_SERVICE_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycWJhemNzcm5jdmJuYXB1eGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDk1MDYsImV4cCI6MjA3Njg4NTUwNn0.AQdRVvPqeK8l8NtTwhZhXKnjPIIcv_4dRU-bSZkVPs8";

export const supabase = createClient(
    SUPABASE_URL as string,
    SUPABASE_SERVICE_KEY as string
);
