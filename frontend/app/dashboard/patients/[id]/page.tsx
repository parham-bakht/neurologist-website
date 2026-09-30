import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {requireDashboardUser} from "../../auth";
import {formatPersianDate,visitStatusLabel} from "../../persian-date";
import type {Patient} from "../../types";
import PatientNotesEditor from "./patient-notes-editor";
import VisitEditor from "./visit-editor";
import VisitForm from "./visit-form";
import SoftRemoveButton from "../../soft-remove-button";

export default async function PatientProfilePage({params}:{params:Promise<{id:string}>}){
  const {user,headers}=await requireDashboardUser();
  if(user.role==="user")redirect("/dashboard");
  const {id}=await params;
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/patients/${id}`,{headers,cache:"no-store"});
  if(response.status===404)notFound();
  if(!response.ok)return <main className="dashboard-subpage"><Link className="back-link" href="/dashboard/patients">← بازگشت به بیماران</Link><p className="error" role="alert">دریافت پرونده بیمار انجام نشد. لطفاً دوباره تلاش کنید.</p></main>;
  const patient:Patient=await response.json();
  const latestCompleted=patient.visits.find(visit=>visit.status==="completed");

  return <main className="dashboard-subpage patient-profile-page">
    <Link className="back-link" href="/dashboard/patients">← بازگشت به بیماران</Link>
    <header className="patient-profile-hero"><span className="patient-hero-avatar">{patient.full_name.trim().charAt(0)}</span><div><p className="eyebrow">پرونده بیمار</p><h1>{patient.full_name}</h1><p dir="ltr">{patient.phone&&<>{patient.phone} · </>}{patient.email}</p></div><div className="patient-profile-actions"><span className={`patient-active-badge${patient.is_active?"":" inactive"}`}>{patient.is_active?"حساب فعال":"حساب غیرفعال"}</span><SoftRemoveButton endpoint={`/api/patients/${patient.id}`} label="حذف حساب" title="حساب بیمار حذف شود؟" description="ورود بیمار غیرفعال و حساب از فهرست‌ها حذف می‌شود؛ پرونده و سوابق پزشکی در پایگاه داده باقی می‌ماند." redirectTo="/dashboard/patients"/></div></header>

    <PatientNotesEditor patientId={patient.id} initialNotes={patient.additional_notes}/>

    <div className="patient-profile-layout">
      <div className="patient-record-column">
        <section className="latest-visit-panel">
          <div className="section-heading"><div><p className="eyebrow">آخرین مراجعه</p><h2>خلاصه آخرین ویزیت</h2></div>{latestCompleted&&<time>{formatPersianDate(latestCompleted.scheduled_at)}</time>}</div>
          {latestCompleted?<div className="latest-visit-content"><div><strong>شرح ویزیت</strong><p>{latestCompleted.description||"شرحی ثبت نشده است."}</p></div><div className="prescription-box"><strong>داروهای تجویزشده</strong><p>{latestCompleted.medications||"دارویی ثبت نشده است."}</p></div><small className="visit-doctor-label">پزشک ویزیت‌کننده: <strong>{latestCompleted.doctor?.full_name||latestCompleted.doctor_name}</strong></small></div>:<div className="empty-state compact-empty"><span>◷</span><h3>ویزیت انجام‌شده‌ای وجود ندارد</h3><p className="muted">پس از ثبت اولین ویزیت، خلاصه آن اینجا نمایش داده می‌شود.</p></div>}
        </section>

        <section className="all-visits-panel"><div className="section-heading"><div><p className="eyebrow">تاریخچه</p><h2>همه ویزیت‌ها</h2></div><span className="inbox-count">{patient.visits.length.toLocaleString("fa-IR")} ویزیت</span></div>
          {patient.visits.length===0?<p className="muted">هنوز ویزیتی ثبت نشده است.</p>:<div className="staff-visit-list">{patient.visits.map(visit=><article key={visit.id}><div><time>{formatPersianDate(visit.scheduled_at)}</time><small className="visit-doctor-label">{visit.status==="completed"?"پزشک ویزیت‌کننده":visit.status==="scheduled"?"پزشک ویزیت آینده":"پزشک ثبت‌شده"}: <strong>{visit.doctor?.full_name||visit.doctor_name}</strong></small></div><span className={`visit-status ${visit.status}`}>{visitStatusLabel[visit.status]}</span>{visit.address&&<p className="address-line"><strong>آدرس:</strong> {visit.address}</p>}<p>{visit.description||"بدون شرح ویزیت"}</p>{visit.medications&&<p className="medicine-line"><strong>دارو:</strong> {visit.medications}</p>}<div className="visit-record-actions"><VisitEditor visit={visit}/><SoftRemoveButton endpoint={`/api/visits/${visit.id}`} label="حذف ویزیت" title="ویزیت از فهرست حذف شود؟" description="این ویزیت دیگر در پنل نمایش داده نمی‌شود، اما اطلاعات آن برای حفظ سوابق در پایگاه داده باقی می‌ماند."/></div></article>)}</div>}
        </section>
      </div>
      <VisitForm patientId={patient.id}/>
    </div>
  </main>;
}
