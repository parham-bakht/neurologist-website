import Link from "next/link";
import {redirect} from "next/navigation";
import {requireDashboardUser} from "../auth";
import RequestsInbox from "./requests-inbox";
import type {ContactRequest} from "../types";
import PersianCalendarField from "../persian-calendar-field";

type SearchParams={name?:string;phone?:string;submitted_on?:string};

export default async function RequestsPage({searchParams}:{searchParams:Promise<SearchParams>}){
  const {user,headers}=await requireDashboardUser();
  if(user.role==="user")redirect("/dashboard");
  const filters=await searchParams;
  const query=new URLSearchParams();
  if(filters.name?.trim())query.set("name",filters.name.trim());
  if(filters.phone?.trim())query.set("phone",filters.phone.trim());
  if(filters.submitted_on)query.set("submitted_on",filters.submitted_on);
  const suffix=query.size?`?${query.toString()}`:"";
  const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/contact-requests${suffix}`,{headers,cache:"no-store"});
  const requests:ContactRequest[]=response.ok?await response.json():[];

  return <main className="dashboard-subpage requests-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="subpage-header"><p className="eyebrow">درخواست‌های ویزیت</p><h1>پیگیری درخواست‌های ثبت‌شده</h1><p className="muted">با یک یا چند فیلتر جست‌وجو کنید؛ فیلترها هم‌زمان روی نتایج اعمال می‌شوند.</p></header>
    <form className="request-filters" method="get">
      <label>نام بیمار<input name="name" defaultValue={filters.name||""} placeholder="مثلاً محمد"/></label>
      <label>شماره تلفن<input name="phone" type="tel" inputMode="tel" defaultValue={filters.phone||""} dir="ltr" placeholder="مثلاً 0912"/></label>
      <PersianCalendarField dateName="submitted_on" value={filters.submitted_on} label="تاریخ ثبت"/>
      <div className="filter-actions"><button type="submit">جست‌وجو</button><Link className="button secondary" href="/dashboard/requests">پاک‌کردن فیلترها</Link></div>
    </form>
    {!response.ok&&<p className="error" role="alert">دریافت درخواست‌ها انجام نشد. لطفاً صفحه را دوباره بارگذاری کنید.</p>}
    {response.ok&&<RequestsInbox initialRequests={requests}/>}
  </main>;
}
