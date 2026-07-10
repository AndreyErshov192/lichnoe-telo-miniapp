import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tqvuwnqgexlexctalnby.supabase.co";
const supabaseAnonKey = "sb_publishable_9RxJiN3szIPGfkFizCTaiQ_u9NE0cfo";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);