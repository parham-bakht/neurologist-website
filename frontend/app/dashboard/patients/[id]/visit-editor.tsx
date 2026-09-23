"use client";

import {FormEvent,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import type {Visit} from "../../types";
import {persianDateTimeToIso} from "../../jalali-date";
import PersianCalendarField from "../../persian-calendar-field";

export default function VisitEditor({visit}:{visit:Visit}){
  const router=useRouter();
  const detailsRef=useRef<HTMLDetailsElement>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=new FormData(event.currentTarget);
    setBusy(true);setMessage("");setError(false);
    let scheduledAt:string;
    try{scheduledAt=persianDateTimeToIso(form)}catch{setBusy(false);setError(true);setMessage("تاریخ انتخاب‌شده معتبر نیست.");return}
    try{
    const response=await fetch(`/api/visits/${visit.id}`,{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        scheduled_at:scheduledAt,
        status:form.get("status"),
        address:form.get("address"),
        description:form.get("description"),
        medications:form.get("medications"),
      }),
    });
    if(!response.ok){setError(true);setMessage("ذخیره تغییرات انجام نشد. دوباره تلاش کنید.");return}
    setMessage("تغییرات ویزیت ذخیره شد.");
    router.refresh();
    window.setTimeout(()=>{if(detailsRef.current)detailsRef.current.open=false;setMessage("")},900);
    }catch{setError(true);setMessage("ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.")}
    finally{setBusy(false)}
  }

  return <details className="visit-editor" ref={detailsRef}>
    <summary>ویرایش ویزیت</summary>
    <form onSubmit={submit} aria-busy={busy}>
      {message&&<p className={error?"error":"success"} role={error?"alert":"status"}>{message}</p>}
      <PersianCalendarField includeTime value={visit.scheduled_at} label="تاریخ و ساعت ویزیت"/>
      <div className="visit-edit-fields"><label>وضعیت<select name="status" defaultValue={visit.status}><option value="scheduled">برنامه‌ریزی‌شده</option><option value="completed">انجام‌شده</option><option value="cancelled">لغوشده</option></select></label><label>آدرس محل ویزیت<input name="address" maxLength={500} defaultValue={visit.address} placeholder="آدرس مطب یا مرکز درمانی"/></label></div>
      <label>شرح ویزیت<textarea name="description" rows={5} maxLength={5000} defaultValue={visit.description} placeholder="شرح حال، بررسی‌ها و توصیه‌های پزشک…"/></label>
      <label>داروهای تجویزشده<textarea name="medications" rows={4} maxLength={3000} defaultValue={visit.medications} placeholder="نام دارو، مقدار و نحوه مصرف…"/></label>
      <div className="visit-edit-actions"><button disabled={busy}>{busy?"در حال ذخیره…":"ذخیره تغییرات"}</button><button type="button" className="secondary" onClick={()=>{if(detailsRef.current)detailsRef.current.open=false}}>انصراف</button></div>
    </form>
  </details>;
}
