"use client";

import {useEffect,useId,useRef} from "react";

export default function ConfirmDialog({open,title,description,confirmLabel,tone="primary",busy=false,onCancel,onConfirm}:{open:boolean;title:string;description:string;confirmLabel:string;tone?:"primary"|"danger";busy?:boolean;onCancel:()=>void;onConfirm:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  const titleId=useId();
  useEffect(()=>{const dialog=ref.current;if(!dialog)return;if(open&&!dialog.open)dialog.showModal();if(!open&&dialog.open)dialog.close()},[open]);
  return <dialog ref={ref} className="confirm-dialog" onCancel={event=>{event.preventDefault();if(!busy)onCancel()}} onClose={()=>{if(open&&!busy)onCancel()}} aria-labelledby={titleId}>
    <div><span className={`confirm-mark ${tone}`} aria-hidden="true">{tone==="danger"?"!":"✓"}</span><h2 id={titleId}>{title}</h2><p>{description}</p><footer><button className="secondary-action" onClick={onCancel} disabled={busy}>انصراف</button><button className={tone==="danger"?"danger-action":""} onClick={onConfirm} disabled={busy}>{busy?"در حال انجام…":confirmLabel}</button></footer></div>
  </dialog>;
}
