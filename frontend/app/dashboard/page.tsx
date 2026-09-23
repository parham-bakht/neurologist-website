import Link from "next/link";
import {requireDashboardUser} from "./auth";
import PatientDashboard from "./patient-dashboard";
import type {Visit} from "./types";
import DashboardIcon from "./dashboard-icon";

export default async function Dashboard(){
  const {user,headers}=await requireDashboardUser();
  if(user.role==="user"){
    const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/visits/my`,{headers,cache:"no-store"});
    const visits:Visit[]=response.ok?await response.json():[];
    return <PatientDashboard user={user} visits={visits} loadError={!response.ok}/>;
  }
  return <main className="dashboard-home">
    <header className="dashboard-header"><div><p className="eyebrow">پنل {user.role==="admin"?"مدیریت":"پزشک"}</p><h1>امروز چه کاری انجام می‌دهید؟</h1><p className="muted">برای ورود به هر بخش، کارت مربوط به آن را انتخاب کنید.</p></div><form className="dashboard-logout" action="/api/auth/logout" method="post"><button className="secondary">خروج از حساب</button></form></header>
    <section className="dashboard-menu" aria-label="بخش‌های پنل">
      <Link href="/dashboard/patients" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="patient"/></span><div><p className="eyebrow">بیماران</p><h2>پرونده بیماران</h2><p>پروفایل، آخرین شرح ویزیت و داروهای تجویزشده هر بیمار را ببینید.</p></div><strong>مشاهده پرونده‌ها ←</strong></Link>
      <Link href="/dashboard/visits" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="calendar"/></span><div><p className="eyebrow">مدیریت ویزیت</p><h2>همه ویزیت‌ها</h2><p>ویزیت‌ها را براساس نام بیمار و تاریخ جست‌وجو، فیلتر و مرتب کنید.</p></div><strong>مشاهده ویزیت‌ها ←</strong></Link>
      <Link href="/dashboard/requests" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="inbox"/></span><div><p className="eyebrow">درخواست‌های ویزیت</p><h2>پیگیری درخواست‌ها</h2><p>درخواست‌ها را براساس نام، تلفن یا تاریخ ثبت جست‌وجو و پیگیری کنید.</p></div><strong>مشاهده درخواست‌ها ←</strong></Link>
      <Link href="/dashboard/patients/new" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="new-patient"/></span><div><p className="eyebrow">پرونده بیمار</p><h2>ثبت‌نام بیمار جدید</h2><p>برای بیمار یک حساب کاربری امن ایجاد کنید.</p></div><strong>ایجاد حساب بیمار ←</strong></Link>
      <Link href="/dashboard/articles" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="article"/></span><div><p className="eyebrow">انتشار محتوا</p><h2>مدیریت مقالات</h2><p>مقاله بنویسید، رسانه اضافه کنید و نوشته‌های قبلی را مدیریت کنید.</p></div><strong>ورود به بخش مقالات ←</strong></Link>
      {user.role==="admin"&&<Link href="/dashboard/users" className="dashboard-menu-card"><span className="menu-icon"><DashboardIcon name="users"/></span><div><p className="eyebrow">مدیریت دسترسی</p><h2>کاربران و نقش‌ها</h2><p>حساب جدید بسازید و کاربران را به بیمار، پزشک یا مدیر ارتقا دهید.</p></div><strong>مدیریت کاربران ←</strong></Link>}
    </section>
  </main>;
}
