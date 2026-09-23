"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";
import {persianDateTimeToIso} from "../../jalali-date";
import PersianCalendarField from "../../persian-calendar-field";

export default function VisitForm({patientId}:{patientId:string}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    setBusy(true);setMessage("");setError(false);
    let scheduledAt:string;
    try{scheduledAt=persianDateTimeToIso(form)}catch{setBusy(false);setError(true);setMessage("تاریخ انتخاب‌شده معتبر نیست.");return}
    const payload={scheduled_at:scheduledAt,status:form.get("status"),address:form.get("address"),description:form.get("description"),medications:form.get("medications")};
    try{
    const response=await fetch(`/api/patients/${patientId}/visits`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok){setError(true);setMessage("ثبت ویزیت انجام نشد. اطلاعات را بررسی کنید.");return}
    formElement.reset();setMessage("ویزیت با موفقیت در پرونده بیمار ثبت شد.");router.refresh();
    }catch{setError(true);setMessage("ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.")}
    finally{setBusy(false)}
  }

  return <aside className="visit-form-card"><div><p className="eyebrow">ثبت در پرونده</p><h2>ویزیت جدید</h2><p className="muted">زمان و نتیجه ویزیت را برای بیمار ثبت کنید.</p></div>{message&&<p className={error?"error":"success"} role={error?"alert":"status"}>{message}</p>}<form onSubmit={submit} aria-busy={busy}>
    <PersianCalendarField includeTime label="تاریخ و ساعت ویزیت"/>
    <label>وضعیت<select name="status" defaultValue="scheduled"><option value="scheduled">برنامه‌ریزی‌شده</option><option value="completed">انجام‌شده</option><option value="cancelled">لغوشده</option></select></label>
    <label>آدرس محل ویزیت<input name="address" maxLength={500} placeholder="مثلاً تهران، خیابان …، ساختمان پزشکان …"/></label>
    <label>شرح ویزیت<textarea name="description" rows={6} maxLength={5000} placeholder="شرح حال، بررسی‌ها و توصیه‌های پزشک…"/></label>
    <label>داروهای تجویزشده<textarea name="medications" rows={4} maxLength={3000} placeholder="نام دارو، مقدار و نحوه مصرف…"/></label>
    <button disabled={busy}>{busy?"در حال ثبت…":"ثبت ویزیت"}</button>
  </form></aside>;
}
