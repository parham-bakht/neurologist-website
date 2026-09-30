"use client";

import Image from "next/image";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import logo from "../website_logo.png";

export type NavUser = {full_name:string; email:string; role:"user"|"doctor"|"admin"; is_superuser:boolean};

function Brand(){
  return <Link href="/" className="brand" aria-label="صفحه اصلی دکتر مهرداد بختیاری"><Image className="brand-logo" src={logo} alt="" width={42} height={42} priority/><span className="doctor-brand-copy"><strong>دکتر مهرداد بختیاری</strong><small>فوق تخصص مغز و اعصاب کودکان</small></span></Link>;
}

export default function SiteNavigation({user}:{user:NavUser|null}){
  const pathname=usePathname();
  const [hash,setHash]=useState("");
  const menu=useRef<HTMLDetailsElement>(null);
  const isStaff=user?.role==="admin"||user?.role==="doctor";
  useEffect(()=>{
    const update=()=>setHash(window.location.hash);
    update();
    window.addEventListener("hashchange",update);
    return ()=>window.removeEventListener("hashchange",update);
  },[pathname]);
  useEffect(()=>{
    if(pathname!=="/"||!hash||hash==="#top"||hash==="#main-content")return;
    const targetId=decodeURIComponent(hash.slice(1));
    const scrollToTarget=()=>{
      const target=document.getElementById(targetId);
      if(!target)return false;
      target.scrollIntoView({block:"start"});
      return true;
    };
    if(scrollToTarget())return;
    const root=document.getElementById("main-content")||document.body;
    const observer=new MutationObserver(()=>{if(scrollToTarget())observer.disconnect();});
    observer.observe(root,{childList:true,subtree:true});
    const timeout=window.setTimeout(()=>observer.disconnect(),15000);
    return ()=>{observer.disconnect();window.clearTimeout(timeout);};
  },[pathname,hash]);
  useEffect(()=>{
    if(menu.current)menu.current.open=false;
  },[pathname,hash]);
  useEffect(()=>{
    const dismiss=(event:PointerEvent)=>{if(menu.current&&!menu.current.contains(event.target as Node))menu.current.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"&&menu.current?.open){menu.current.open=false;menu.current.querySelector("summary")?.focus();}};
    document.addEventListener("pointerdown",dismiss);
    document.addEventListener("keydown",escape);
    return ()=>{document.removeEventListener("pointerdown",dismiss);document.removeEventListener("keydown",escape);};
  },[]);
  function item(href:string,label:string,icon?:string,extra=""){
    const active=href.includes("#")?pathname==="/"&&hash===href.slice(1):href==="/"?pathname==="/"&&(!hash||hash==="#top"||hash==="#main-content"):pathname===href||pathname.startsWith(`${href}/`);
    return <Link href={href} className={`nav-item ${extra}`} aria-current={active?(href.includes("#")?"location":"page"):undefined} onClick={()=>{if(menu.current)menu.current.open=false;if(href.includes("#"))setHash(href.slice(1));else setHash("");}}>{icon&&<span className={`nav-icon nav-icon-${icon}`} aria-hidden="true"/>}<span>{label}</span></Link>;
  }
  return <>
    <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
    <header className="mobile-brand-header"><Brand/></header>
    <nav aria-label="ناوبری اصلی" className={`site-navigation ${user?"authenticated-nav":"public-site-nav"}`}>
      <Brand/>
      <div className={`navlinks ${isStaff?"staff-navlinks":""} ${!user?"public-navlinks":""}`}>
        {item("/","خانه","home","home-link")}
        {!user&&<>{item("/about","درباره پزشک","account","public-anchor mobile-about-link")}{item("/#symptoms","علائم مهم",undefined,"public-anchor")}</>}
        {item("/articles","مقالات","articles","articles-link")}
        {!user&&item("/#faq","سوالات متداول",undefined,"public-anchor")}
        {user?<>
          {!isStaff&&item("/#consultation-fields","درخواست مشاوره","consultation","consultation-link")}
          {item("/dashboard","داشبورد","dashboard")}
          <details className="profile-menu" ref={menu}><summary aria-label={`منوی حساب ${user.full_name}`}><span className="profile-avatar">{user.full_name.trim().charAt(0)}</span><span className="nav-icon nav-icon-account" aria-hidden="true"/><span className="profile-name">{user.full_name}</span><span className="mobile-nav-label">حساب</span></summary><div className="profile-popover"><div><strong>{user.full_name}</strong><span dir="ltr">{user.email}</span><span className="profile-role">{user.is_superuser?"مدیر اصلی":user.role==="admin"?"مدیر":isStaff?"پزشک":"بیمار"}</span></div><Link href="/dashboard" onClick={()=>{if(menu.current)menu.current.open=false;}}>ورود به داشبورد</Link><form action="/api/auth/logout" method="post"><button>خروج از حساب</button></form></div></details>
        </>:<>{item("/login","ورود","login","login-link")}{item("/#consultation-fields","درخواست مشاوره","consultation","button signup-link consultation-link")}</>}
      </div>
    </nav>
  </>;
}
