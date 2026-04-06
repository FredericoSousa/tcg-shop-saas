"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  authenticateUser,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";

export async function loginAction(
  username: string,
  password: string,
  tenantId: string,
) {
  try {
    const session = await authenticateUser(username, password, tenantId);

    if (!session) {
      return { error: "Invalid username or password" };
    }

    const token = await createSessionToken(session);
    await setSessionCookie(token);

    redirect("/admin");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Login error:", error);
    return { error: "An error occurred during login" };
  }
}

export async function logoutAction() {
  try {
    await clearSessionCookie();
    redirect("/login");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Logout error:", error);
    return { error: "An error occurred during logout" };
  }
}
