"use client";

export default function ArticlesError({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="dashboard-shell article-library-page"><section className="editor-state-card" role="alert"><span aria-hidden="true">!</span><h1>بارگذاری بخش مقالات انجام نشد</h1><p>ارتباط با سرور برقرار نشد. دوباره تلاش کنید.</p><button className="button" onClick={reset}>تلاش دوباره</button></section></main>;
}
