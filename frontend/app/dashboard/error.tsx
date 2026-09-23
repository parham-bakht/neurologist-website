"use client";

import Link from "next/link";

export default function DashboardError({reset}:{reset:()=>void}){
  return <main className="dashboard-subpage dashboard-error-page">
    <section className="empty-state patient-list-empty" role="alert">
      <p className="eyebrow">دسترسی به اطلاعات</p>
      <h1>اطلاعات این بخش دریافت نشد</h1>
      <p className="muted">لطفاً اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.</p>
      <div className="dashboard-state-actions"><button onClick={reset}>تلاش دوباره</button><Link className="button secondary" href="/dashboard">بازگشت به پنل</Link></div>
    </section>
  </main>;
}
