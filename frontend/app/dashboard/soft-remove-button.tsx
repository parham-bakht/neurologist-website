"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import ConfirmDialog from "../../components/articles/ConfirmDialog";

export default function SoftRemoveButton({
  endpoint,
  label,
  title,
  description,
  redirectTo,
  className="danger-text",
}:{
  endpoint:string;
  label:string;
  title:string;
  description:string;
  redirectTo?:string;
  className?:string;
}){
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  async function remove(){
    setBusy(true);setError("");
    try{
      const response=await fetch(endpoint,{method:"DELETE"});
      if(!response.ok){
        const data=await response.json().catch(()=>null);
        throw new Error(typeof data?.detail==="string"?data.detail:"حذف انجام نشد.");
      }
      setOpen(false);
      if(redirectTo)router.push(redirectTo);
      router.refresh();
    }catch(caught){setError(caught instanceof Error?caught.message:"حذف انجام نشد.")}
    finally{setBusy(false)}
  }

  return <>
    <button type="button" className={className} onClick={()=>{setError("");setOpen(true)}}>{label}</button>
    {error&&<p className="error soft-remove-error" role="alert">{error}</p>}
    <ConfirmDialog open={open} title={title} description={description} confirmLabel="بله، حذف شود" tone="danger" busy={busy} onCancel={()=>setOpen(false)} onConfirm={()=>void remove()}/>
  </>;
}
