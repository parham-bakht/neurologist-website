import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {requireDashboardUser} from "../../auth";
import {persianVisitDisplay,visitStatusLabel} from "../../persian-date";
import type {Visit} from "../../types";

export default async function VisitDetailsPage({params}:{params:Promise<{id:string}>}){
  const {user,headers}=await requireDashboardUser();
  if(user.role!=="user")redirect("/dashboard");
  const {id}=await params;
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/visits/my`,{headers,cache:"no-store"});
  if(!response.ok)return <main className="dashboard-subpage"><Link className="back-link" href="/dashboard/visits">← بازگشت به ویزیت‌ها</Link><p className="error" role="alert">دریافت اطلاعات ویزیت انجام نشد. لطفاً دوباره تلاش کنید.</p></main>;
  const visits:Visit[]=await response.json();
  const visit=visits.find(item=>item.id===id);
  if(!visit)notFound();
  const date=persianVisitDisplay(visit.scheduled_at);

  return <main className="dashboard-subpage patient-visit-detail-page">
    <Link className="back-link" href="/dashboard/visits">← بازگشت به ویزیت‌ها</Link>
    <header className="visit-detail-hero">
      <div><p className="eyebrow">جزئیات ویزیت</p><h1>{visit.status==="completed"?"ویزیت انجام‌شده":visit.status==="scheduled"?"ویزیت برنامه‌ریزی‌شده":"ویزیت لغوشده"}</h1></div>
      <span className={`visit-status ${visit.status}`}>{visitStatusLabel[visit.status]}</span>
    </header>
    <section className="professional-date-card">
      <div className="persian-calendar-tile"><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.monthYear}</small></div>
      <div className="appointment-essentials"><div><span className="detail-symbol">♙</span><p>{visit.status==="completed"?"پزشک ویزیت‌کننده":visit.status==="scheduled"?"پزشک ویزیت آینده":"پزشک ثبت‌شده"}<strong>{visit.doctor?.full_name||visit.doctor_name}</strong></p></div><div><span className="detail-symbol">◷</span><p>ساعت ویزیت<strong>{date.time}</strong></p></div><div><span className="detail-symbol">⌖</span><p>محل ویزیت<strong>{visit.address||"آدرس هنوز توسط پزشک ثبت نشده است"}</strong></p></div></div>
    </section>
    <section className="visit-information-grid">
      <article><span className="info-card-icon">≡</span><div><h2>توضیحات ویزیت</h2><p>{visit.description||"توضیحی برای این ویزیت ثبت نشده است."}</p></div></article>
      <article className="medicine-information-card"><span className="info-card-icon">＋</span><div><h2>داروهای تجویزشده</h2><p>{visit.medications||"دارویی برای این ویزیت ثبت نشده است."}</p></div></article>
    </section>
  </main>;
}
