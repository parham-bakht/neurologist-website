import Link from "next/link";
import {requireDashboardUser} from "../auth";
import PersianCalendarField from "../persian-calendar-field";
import {formatPersianDate,visitStatusLabel} from "../persian-date";
import type {Visit} from "../types";

type SearchParams={patient_name?:string;visit_on?:string;sort?:"asc"|"desc"};

function PatientVisits({visits,responseOk}:{visits:Visit[];responseOk:boolean}){
  return <main className="dashboard-subpage patient-visits-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="subpage-header"><p className="eyebrow">سوابق پزشکی</p><h1>ویزیت‌های من</h1><p className="muted">هر ویزیت را انتخاب کنید تا زمان، محل و اطلاعات ثبت‌شده آن را ببینید.</p></header>
    {!responseOk&&<p className="error" role="alert">دریافت ویزیت‌ها انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {responseOk&&(visits.length===0?<section className="empty-state patient-list-empty"><span aria-hidden="true">◷</span><h2>هنوز ویزیتی ثبت نشده است</h2><p className="muted">پس از ثبت ویزیت توسط پزشک، سابقه آن در این بخش نمایش داده می‌شود.</p></section>:<section className="patient-visit-links">{visits.map(visit=><Link href={`/dashboard/visits/${visit.id}`} className="patient-visit-link" key={visit.id}><span className="visit-link-icon" aria-hidden="true">◷</span><div><time>{formatPersianDate(visit.scheduled_at)}</time><p>{visit.status==="completed"?"پزشک ویزیت‌کننده":visit.status==="scheduled"?"پزشک ویزیت آینده":"پزشک ثبت‌شده"}: <strong>{visit.doctor.full_name}</strong>{visit.address?` · ${visit.address}`:""}</p></div><span className={`visit-status ${visit.status}`}>{visitStatusLabel[visit.status]}</span><b aria-hidden="true">←</b></Link>)}</section>)}
  </main>;
}

function StaffVisits({visits,responseOk,filters}:{visits:Visit[];responseOk:boolean;filters:SearchParams}){
  return <main className="dashboard-subpage staff-visits-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="subpage-header"><p className="eyebrow">مدیریت ویزیت‌ها</p><h1>همه ویزیت‌ها</h1><p className="muted">ویزیت‌های ثبت‌شده را براساس بیمار یا تاریخ پیدا و به ترتیب دلخواه مشاهده کنید.</p></header>
    <form className="visit-filters" method="get">
      <label>نام بیمار<input name="patient_name" defaultValue={filters.patient_name||""} placeholder="جست‌وجوی نام بیمار"/></label>
      <PersianCalendarField dateName="visit_on" value={filters.visit_on} label="تاریخ ویزیت"/>
      <label>مرتب‌سازی تاریخ<select name="sort" defaultValue={filters.sort||"desc"}><option value="desc">جدیدترین ابتدا</option><option value="asc">قدیمی‌ترین ابتدا</option></select></label>
      <div className="filter-actions"><button type="submit">اعمال فیلتر</button><Link className="button secondary" href="/dashboard/visits">پاک‌کردن</Link></div>
    </form>
    {!responseOk&&<p className="error" role="alert">دریافت ویزیت‌ها انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {responseOk&&<div className="section-heading staff-visits-heading"><div><p className="eyebrow">نتایج</p><h2>{visits.length.toLocaleString("fa-IR")} ویزیت</h2></div></div>}
    {responseOk&&(visits.length===0?<section className="empty-state patient-list-empty"><span aria-hidden="true">⌕</span><h2>ویزیتی پیدا نشد</h2><p className="muted">فیلترها را تغییر دهید یا پاک کنید.</p></section>:<section className="staff-visits-list">{visits.map(visit=><article key={visit.id}>
      <div className="staff-visit-person"><span>{visit.patient.full_name.trim().charAt(0)}</span><div><h2>{visit.patient.full_name}</h2><a href={visit.patient.phone?`tel:${visit.patient.phone}`:`mailto:${visit.patient.email}`} dir="ltr">{visit.patient.phone||visit.patient.email}</a></div></div>
      <div className="staff-visit-date"><small>تاریخ ویزیت</small><time>{formatPersianDate(visit.scheduled_at)}</time></div>
      <span className={`visit-status ${visit.status}`}>{visitStatusLabel[visit.status]}</span>
      <div className="staff-visit-summary"><strong className="staff-visit-doctor">{visit.status==="completed"?"پزشک ویزیت‌کننده":visit.status==="scheduled"?"پزشک ویزیت آینده":"پزشک ثبت‌شده"}: {visit.doctor.full_name}</strong><p>{visit.description||"برای این ویزیت شرحی ثبت نشده است."}</p>{visit.address&&<small>⌖ {visit.address}</small>}</div>
      <Link className="button secondary staff-visit-open" href={`/dashboard/patients/${visit.patient_id}`}>مشاهده و ویرایش پرونده ←</Link>
    </article>)}</section>)}
  </main>;
}

export default async function VisitsPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const {user,headers}=await requireDashboardUser();
  const filters=await searchParams;
  const backend=process.env.BACKEND_URL||"http://localhost:8000";
  if(user.role==="user"){
    const response=await fetch(`${backend}/api/v1/visits/my`,{headers,cache:"no-store"});
    const visits:Visit[]=response.ok?await response.json():[];
    return <PatientVisits visits={visits} responseOk={response.ok}/>;
  }
  const query=new URLSearchParams();
  if(filters.patient_name?.trim())query.set("patient_name",filters.patient_name.trim());
  if(filters.visit_on)query.set("visit_on",filters.visit_on);
  query.set("sort",filters.sort==="asc"?"asc":"desc");
  const response=await fetch(`${backend}/api/v1/visits?${query.toString()}`,{headers,cache:"no-store"});
  const visits:Visit[]=response.ok?await response.json():[];
  return <StaffVisits visits={visits} responseOk={response.ok} filters={filters}/>;
}
