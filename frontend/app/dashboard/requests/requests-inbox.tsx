"use client";

import {FormEvent,useEffect,useRef,useState} from "react";
import type {ContactRequest} from "../types";
import {formatPersianDate} from "../persian-date";

export default function RequestsInbox({initialRequests}:{initialRequests:ContactRequest[]}){
  const [requests,setRequests]=useState(initialRequests);
  const [selected,setSelected]=useState<ContactRequest|null>(null);
  const [followUpNotes,setFollowUpNotes]=useState("");
  const [message,setMessage]=useState("");
  const [pendingId,setPendingId]=useState<string|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);

  useEffect(()=>{setRequests(initialRequests)},[initialRequests]);
  useEffect(()=>{const element=dialog.current;if(!element)return;if(selected&&!element.open)element.showModal();if(!selected&&element.open)element.close()},[selected]);

  function openRequest(request:ContactRequest){setMessage("");setFollowUpNotes(request.follow_up_notes||"");setSelected(request)}
  function closeDialog(){if(!pendingId)setSelected(null)}

  async function setStatus(request:ContactRequest,status:"new"|"contacted",notes=followUpNotes){
    setMessage("");setPendingId(request.id);
    try{
      const response=await fetch(`/api/contact-requests/${request.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,follow_up_notes:notes})});
      if(!response.ok){const data=await response.json().catch(()=>null);setMessage(typeof data?.detail==="string"?data.detail:"تغییر وضعیت درخواست انجام نشد.");return}
      const updated:ContactRequest=await response.json();
      setRequests(current=>current.map(item=>item.id===updated.id?updated:item));
      setMessage(status==="contacted"?"پیگیری و توضیحات با موفقیت ثبت شد.":"درخواست به وضعیت جدید بازگردانده شد.");
      setSelected(null);
    }catch{setMessage("ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.")}
    finally{setPendingId(null)}
  }

  function submitFollowUp(event:FormEvent<HTMLFormElement>){event.preventDefault();if(selected)void setStatus(selected,"contacted",followUpNotes)}

  const newCount=requests.filter(item=>item.status==="new").length;
  return <section className="contact-inbox requests-inbox">
    <div className="section-heading"><div><p className="eyebrow">نتایج</p><h2>{requests.length.toLocaleString("fa-IR")} درخواست</h2></div><span className="inbox-count">{newCount.toLocaleString("fa-IR")} درخواست جدید</span></div>
    {message&&<p className={message.includes("موفقیت")||message.includes("بازگردانده")?"success":"error"} role="status">{message}</p>}
    {requests.length===0?<div className="empty-state"><span aria-hidden="true">⌕</span><h3>درخواستی پیدا نشد</h3><p className="muted">فیلترها را تغییر دهید یا پاک کنید.</p></div>:<div className="contact-list">{requests.map(request=><article className={`contact-item ${request.status}`} key={request.id} aria-busy={pendingId===request.id}>
      <button type="button" className="contact-card-open" onClick={()=>openRequest(request)}><div className="contact-person"><span className="contact-avatar">{request.full_name.trim().charAt(0)}</span><div><h3>{request.full_name}</h3><span dir="ltr">{request.phone}</span></div></div><p>{request.description}</p><span className="request-open-hint">مشاهده جزئیات <b aria-hidden="true">←</b></span></button>
      {request.follow_up_notes&&<p className="contact-follow-up-preview"><strong>یادداشت پیگیری:</strong> {request.follow_up_notes}</p>}
      <div className="contact-meta"><span>{formatPersianDate(request.created_at)}</span>{request.status==="new"?<button disabled={pendingId!==null} onClick={()=>openRequest(request)}>پیگیری شد</button>:<><span className="contacted-label">پیگیری‌شده</span><button disabled={pendingId!==null} className="text-button" onClick={()=>openRequest(request)}>مشاهده و ویرایش</button></>}</div>
    </article>)}</div>}

    <dialog ref={dialog} className="request-detail-dialog" onCancel={event=>{event.preventDefault();closeDialog()}} onClose={()=>{if(selected&&!pendingId)setSelected(null)}} aria-labelledby="request-detail-title">
      {selected&&<div className="request-detail-card"><header><div><p className="eyebrow">جزئیات درخواست مشاوره</p><h2 id="request-detail-title">{selected.full_name}</h2></div><button type="button" className="dialog-close" onClick={closeDialog} aria-label="بستن">×</button></header>
        <dl className="request-detail-meta"><div><dt>شماره تماس</dt><dd><a href={`tel:${selected.phone}`} dir="ltr">{selected.phone}</a></dd></div><div><dt>تاریخ ثبت</dt><dd>{formatPersianDate(selected.created_at)}</dd></div><div><dt>وضعیت</dt><dd><span className={`status ${selected.status}`}>{selected.status==="contacted"?"پیگیری‌شده":"جدید"}</span></dd></div>{selected.contacted_at&&<div><dt>زمان پیگیری</dt><dd>{formatPersianDate(selected.contacted_at)}</dd></div>}</dl>
        <section className="request-original-description"><h3>توضیحات درخواست</h3><p>{selected.description}</p></section>
        <form onSubmit={submitFollowUp}><label htmlFor="follow-up-notes">توضیحات پیگیری <span>اختیاری</span><textarea id="follow-up-notes" value={followUpNotes} onChange={event=>setFollowUpNotes(event.target.value)} maxLength={2000} rows={5} placeholder="نتیجه تماس، هماهنگی انجام‌شده یا توضیحات لازم را ثبت کنید."/><small>{followUpNotes.length.toLocaleString("fa-IR")} از ۲۰۰۰ نویسه</small></label><footer><button type="button" className="secondary" onClick={closeDialog} disabled={pendingId!==null}>انصراف</button>{selected.status==="contacted"&&<button type="button" className="secondary" onClick={()=>void setStatus(selected,"new",followUpNotes)} disabled={pendingId!==null}>بازگردانی به جدید</button>}<button type="submit" disabled={pendingId!==null}>{pendingId===selected.id?"در حال ثبت…":selected.status==="contacted"?"ذخیره توضیحات":"ثبت پیگیری‌شده"}</button></footer></form>
      </div>}
    </dialog>
  </section>;
}
