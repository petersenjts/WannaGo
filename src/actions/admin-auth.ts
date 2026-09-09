"use server";

import { redirect } from "next/navigation";
import { checkAdminCredentials, clearSessionCookie, setSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  let valid: boolean;
  try {
    valid = checkAdminCredentials(email, password);
  } catch {
    return { error: "Admin login isn't configured yet — check ADMIN_EMAIL / ADMIN_PASSWORD." };
  }

  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  await setSessionCookie();
  redirect("/admin/requests");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/admin/login");
}
