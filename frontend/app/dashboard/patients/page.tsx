import Link from "next/link";
import {redirect} from "next/navigation";
import {requireDashboardUser} from "../auth";
import {formatPersianDate} from "../persian-date";
import type {PatientListItem} from "../types";

type SearchParams={name?:string};

export default async function PatientsPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const {user,headers}=await requireDashboardUser();
  if(user.role==="user")redirect("/dashboard");
  const {name=""}=await searchParams;
  const suffix=name.trim()?`?name=${encodeURIComponent(name.trim())}`:"";
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/patients${suffix}`,{headers,cache:"no-store"});
  const patients:PatientListItem[]=response.ok?await response.json():[];

  return <main className="dashboard-subpage patients-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="subpage-header patient-list-header"><div><p className="eyebrow">پرونده بیماران</p><h1>بیماران من</h1><p className="muted">برای مشاهده سوابق و ثبت ویزیت، پرونده بیمار را باز کنید.</p></div><Link className="button" href="/dashboard/patients/new">＋ بیمار جدید</Link></header>
    <form className="patient-search" method="get"><label>جست‌وجوی بیمار<input name="name" defaultValue={name} placeholder="نام یا نام خانوادگی"/></label><button>جست‌وجو</button>{name&&<Link className="button secondary" href="/dashboard/patients">پاک‌کردن</Link>}</form>
    {!response.ok&&<p className="error" role="alert">دریافت فهرست بیماران انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {response.ok&&(patients.length===0?<div className="empty-state patient-list-empty"><span aria-hidden="true">♙</span><h3>{name?"بیماری پیدا نشد":"هنوز بیماری ثبت نشده است"}</h3><p className="muted">{name?"عبارت جست‌وجو را تغییر دهید یا فهرست همه بیماران را ببینید.":"با ثبت حساب بیمار، پرونده و سوابق ویزیت او در این بخش در دسترس قرار می‌گیرد."}</p><div className="dashboard-state-actions"><Link className="button secondary" href={name?"/dashboard/patients":"/dashboard/patients/new"}>{name?"مشاهده همه بیماران":"ثبت بیمار جدید"}</Link></div></div>:<section className="patient-profile-grid" aria-label="فهرست پرونده بیماران">{patients.map(patient=><Link className="patient-profile-card" href={`/dashboard/patients/${patient.id}`} key={patient.id}><span className="patient-profile-avatar">{patient.full_name.trim().charAt(0)}</span><div className="patient-profile-card-content"><h2>{patient.full_name}</h2><p dir="ltr">{patient.phone||patient.email}</p><div className="patient-visit-assignments">{patient.next_visit&&<div className="patient-doctor-assignment upcoming"><span>ویزیت آینده · {formatPersianDate(patient.next_visit.scheduled_at)}</span><strong>پزشک: {patient.next_visit.doctor.full_name}</strong></div>}{patient.latest_completed_visit&&<div className="patient-doctor-assignment completed"><span>آخرین ویزیت انجام‌شده · {formatPersianDate(patient.latest_completed_visit.scheduled_at)}</span><strong>پزشک: {patient.latest_completed_visit.doctor.full_name}</strong></div>}{!patient.next_visit&&!patient.latest_completed_visit&&<span className="patient-no-visit">هنوز ویزیت آینده یا انجام‌شده‌ای ثبت نشده است.</span>}</div><b>مشاهده پرونده ←</b></div></Link>)}</section>)}
  </main>;
}
