import Link from "next/link";
import {persianVisitDisplay} from "./persian-date";
import type {User,Visit} from "./types";
import DashboardIcon from "./dashboard-icon";

export default function PatientDashboard({user,visits,loadError=false}:{user:User;visits:Visit[];loadError?:boolean}){
  const now=Date.now();
  const nextVisit=[...visits]
    .filter(visit=>visit.status==="scheduled"&&new Date(visit.scheduled_at).getTime()>=now)
    .sort((a,b)=>new Date(a.scheduled_at).getTime()-new Date(b.scheduled_at).getTime())[0];
  const completed=visits.filter(visit=>visit.status==="completed").length;

  const nextDate=nextVisit?persianVisitDisplay(nextVisit.scheduled_at):null;
  return <main className="patient-dashboard">
    <header className="patient-welcome">
      <div><p className="eyebrow">پنل بیمار</p><h1>سلام، {user.full_name}</h1><p>اطلاعات ویزیت‌های شما همیشه اینجا در دسترس است.</p></div>
      <form action="/api/auth/logout" method="post"><button className="secondary">خروج از حساب</button></form>
    </header>

    {loadError&&<p className="error" role="alert">دریافت اطلاعات ویزیت‌ها انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {!loadError&&<section className={`patient-overview-grid ${nextVisit?"with-next":""}`} aria-label="دسترسی سریع به ویزیت‌ها">
      <Link className="patient-overview-card visits-overview-card" href="/dashboard/visits">
        <span className="overview-icon"><DashboardIcon name="records"/></span>
        <div><p className="eyebrow">سوابق من</p><h2>ویزیت‌های من</h2><p>جزئیات تمام ویزیت‌های گذشته و آینده را مشاهده کنید.</p></div>
        <div className="overview-card-footer"><span><strong>{visits.length.toLocaleString("fa-IR")}</strong> کل ویزیت</span><span><strong>{completed.toLocaleString("fa-IR")}</strong> انجام‌شده</span><b>مشاهده همه ←</b></div>
      </Link>
      {nextVisit&&nextDate&&<Link className="patient-overview-card upcoming-overview-card" href={`/dashboard/visits/${nextVisit.id}`}>
        <span className="overview-icon"><DashboardIcon name="calendar"/></span>
        <div><p className="eyebrow">قرار پیش رو</p><h2>ویزیت بعدی</h2><div className="overview-date"><strong>{nextDate.day}</strong><span>{nextDate.monthYear}<small>{nextDate.weekday}، ساعت {nextDate.time}</small></span></div><p>پزشک ویزیت آینده: <strong>{nextVisit.doctor?.full_name||nextVisit.doctor_name}</strong></p></div>
        <div className="overview-card-footer"><span>{nextVisit.address||"آدرس هنوز ثبت نشده است"}</span><b>جزئیات ویزیت ←</b></div>
      </Link>}
    </section>}
  </main>;
}
