"use client";

import {FormEvent,useState} from "react";
import {useRouter} from "next/navigation";

export default function StaffNameEditor({initialName}:{initialName:string}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [name,setName]=useState(initialName);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);setMessage("");setError(false);
    try{
      const response=await fetch("/api/auth/me",{
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({full_name:name}),
      });
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.detail==="string"?data.detail:"تغییر نام انجام نشد.");
      setName(data.full_name);
      setMessage("نام شما به‌روزرسانی شد.");
      router.refresh();
      window.setTimeout(()=>{setOpen(false);setMessage("")},900);
    }catch(caught){setError(true);setMessage(caught instanceof Error?caught.message:"تغییر نام انجام نشد.")}
    finally{setBusy(false)}
  }

  if(!open)return <button type="button" className="secondary" onClick={()=>setOpen(true)}>ویرایش نام</button>;
  return <form className="staff-name-editor" onSubmit={submit}>
    <label><span className="sr-only">نام و نام خانوادگی</span><input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={120} required autoFocus/></label>
    <button disabled={busy}>{busy?"در حال ذخیره…":"ذخیره نام"}</button>
    <button type="button" className="secondary" disabled={busy} onClick={()=>{setName(initialName);setMessage("");setOpen(false)}}>انصراف</button>
    {message&&<small className={error?"error":"success"} role={error?"alert":"status"}>{message}</small>}
  </form>;
}
