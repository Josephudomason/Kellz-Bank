import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getAuthenticatedUser = cache(async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
});