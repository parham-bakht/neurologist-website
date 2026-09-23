"use client";

import {useEffect,useState} from "react";
import {ApiError,mediaApi} from "../../lib/api/articles";
import {validateArticleImage} from "../../lib/articles/image-validation";
import type {ArticleMedia} from "../../types/article";

const publicOrigin=process.env.NEXT_PUBLIC_BACKEND_URL||"http://localhost:8000";
const src=(url:string)=>url.startsWith("http")?url:`${publicOrigin}${url}`;

export default function FeaturedImageField({value,onChange,onUploaded}:{value:string|null;onChange:(value:string|null)=>void;onUploaded:(media:ArticleMedia)=>void}){
  const [preview,setPreview]=useState<string|null>(value);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState(0);
  const [error,setError]=useState("");
  useEffect(()=>setPreview(value),[value]);
  async function upload(file:File|undefined){
    if(!file)return;
    const validationError=validateArticleImage(file);
    if(validationError){setError(validationError);return}
    setBusy(true);setError("");setProgress(0);
    const local=URL.createObjectURL(file);setPreview(local);
    try{const media=await mediaApi.uploadImage(file,{},setProgress);onUploaded(media);onChange(media.url);setPreview(media.url)}
    catch(caught){setPreview(value);setError(caught instanceof ApiError?caught.message:"بارگذاری تصویر انجام نشد.")}
    finally{URL.revokeObjectURL(local);setBusy(false)}
  }
  return <div className="featured-image-field">
    <label className={`featured-dropzone ${preview?"has-image":""}`} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();void upload(event.dataTransfer.files[0])}}>
      {preview?<img src={preview.startsWith("blob:")?preview:src(preview)} alt="پیش‌نمایش تصویر شاخص"/>:<><strong>تصویر شاخص</strong><span>برای انتخاب کلیک کنید یا تصویر را اینجا رها کنید</span><small>JPEG، PNG یا WebP تا ۱۰ مگابایت</small></>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>void upload(event.target.files?.[0])} disabled={busy}/>
      {busy&&<div className="cover-progress"><span style={{width:`${progress}%`}}/></div>}
    </label>
    {preview&&<div className="featured-actions"><label className="text-button">جایگزینی<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>void upload(event.target.files?.[0])} disabled={busy}/></label><button type="button" className="text-button danger-text" onClick={()=>{onChange(null);setPreview(null)}} disabled={busy}>حذف از مقاله</button></div>}
    {error&&<p className="editor-error" role="alert">{error}</p>}
  </div>;
}
