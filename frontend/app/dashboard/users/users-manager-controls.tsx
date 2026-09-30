"use client";

import {FormEvent,useMemo,useState} from "react";
import type {User} from "../types";
import ConfirmDialog from "../../../components/articles/ConfirmDialog";

export default function UsersManagerControls({initialUsers}:{initialUsers:User[]}){
  const [users,setUsers]=useState(initialUsers);
  const [query,setQuery]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [pendingId,setPendingId]=useState<string|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<User|null>(null);
  const [nameDrafts,setNameDrafts]=useState<Record<string,string>>(()=>Object.fromEntries(initialUsers.map(user=>[user.id,user.full_name])));
  const filtered=useMemo(()=>{
    const value=query.trim().toLocaleLowerCase("fa");
    return value?users.filter(user=>`${user.full_name} ${user.email} ${user.phone||""}`.toLocaleLowerCase("fa").includes(value)):users;
  },[users,query]);

  async function createUser(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;setBusy(true);setError("");setMessage("");
    const form=new FormData(event.currentTarget);
    try{
      const response=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:form.get("full_name"),email:form.get("email"),phone:form.get("phone")||null,password:form.get("password"),role:form.get("role")})});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.detail==="string"?data.detail:"ایجاد کاربر انجام نشد.");
      setUsers(current=>[data,...current]);setNameDrafts(current=>({...current,[data.id]:data.full_name}));event.currentTarget.reset();setMessage("حساب کاربری جدید ساخته شد.");
    }catch(caught){setError(caught instanceof Error?caught.message:"ایجاد کاربر انجام نشد.")}finally{setBusy(false)}
  }

  async function changeRole(user:User,role:User["role"]){
    if(role===user.role)return;setPendingId(user.id);setError("");setMessage("");
    try{
      const response=await fetch(`/api/admin/users/${user.id}/role`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({role})});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.detail==="string"?data.detail:"تغییر نقش انجام نشد.");
      setUsers(current=>current.map(item=>item.id===data.id?data:item));setMessage("نقش کاربر به‌روزرسانی شد.");
    }catch(caught){setError(caught instanceof Error?caught.message:"تغییر نقش انجام نشد.")}finally{setPendingId(null)}
  }

  async function changeName(user:User){
    const fullName=nameDrafts[user.id]?.trim();
    if(!fullName||fullName===user.full_name)return;
    setPendingId(user.id);setError("");setMessage("");
    try{
      const response=await fetch(`/api/admin/users/${user.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:fullName})});
      const data=await response.json();
      if(!response.ok)throw new Error(typeof data.detail==="string"?data.detail:"تغییر نام انجام نشد.");
      setUsers(current=>current.map(item=>item.id===data.id?data:item));setNameDrafts(current=>({...current,[data.id]:data.full_name}));setMessage("نام کاربر به‌روزرسانی شد.");
    }catch(caught){setError(caught instanceof Error?caught.message:"تغییر نام انجام نشد.")}finally{setPendingId(null)}
  }

  async function removeUser(){
    if(!deleteTarget)return;
    const user=deleteTarget;
    setPendingId(user.id);setError("");setMessage("");
    try{
      const response=await fetch(`/api/admin/users/${user.id}`,{method:"DELETE"});
      if(!response.ok){
        const data=await response.json().catch(()=>null);
        throw new Error(typeof data?.detail==="string"?data.detail:"حذف حساب انجام نشد.");
      }
      setUsers(current=>current.filter(item=>item.id!==user.id));
      setDeleteTarget(null);setMessage("حساب غیرفعال و از فهرست حذف شد؛ اطلاعات مرتبط محفوظ است.");
    }catch(caught){setError(caught instanceof Error?caught.message:"حذف حساب انجام نشد.")}finally{setPendingId(null)}
  }

  return <div className="users-management-layout">
    <section className="user-create-card"><div><p className="eyebrow">حساب جدید</p><h2>ثبت کاربر</h2><p>اطلاعات حساب و سطح دسترسی اولیه را وارد کنید.</p></div><form onSubmit={createUser}><label>نام و نام خانوادگی<input name="full_name" minLength={2} maxLength={120} required/></label><label>ایمیل<input name="email" type="email" dir="ltr" autoComplete="off" required/></label><label>شماره تماس <span>اختیاری</span><input name="phone" type="tel" dir="ltr" minLength={7} maxLength={20}/></label><label>رمز عبور<input name="password" type="password" dir="ltr" minLength={8} maxLength={128} autoComplete="new-password" required/></label><label>نقش<select name="role" defaultValue="user"><option value="user">بیمار</option><option value="doctor">پزشک</option><option value="admin">مدیر</option></select></label><button disabled={busy}>{busy?"در حال ایجاد…":"ایجاد حساب کاربری"}</button></form></section>
    <section className="users-list-card"><div className="section-heading"><div><p className="eyebrow">فهرست کاربران</p><h2>{users.length.toLocaleString("fa-IR")} حساب</h2></div><label className="user-search"><span className="sr-only">جست‌وجوی کاربران</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="نام، ایمیل یا تلفن"/></label></div>{message&&<p className="success" role="status">{message}</p>}{error&&<p className="error" role="alert">{error}</p>}<div className="managed-users-list">
      {filtered.map(user=><article key={user.id}><span className="managed-user-avatar">{user.full_name.trim().charAt(0)}</span><div className="managed-user-identity"><h3>{user.full_name}{user.is_superuser&&<small>مدیر اصلی</small>}</h3><p dir="ltr">{user.email}</p>{user.phone&&<span dir="ltr">{user.phone}</span>}</div><div className="managed-user-controls"><label>نام و نام خانوادگی<div className="managed-name-row"><input value={nameDrafts[user.id]??user.full_name} minLength={2} maxLength={120} disabled={pendingId===user.id} onChange={event=>setNameDrafts(current=>({...current,[user.id]:event.target.value}))}/><button type="button" className="secondary" disabled={pendingId===user.id||(nameDrafts[user.id]??user.full_name).trim()===user.full_name} onClick={()=>void changeName(user)}>ذخیره نام</button></div></label><label>سطح دسترسی<select value={user.role} disabled={pendingId===user.id||user.is_superuser} onChange={event=>void changeRole(user,event.target.value as User["role"])}><option value="user">بیمار</option><option value="doctor">پزشک</option><option value="admin">مدیر</option></select>{pendingId===user.id&&<small>در حال ذخیره…</small>}{user.is_superuser&&<small>محافظت‌شده</small>}</label><button type="button" className="managed-user-remove danger-text" disabled={pendingId===user.id||user.is_superuser} onClick={()=>setDeleteTarget(user)}>حذف حساب</button></div></article>)}
      {filtered.length===0&&<div className="empty-state"><h3>کاربری پیدا نشد</h3><p>عبارت جست‌وجو را تغییر دهید.</p></div>}
    </div></section>
    <ConfirmDialog open={Boolean(deleteTarget)} title="حساب حذف شود؟" description={deleteTarget?`حساب «${deleteTarget.full_name}» غیرفعال و از فهرست‌ها حذف می‌شود، اما سوابق مرتبط در پایگاه داده باقی می‌ماند.`:""} confirmLabel="بله، حساب حذف شود" tone="danger" busy={Boolean(deleteTarget&&pendingId===deleteTarget.id)} onCancel={()=>setDeleteTarget(null)} onConfirm={()=>void removeUser()}/>
  </div>;
}
