import Link from "next/link";
import {redirect} from "next/navigation";
import {requireDashboardUser} from "../auth";
import type {User} from "../types";
import UsersManager from "./users-manager";

export default async function UsersPage(){
  const {user,headers}=await requireDashboardUser();if(user.role!=="admin")redirect("/dashboard");
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/admin/users`,{headers,cache:"no-store"});
  const users:User[]=response.ok?await response.json():[];
  return <main className="dashboard-subpage users-page"><Link className="back-link" href="/dashboard">← بازگشت به پنل</Link><header className="subpage-header"><p className="eyebrow">مدیریت دسترسی</p><h1>کاربران و نقش‌ها</h1><p className="muted">حساب جدید بسازید و سطح دسترسی کاربران را بین بیمار، پزشک و مدیر تنظیم کنید.</p></header>{!response.ok&&<p className="error" role="alert">دریافت کاربران انجام نشد.</p>}<UsersManager initialUsers={users}/></main>;
}
