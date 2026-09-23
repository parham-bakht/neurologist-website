"use client";

import {FormEvent,useEffect,useRef,useState} from "react";
import {ApiError,mediaApi} from "../../lib/api/articles";
import {validateArticleImage} from "../../lib/articles/image-validation";
import type {ArticleMedia} from "../../types/article";
import type {InlineImage} from "./RichTextEditor";

export default function ArticleImageDialog({open,onClose,onUploaded,onInsert}:{open:boolean;onClose:()=>void;onUploaded:(media:ArticleMedia)=>void;onInsert:(image:InlineImage)=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState("");
  const [progress,setProgress]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{const element=dialog.current;if(!element)return;if(open&&!element.open)element.showModal();if(!open&&element.open)element.close()},[open]);
  useEffect(()=>{if(!file){setPreview("");return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
  const close=()=>{if(busy)return;setFile(null);setError("");setProgress(0);onClose()};
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!file)return;
    const validationError=validateArticleImage(file);
    if(validationError){setError(validationError);return}
    const data=new FormData(event.currentTarget);
    setBusy(true);setError("");
    try{
      const alt=String(data.get("alt")||"").trim();
      const caption=String(data.get("caption")||"").trim();
      const media=await mediaApi.uploadImage(file,{altText:alt,caption},setProgress);
      onUploaded(media);
      onInsert({src:media.url,alt,caption,alignment:String(data.get("alignment")) as InlineImage["alignment"],width:Number(data.get("width"))||100});
      setFile(null);setProgress(0);onClose();
    }catch(caught){setError(caught instanceof ApiError?caught.message:"بارگذاری تصویر انجام نشد.")}
    finally{setBusy(false)}
  }
  return <dialog ref={dialog} className="article-dialog" onCancel={event=>{event.preventDefault();close()}} onClose={()=>{if(open&&!busy)onClose()}} aria-labelledby="inline-image-title">
    <form onSubmit={submit}>
      <header><div><span>رسانه درون متن</span><h2 id="inline-image-title">افزودن تصویر</h2></div><button type="button" className="dialog-close" onClick={close} aria-label="بستن">×</button></header>
      <label className={`image-dropzone ${preview?"has-image":""}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const next=event.dataTransfer.files[0]||null;setFile(next);setError(next?validateArticleImage(next)||"":"")}}>
        {preview?<img src={preview} alt="پیش‌نمایش تصویر انتخاب‌شده"/>:<><strong>تصویر را اینجا رها کنید</strong><span>یا برای انتخاب JPEG، PNG یا WebP کلیک کنید</span><small>حداکثر ۱۰ مگابایت</small></>}
        <input type="file" accept="image/jpeg,image/png,image/webp" required={!file} onChange={event=>{const next=event.target.files?.[0]||null;setFile(next);setError(next?validateArticleImage(next)||"":"")}}/>
      </label>
      <label>متن جایگزین تصویر <span>برای دسترس‌پذیری</span><input name="alt" maxLength={300} placeholder="تصویر چه چیزی را نشان می‌دهد؟"/></label>
      <label>زیرنویس <span>اختیاری</span><input name="caption" maxLength={500} placeholder="توضیح کوتاه زیر تصویر"/></label>
      <div className="image-options"><label>چینش<select name="alignment" defaultValue="center"><option value="right">راست</option><option value="center">وسط</option><option value="left">چپ</option></select></label><label>اندازه<select name="width" defaultValue="100"><option value="100">تمام عرض</option><option value="75">۷۵ درصد</option><option value="50">نصف عرض</option></select></label></div>
      {busy&&<div className="upload-progress" role="status"><span style={{width:`${progress}%`}}/><small>در حال بارگذاری… {progress.toLocaleString("fa-IR")}٪</small></div>}
      {error&&<p className="editor-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-action" onClick={close} disabled={busy}>انصراف</button><button disabled={!file||busy}>{busy?"در حال بارگذاری…":"بارگذاری و درج تصویر"}</button></footer>
    </form>
  </dialog>;
}
