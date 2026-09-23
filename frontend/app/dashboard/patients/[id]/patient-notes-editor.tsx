"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";

export default function PatientNotesEditor({patientId,initialNotes}:{patientId:string;initialNotes:string}){
  const router=useRouter();
  const [notes,setNotes]=useState(initialNotes);
  const [draft,setDraft]=useState(initialNotes);
  const [editing,setEditing]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  function beginEditing(){setDraft(notes);setEditing(true);setMessage("");setError(false)}
  function cancelEditing(){setDraft(notes);setEditing(false);setMessage("");setError(false)}

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);setMessage("");setError(false);
    try{
      const response=await fetch(`/api/patients/${patientId}`,{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({additional_notes:draft}),
      });
      if(!response.ok){setError(true);setMessage(response.status===422?"توضیحات واردشده بیش از حد مجاز است.":"ذخیره توضیحات انجام نشد. دوباره تلاش کنید.");return}
      const patient=await response.json();
      const saved=String(patient.additional_notes??draft).trim();
      setNotes(saved);setDraft(saved);setEditing(false);setMessage("توضیحات تکمیلی ذخیره شد.");
      router.refresh();
    }catch{setError(true);setMessage("ارتباط برقرار نشد. لطفاً دوباره تلاش کنید.")}
    finally{setBusy(false)}
  }

  return <section className={`patient-additional-notes${editing?" editing":""}`} aria-labelledby="patient-notes-title">
    <header className="patient-notes-heading"><div><p className="eyebrow">یادداشت پرونده</p><h2 id="patient-notes-title">توضیحات تکمیلی</h2></div>{!editing&&<button type="button" className="secondary patient-notes-edit" onClick={beginEditing}>{notes?"ویرایش توضیحات":"ثبت توضیحات"}</button>}</header>
    {editing?<form className="patient-notes-form" onSubmit={submit} aria-busy={busy}><label htmlFor="patient-additional-notes">توضیحات بیمار<textarea id="patient-additional-notes" value={draft} onChange={event=>setDraft(event.target.value)} rows={6} maxLength={2000} autoFocus placeholder="نکات مهم درباره بیمار، سابقه پزشکی یا اطلاعاتی که باید در پرونده در نظر گرفته شود…"/></label><div className="patient-notes-form-footer"><small>{draft.length.toLocaleString("fa-IR")} از ۲٬۰۰۰ نویسه</small><div className="patient-notes-actions"><button disabled={busy}>{busy?"در حال ذخیره…":"ذخیره توضیحات"}</button><button type="button" className="secondary" disabled={busy} onClick={cancelEditing}>انصراف</button></div></div>{message&&<p className={error?"error":"success"} role={error?"alert":"status"}>{message}</p>}</form>:<div className="patient-notes-readonly"><p className={notes?"":"patient-notes-empty"}>{notes||"هنوز توضیح تکمیلی برای این بیمار ثبت نشده است."}</p>{message&&<p className={error?"error":"success"} role={error?"alert":"status"}>{message}</p>}</div>}
  </section>;
}
