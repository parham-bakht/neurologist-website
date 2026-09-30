import Image from "next/image";
import Link from "next/link";
import type {Metadata} from "next";
import logo from "../website_logo.png";
import JsonLd from "../components/seo/JsonLd";
import {absoluteMediaUrl,absoluteUrl,siteConfig} from "../lib/site";
import type {Article} from "../types/article";
import ContactForm from "./contact-form";

const backend=process.env.BACKEND_URL||"http://localhost:8000";

export const metadata:Metadata={
  title:{absolute:siteConfig.title},
  description:siteConfig.description,
  alternates:{canonical:"/"},
  openGraph:{type:"website",url:absoluteUrl("/"),title:siteConfig.title,description:siteConfig.description,images:[{url:absoluteUrl(siteConfig.defaultShareImagePath),width:1200,height:630,alt:siteConfig.title}]},
  twitter:{card:"summary_large_image",title:siteConfig.title,description:siteConfig.description,images:[absoluteUrl(siteConfig.defaultShareImagePath)]},
};

type IconName="evaluation"|"plan"|"follow"|"family"|"seizure"|"headache"|"growth"|"movement"|"sleep"|"eeg"|"neuro"|"check"|"file"|"medicine";

function LineIcon({name}:{name:IconName}){
  const common={fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  if(name==="check")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="m5 12 4 4L19 6"/></svg>;
  if(name==="family")return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="9" cy="8" r="3"/><circle {...common} cx="17" cy="10" r="2"/><path {...common} d="M3.5 19c.5-4 2.2-6 5.5-6s5 2 5.5 6M14 15c3-.8 5.3.5 6.2 3.5"/></svg>;
  if(name==="headache")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 20v-3.5c-2-1.5-3-3.7-3-6.2A7 7 0 0 1 12 3c4 0 7 3 7 7 0 2.4-1 4-2.8 5.3V20"/><path {...common} d="m9 7 2 2-2 2 3 2"/></svg>;
  if(name==="sleep")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M19 15.5A7.7 7.7 0 0 1 8.5 5 7.8 7.8 0 1 0 19 15.5Z"/><path {...common} d="M16 4h4l-4 4h4"/></svg>;
  if(name==="eeg")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M3 13h4l2-5 3 10 2-7 2 4h5"/><path {...common} d="M5 4h14v16H5"/></svg>;
  if(name==="medicine")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M8 4h8v4l2 3v8H6v-8l2-3V4Z"/><path {...common} d="M9 14h6M12 11v6"/></svg>;
  if(name==="file")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M6 3h8l4 4v14H6V3Z"/><path {...common} d="M14 3v5h4M9 12h6M9 16h6"/></svg>;
  if(name==="growth")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M5 19c6 0 11-5 11-11M11 8h5v5"/><circle {...common} cx="7" cy="7" r="2"/><path {...common} d="M7 9v5m-2 4 2-4 3 4"/></svg>;
  if(name==="movement")return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...common} cx="12" cy="5" r="2"/><path {...common} d="m8 20 2-6-3-3 3-3 4 3 3-2M10 14l4 3 2 3"/></svg>;
  if(name==="seizure")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M9 20H6v-4a7 7 0 1 1 11 1v3h-4"/><path {...common} d="m11 6-2 4h3l-2 5 5-6h-3l2-3"/></svg>;
  if(name==="follow")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M20 12a8 8 0 1 1-2.3-5.7L20 9"/><path {...common} d="M20 4v5h-5"/></svg>;
  if(name==="plan")return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M7 3h10v18H7zM9 7h6M9 11h6M9 15h3"/><path {...common} d="m14 16 1 1 2-3"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...common} d="M12 20c-5 0-8-3.3-8-7.5S7 4 12 4s8 4.2 8 8.5S17 20 12 20Z"/><path {...common} d="M12 4v16M8 7c2 1 2 3 0 4m8-4c-2 1-2 3 0 4M8 15c2-1 2-2 2-4m6 4c-2-1-2-2-2-4"/></svg>;
}

const services=[
  ["seizure","صرع و تشنج کودکان","بررسی انواع تشنج، حملات مشکوک و پیگیری درمان صرع در کودکان و نوجوانان."],
  ["headache","سردرد و میگرن","ارزیابی سردردهای مکرر، میگرن و علائم همراه در کودکان و نوجوانان."],
  ["growth","اختلالات رشد عصبی","بررسی مشکلات و تأخیرهای مرتبط با رشد و تکامل سیستم عصبی کودک."],
  ["movement","اختلالات حرکتی","ارزیابی تیک، لرزش، حرکات غیرارادی و سایر اختلالات حرکتی."],
  ["sleep","مشکلات خواب","بررسی مشکلات خواب در مواردی که نیاز به ارزیابی از نظر اختلالات عصبی وجود دارد."],
  ["neuro","سایر بیماری‌های مغز و اعصاب کودکان","بررسی سایر علائم و بیماری‌های مرتبط با مغز، اعصاب و سیستم عصبی کودکان و نوجوانان."],
] as const;

const symptoms:[IconName,string][]=([
  ["seizure","تشنج یا حرکات غیرطبیعی بدن"],
  ["headache","سردردهای شدید یا مکرر"],
  ["growth","تأخیر در رشد و تکامل"],
  ["movement","ضعف یا اختلال در حرکت"],
  ["neuro","تیک‌ها و حرکات غیرارادی"],
  ["sleep","مشکلات غیرمعمول خواب"],
  ["follow","از دست دادن هوشیاری یا حملات مشکوک"],
  ["evaluation","تغییر قابل توجه در توانایی‌های حرکتی یا عصبی"],
]);
const steps=[
  ["۰۱","ارسال درخواست","نام، شماره تماس و توضیح کوتاهی درباره شرایط کودک ثبت کنید."],
  ["۰۲","هماهنگی ویزیت","پس از دریافت درخواست، برای هماهنگی و راهنمایی درباره مراحل بعدی با شما تماس گرفته می‌شود."],
  ["۰۳","ویزیت و ارزیابی","علائم، سوابق پزشکی، معاینه و بررسی‌های قبلی کودک توسط پزشک ارزیابی می‌شوند."],
  ["۰۴","پیگیری درمان","اطلاعات ویزیت، داروهای ثبت‌شده و توصیه‌های پزشک از طریق پرونده و پنل بیمار قابل پیگیری خواهند بود."],
];

function DoctorProfile(){
  return <article className="doctor-profile-card">
    <div className="doctor-profile-image"><Image src="/doctor-mehrdad-bakhtiari.png" alt="دکتر مهرداد بختیاری" fill sizes="(max-width: 700px) 96px, (max-width: 850px) 160px, 200px"/></div>
    <div className="doctor-profile-identity"><div><span className="doctor-profile-label">پروفایل پزشک</span><h3>دکتر مهرداد بختیاری</h3><p>فوق تخصص مغز و اعصاب کودکان</p></div><span className="doctor-profile-experience"><strong>+۲۰ سال</strong> سابقه طبابت</span></div>
    <p className="doctor-profile-bio">دکتر مهر‌داد بختیاری، فوق‌تخصص مغز و اعصاب کودکان و نوجوانان، با تمرکز بر تشخیص دقیق، درمان و پیگیری اختلالات نورولوژیک در کودکان و نوجوانان فعالیت می‌کند. رویکرد ایشان بر ارزیابی جامع کودک، توجه به روند رشد و تکامل، بررسی دقیق علائم و یافته‌های بالینی و طراحی برنامه درمانی متناسب با شرایط هر کودک است. ارتباط مؤثر با خانواده و همراهی آنان در مسیر تشخیص، درمان و پیگیری، بخش مهمی از این رویکرد را تشکیل می‌دهد.</p>
    <dl className="doctor-profile-facts"><div><dt><LineIcon name="file"/>حوزه تخصصی</dt><dd>مغز و اعصاب کودکان و نوجوانان</dd></div><div><dt><LineIcon name="follow"/>شیوه مراقبت</dt><dd>ارزیابی، درمان و پیگیری منظم</dd></div><div><dt><LineIcon name="check"/>کد نظام پزشکی</dt><dd dir="ltr">73349</dd></div></dl>
    <div className="doctor-profile-highlights" aria-label="رویکرد درمانی"><span><LineIcon name="check"/>ارزیابی متناسب با شرایط هر کودک</span><span><LineIcon name="check"/>توضیح روشن مسیر درمان برای والدین</span><span><LineIcon name="check"/>پیگیری منظم روند درمان</span></div>
  </article>;
}

function BrandVisual(){
  return <div className="hero-logo-showcase" aria-label="نشان دکتر مهرداد بختیاری"><div className="hero-logo-orbit"><span/><span/><span/><Image src={logo} alt="نشان دکتر مهرداد بختیاری" priority sizes="(max-width: 700px) 240px, 430px"/></div></div>;
}

export default async function Home(){
  let articles:Article[]=[];
  try{const response=await fetch(`${backend}/api/v1/articles`,{next:{revalidate:300}});if(response.ok)articles=(await response.json()).slice(0,3)}catch{}
  const structuredData={"@context":"https://schema.org","@graph":[
    {"@type":"WebSite","@id":`${absoluteUrl("/")}#website`,name:siteConfig.name,url:absoluteUrl("/"),description:siteConfig.description,inLanguage:siteConfig.language},
    {"@type":"Person","@id":`${absoluteUrl("/")}#physician`,name:siteConfig.doctorName,url:absoluteUrl("/"),image:absoluteUrl("/doctor-mehrdad-bakhtiari.png"),jobTitle:siteConfig.specialty,description:siteConfig.description,knowsAbout:services.map(([,title])=>title)},
  ]};
  return <><JsonLd data={structuredData}/><main className="premium-home" id="top">
    <section className="premium-hero" aria-labelledby="hero-title">
      <div className="premium-hero-visual"><BrandVisual/></div>
      <div className="premium-hero-copy"><p className="home-kicker">مراقبت تخصصی از سلامت مغز و سیستم عصبی کودکان</p><h1 id="hero-title">بررسی دقیق، درمان فوق تخصصی و همراهی با خانواده در مسیر سلامت کودک</h1><div className="doctor-intro"><strong>دکتر مهرداد بختیاری</strong><span>فوق تخصص مغز و اعصاب کودکان</span></div><p className="home-lead">بررسی و درمان تخصصی بیماری‌های مغز و اعصاب کودکان و نوجوانان، از تشنج و سردرد تا اختلالات رشد عصبی، حرکتی و مشکلات خواب؛ با رویکردی علمی، دقیق و متناسب با شرایط هر کودک.</p><div className="home-actions"><a className="button primary-cta" href="#contact">درخواست مشاوره</a><a className="button quiet-button" href="#symptoms">علائمی که باید جدی گرفته شوند</a></div><div className="hero-trust"><span><LineIcon name="check"/>ارزیابی تخصصی کودکان و نوجوانان</span><span><LineIcon name="check"/>پیگیری منظم روند درمان</span><span><LineIcon name="check"/>دسترسی به سوابق و برنامه درمانی</span></div></div>
    </section>

    <section className="home-section symptom-cards-section" id="symptoms" aria-labelledby="symptom-title"><div className="home-section-heading split-heading"><div><p className="home-kicker">راهنمای والدین</p><h2 id="symptom-title">چه زمانی باید به متخصص مغز و اعصاب مراجعه شود</h2></div><p>برخی علائم ممکن است گذرا باشند، اما تکرار، شدت گرفتن یا همراه شدن آن‌ها با تغییرات دیگر می‌تواند نیازمند بررسی پزشکی باشد. در صورت مشاهده این نشانه‌ها، ارزیابی تخصصی می‌تواند به تشخیص علت کمک کند.</p></div><div className="symptom-card-grid">{symptoms.map(([icon,title])=><article key={title}><span className="line-icon"><LineIcon name={icon}/></span><h3>{title}</h3></article>)}</div><div className="symptom-cards-action"><a className="button quiet-button" href="#contact">درخواست مشاوره</a></div></section>

    <section className="home-section about-section" id="about" aria-labelledby="about-title"><header className="about-intro"><p className="home-kicker">آشنایی با پزشک</p><h2 id="about-title">درباره دکتر مهرداد بختیاری</h2><p>معرفی کوتاه پزشک، حوزه تخصصی و رویکرد مراقبت از کودک.</p></header><DoctorProfile/></section>

    <section className="home-section process-section" aria-labelledby="process-title"><div className="home-section-heading centered-heading"><div><p className="home-kicker">مسیر مراجعه</p><h2 id="process-title">از درخواست مشاوره تا پیگیری درمان</h2><p>فرایند مراجعه به شکلی طراحی شده است که والدین بتوانند درخواست خود را به‌سادگی ثبت کنند و پس از مراجعه نیز اطلاعات مهم درمان کودک را در اختیار داشته باشند.</p></div></div><div className="process-steps">{steps.map(([number,title,text])=><article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="home-section articles-home-section" id="articles" aria-labelledby="articles-title">
      <div className="home-section-heading split-heading"><div><p className="home-kicker">دانش برای تصمیم بهتر</p><h2 id="articles-title">راهنمای والدین برای شناخت بهتر سلامت عصبی کودک</h2></div><p>مطالب آموزشی درباره بیماری‌ها، علائم و موضوعات مرتبط با مغز و اعصاب کودکان برای کمک به والدین در شناخت بهتر شرایط فرزندشان.</p></div>
      {articles.length>0?
        <div className="premium-article-grid">{articles.map((article,index)=>{const asset=article.media.find(item=>item.url===article.featured_image_url);return <Link href={`/articles/${article.slug}`} className="premium-article-card" key={article.id}><div className={`premium-article-cover cover-${index+1}`}>{article.featured_image_url&&<img src={absoluteMediaUrl(article.featured_image_url)||undefined} alt={asset?.alt_text||article.title} width={asset?.width||undefined} height={asset?.height||undefined} loading="lazy" decoding="async"/>}{!article.featured_image_url&&<LineIcon name={index===0?"seizure":index===1?"headache":"eeg"}/>}<span>{article.category?.name||"آموزش والدین"}</span></div><div><time dateTime={article.published_at||article.updated_at}>{new Date(article.published_at||article.updated_at).toLocaleDateString("fa-IR-u-ca-persian",{year:"numeric",month:"long",day:"numeric"})}</time><h3>{article.title}</h3><p>{article.excerpt}</p><strong>ادامه مطلب ←</strong></div></Link>})}</div>:
        <div className="premium-article-grid">{[["seizure","تشنج در کودکان؛ چه زمانی باید به پزشک مراجعه کنیم؟","آشنایی با نشانه‌های مهم تشنج و مواردی که ممکن است نیاز به ارزیابی تخصصی داشته باشند."],["headache","سردردهای مکرر در کودکان چه علتی دارند؟","نگاهی به دلایل سردرد در کودکان و علائمی که بهتر است مورد بررسی قرار گیرند."],["eeg","EEG یا نوار مغز چیست و چگونه انجام می‌شود؟","راهنمایی ساده برای والدینی که برای کودکشان نوار مغز درخواست شده است."]].map(([icon,title,text],index)=><article className="premium-article-card placeholder-article" key={title}><div className={`premium-article-cover cover-${index+1}`}><LineIcon name={icon as IconName}/><span>آموزش والدین</span></div><div><time>مطلب آموزشی</time><h3>{title}</h3><p>{text}</p><strong>به‌زودی</strong></div></article>)}</div>}
      <div className="centered-action"><Link className="button quiet-button" href="/articles">مشاهده همه مقالات</Link></div>
    </section>

    <section className="home-section faq-section" id="faq" aria-labelledby="faq-title"><div className="faq-intro"><p className="home-kicker">پرسش‌های رایج</p><h2 id="faq-title">سوالات متداول والدین</h2><p>پاسخ کوتاه به برخی از سوالات رایج درباره مراجعه، ویزیت و پیگیری درمان.</p></div><div className="faq-list"><details><summary>برای اولین ویزیت چه مدارکی همراه داشته باشیم؟</summary><p>در صورت وجود، سوابق پزشکی کودک، نسخه‌های قبلی، نتایج آزمایش‌ها، MRI، CT، EEG و فهرست داروهای مصرفی را همراه داشته باشید.</p></details><details><summary>آیا برای مراجعه حتماً نیاز به نوار مغز است؟</summary><p>خیر. انجام EEG برای همه بیماران ضروری نیست و نیاز به آن بر اساس شرایط بیمار و نظر پزشک مشخص می‌شود.</p></details><details><summary>آیا می‌توانم سوابق ویزیت کودک را مشاهده کنم؟</summary><p>اطلاعات ثبت‌شده مربوط به ویزیت‌ها و روند درمان از طریق پنل بیمار قابل مشاهده خواهد بود.</p></details><details><summary>چگونه درخواست مشاوره ثبت کنم؟</summary><p>فرم درخواست مشاوره را تکمیل کنید. پس از دریافت درخواست، برای هماهنگی و راهنمایی درباره مراحل بعدی با شما تماس گرفته می‌شود.</p></details></div></section>

    <div id="contact" className="home-contact-wrap"><ContactForm/></div>

    <footer className="home-footer"><div className="footer-main"><div className="footer-brand"><div><Image src={logo} alt="نشان دکتر مهرداد بختیاری"/><span><strong>دکتر مهرداد بختیاری</strong><small>فوق تخصص مغز و اعصاب کودکان</small></span></div><p>ارزیابی، درمان و پیگیری تخصصی بیماری‌های مغز و اعصاب کودکان و نوجوانان.</p></div><div><h3>دسترسی سریع</h3><a href="#top">خانه</a><a href="#about">درباره پزشک</a><a href="#symptoms">علائم مهم</a><Link href="/articles">مقالات</Link><a href="#faq">سوالات متداول</a></div><div><h3>خدمات تخصصی</h3><span>صرع و تشنج کودکان</span><span>سردرد و میگرن</span><span>اختلالات رشد عصبی</span><span>اختلالات حرکتی</span><span>بررسی EEG</span></div><div><h3>اطلاعات تماس</h3><span>برای هماهنگی مراجعه، درخواست مشاوره خود را ثبت کنید.</span><a className="footer-consultation" href="#contact">ثبت درخواست مشاوره ←</a></div></div><div className="footer-bottom"><span>تمامی حقوق این وب‌سایت برای دکتر مهرداد بختیاری محفوظ است.</span><div><a href="#contact">ارتباط با مطب</a><i aria-hidden="true">|</i><Link href="/login">پنل بیمار</Link></div></div></footer>
  </main></>;
}
