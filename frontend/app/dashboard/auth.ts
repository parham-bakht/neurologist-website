import "server-only";

import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import type {User} from "./types";

export async function requireDashboardUser(){
  const token=(await cookies()).get("access_token")?.value;
  if(!token)redirect("/login");
  const headers={Authorization:`Bearer ${token}`};
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/auth/me`,{headers,cache:"no-store"});
  if(!response.ok)redirect("/login");
  const user:User=await response.json();
  return {user,token,headers};
}
