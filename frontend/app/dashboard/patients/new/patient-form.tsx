"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";

export default function NewPatientForm(){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    setBusy(true);setMessage("");setError(false);
    try{
    const response=await fetch("/api/patients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:form.get("full_name"),phone:form.get("phone"),email:form.get("email"),password:form.get("password"),additional_notes:form.get("additional_notes")})});
    if(!response.ok){const data=await response.json().catch(()=>null);setError(true);setMessage(response.status===409?(String(data?.detail||"").includes("mobile")?"این شماره موبایل قبلاً برای حساب دیگری ثبت شده است.":"حسابی با این ایمیل قبلاً ثبت شده است."):response.status===422?"شماره موبایل معتبر ایرانی وارد کنید.":"ثبت بیمار انجام نشد. اطلاعات را بررسی کنید.");return}
    formElement.reset();
    router.push("/dashboard/patients");
    router.refresh();
    }catch{setError(true);setMessage("ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.")}
    finally{setBusy(false)}
  }

  return <section className="editor-card patient-card">
    <div className="patient-form-intro"><h2>اطلاعات حساب بیمار</h2><p className="muted">اطلاعات حساب را تکمیل کنید. توضیحات تکمیلی اختیاری است.</p></div>
    {message&&<p className={error?"error":"success"} role={error?"alert":"status"}>{message}</p>}
    <form className="article-form" onSubmit={submit} aria-busy={busy}>
      <label>نام و نام خانوادگی<input name="full_name" minLength={2} maxLength={120} required autoComplete="name" placeholder="نام کامل بیمار"/></label>
      <label>شماره موبایل<input name="phone" type="tel" minLength={10} maxLength={20} required dir="ltr" inputMode="tel" autoComplete="tel" placeholder="09123456789"/></label>
      <label>ایمیل<input name="email" type="email" required dir="ltr" autoComplete="email" placeholder="name@example.com"/></label>
      <label>رمز عبور اولیه<input name="password" type="password" minLength={8} maxLength={128} required dir="ltr" autoComplete="new-password" aria-describedby="patient-password-hint"/><small className="form-hint" id="patient-password-hint">رمز عبور باید حداقل ۸ نویسه داشته باشد.</small></label>
      <label className="patient-notes-field"><span>توضیحات تکمیلی <small className="optional-field-label">اختیاری</small></span><textarea name="additional_notes" rows={5} maxLength={2000} aria-describedby="patient-notes-hint" placeholder="نکات مهم درباره بیمار، سابقه پزشکی یا اطلاعاتی که باید در پرونده در نظر گرفته شود…"/><small className="form-hint" id="patient-notes-hint">این توضیحات در پرونده بیمار برای پزشک نمایش داده می‌شود.</small></label>
      <button disabled={busy}>{busy?"در حال ثبت…":"ایجاد حساب بیمار"}</button>
    </form>
  </section>;
}
