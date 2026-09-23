"use client";

import {FormEvent,useState} from "react";

export default function ContactForm(){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [success,setSuccess]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    setBusy(true);setMessage("");setSuccess(false);
    try{
      const response=await fetch("/api/contact-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:form.get("full_name"),phone:form.get("phone"),description:form.get("description")})});
      if(!response.ok){setMessage("ثبت درخواست انجام نشد. لطفاً اطلاعات واردشده را بررسی و دوباره تلاش کنید.");return}
      formElement.reset();setSuccess(true);setMessage("درخواست شما با موفقیت ثبت شد. برای هماهنگی با شما تماس خواهیم گرفت.");
    }catch{setMessage("ارتباط برقرار نشد. لطفاً اتصال اینترنت را بررسی و دوباره تلاش کنید.");}
    finally{setBusy(false);}
  }
  return <section className="contact-section premium-contact-section"><div className="contact-copy"><p className="eyebrow">درخواست مشاوره</p><h2>برای بررسی شرایط فرزندتان نیاز به راهنمایی دارید؟</h2><p>اطلاعات تماس و توضیح کوتاهی درباره شرایط کودک ثبت کنید. درخواست شما بررسی خواهد شد و برای هماهنگی و راهنمایی درباره مراحل بعدی با شما تماس گرفته می‌شود.</p><div className="contact-privacy"><span>✓</span><small>اطلاعات شما فقط در اختیار پزشک و مدیران مجاز مرکز قرار می‌گیرد.</small></div></div><form id="consultation-form" className="contact-form" onSubmit={submit} aria-busy={busy}><div className="contact-form-heading"><h3>درخواست مشاوره</h3><p>برای هماهنگی، همه فیلدهای زیر را تکمیل کنید.</p></div>{message&&<p role={success?"status":"alert"} className={success?"success":"error"}>{message}</p>}<div id="consultation-fields" className="contact-form-fields"><label>نام و نام خانوادگی<input name="full_name" autoComplete="name" minLength={2} maxLength={120} required placeholder="نام و نام خانوادگی خود را وارد کنید"/></label><label>شماره تماس<input name="phone" autoComplete="tel" type="tel" dir="ltr" inputMode="tel" minLength={7} maxLength={30} required placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"/></label><label>توضیحات<textarea name="description" minLength={5} maxLength={2000} rows={4} required placeholder="لطفاً به‌صورت کوتاه درباره شرایط، علائم یا دلیل مراجعه کودک توضیح دهید"/></label></div><button disabled={busy}>{busy?"در حال ارسال درخواست…":"ارسال درخواست مشاوره"}</button><small className="form-disclaimer">ارسال این فرم به معنی ثبت قطعی نوبت نیست. زمان مراجعه پس از هماهنگی تأیید خواهد شد.</small></form></section>;
}
