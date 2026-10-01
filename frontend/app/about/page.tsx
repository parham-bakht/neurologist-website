import Image from "next/image";
import Link from "next/link";
import type {Metadata} from "next";
import JsonLd from "../../components/seo/JsonLd";
import {absoluteUrl,siteConfig} from "../../lib/site";
import "./about.css";

const title="درباره دکتر مهرداد بختیاری";
const description="نگاهی به مسیر حرفه‌ای دکتر مهرداد بختیاری و استادانی که در شکل‌گیری نگاه علمی، بالینی و اخلاق حرفه‌ای ایشان نقش داشته‌اند.";

export const metadata:Metadata={
  title,
  description,
  alternates:{canonical:"/about"},
  openGraph:{type:"profile",url:absoluteUrl("/about"),title:`${title} | ${siteConfig.name}`,description,images:[{url:absoluteUrl("/doctor-mehrdad-bakhtiari.png"),alt:"دکتر مهرداد بختیاری"}]},
  twitter:{card:"summary_large_image",title:`${title} | ${siteConfig.name}`,description,images:[absoluteUrl("/doctor-mehrdad-bakhtiari.png")]},
};

const professors=[
  ["استاد دکتر پروانه کریم‌زاده","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در نورومتابولیک و بیماری‌های ارثی سیستم عصبی"],
  ["استاد دکتر محمدمهدی ناصحی","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در بیماری‌های دمیلین‌کننده و Multiple Sclerosis"],
  ["استاد دکتر محمدمهدی تقدیری","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در صرع و اختلالات تشنجی کودکان"],
  ["استاد دکتر محسن جوادزاده","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در EEG، LTM و نوروفیزیولوژی"],
  ["استاد دکتر فرزاد احمدآبادی","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در نورولوژی بالینی و نوروموسکولار"],
  ["استاد دکتر نرگس جعفری","فوق‌تخصص نورولوژی کودکان، با فعالیت برجسته در نوروموسکولار و بیماری‌های عصبی ـ عضلانی"],
  ["استاد دکتر فائزه قناعتی","فوق‌تخصص نورولوژی کودکان، با فعالیت در حوزه نورولوژی کودکان و رویکردهای نوین این رشته"],
] as const;

export default function AboutDoctorPage(){
  return <>
    <JsonLd data={{"@context":"https://schema.org","@type":"AboutPage",name:title,url:absoluteUrl("/about"),description,mainEntity:{"@type":"Person",name:siteConfig.doctorName,image:absoluteUrl("/doctor-mehrdad-bakhtiari.png"),jobTitle:siteConfig.specialty}}}/>
    <main className="doctor-about-page">
      <nav className="doctor-about-breadcrumbs" aria-label="مسیر صفحه"><Link href="/">خانه</Link><span aria-hidden="true">←</span><span aria-current="page">درباره پزشک</span></nav>

      <header className="doctor-about-hero">
        <div className="doctor-about-portrait">
          <Image src="/doctor-mehrdad-bakhtiari.png" alt="دکتر مهرداد بختیاری" fill sizes="(max-width: 760px) 82vw, 330px" priority/>
        </div>
        <div className="doctor-about-intro">
          <p className="doctor-about-eyebrow">درباره پزشک</p>
          <h1>اساتیدی که در مسیر حرفه‌ای‌ام از محضرشان آموخته‌ام</h1>
          <p>بخش مهمی از مسیر حرفه‌ای من در نورولوژی کودکان، در کنار استادانی شکل گرفت که هر یک از چهره‌های برجسته این رشته و صاحب تجربه و جایگاه علمی ارزشمند در حوزه تخصصی خود هستند.</p>
        </div>
      </header>

      <article className="doctor-about-story">
        <section className="doctor-about-copy" aria-label="مسیر علمی و حرفه‌ای">
          <p>آغاز این مسیر برای من با افتخار شاگردی استاد فقید، دکتر محمد غفرانی، همراه بود؛ نخستین فوق‌تخصص مغز و اعصاب کودکان ایران و از بنیان‌گذاران و پیشگامان شکل‌گیری و توسعه نورولوژی کودکان در کشور. ایشان با سال‌ها فعالیت آموزشی، درمانی و پژوهشی و با تربیت نسل‌های متعددی از پزشکان و متخصصان، نقشی ماندگار در شکل‌گیری و گسترش این رشته در ایران ایفا کردند.</p>
          <p>افتخار داشتم در نخستین سال مسیر آموزشی خود، حدود یک سال در محضر ایشان آموزش ببینم؛ تجربه‌ای که برای من نه‌تنها از نظر علمی، بلکه از منظر نگاه بالینی، اخلاق حرفه‌ای، مسئولیت‌پذیری و نحوه مواجهه با کودک و خانواده نیز ارزشمند و ماندگار است.</p>
          <p>در ادامه این مسیر، در دانشگاه علوم پزشکی شهید بهشتی و بیمارستان کودکان مفید، فرصت بهره‌مندی از دانش و تجربه استادان گرانقدری را داشتم که هر یک، در کنار تخصص خود در نورولوژی کودکان، در حوزه‌ای ویژه از این رشته نیز فعالیت و تجربه ارزشمندی دارند:</p>
        </section>

        <section className="doctor-about-professors" aria-label="استادان نورولوژی کودکان">
          {professors.map(([name,specialty])=><div className="doctor-about-professor" key={name}><h2>{name}</h2><p>{specialty}</p></div>)}
        </section>

        <section className="doctor-about-copy doctor-about-closing" aria-label="سخن پایانی">
          <p>همچنین افتخار آشنایی با استاد دکتر تنکابنی را در این مجموعه داشتم؛ اگرچه در بخشی از دوره آموزشی من، ایشان خارج از کشور حضور داشتند.</p>
          <p>هر یک از این استادان، به شیوه‌ای متفاوت، بخشی از نگاه علمی، تفکر بالینی و اخلاق حرفه‌ای مرا شکل دادند.</p>
          <p>آنچه امروز در مسیر تشخیص، درمان و همراهی با کودکان و خانواده‌های آنان می‌آموزم، حاصل سال‌ها آموزش، مشاهده، پرسش و تجربه در کنار این استادان و بزرگان نورولوژی کودکان است.</p>
          <p className="doctor-about-final">و من خود را همچنان شاگرد این مکتب می‌دانم.</p>
        </section>
      </article>
    </main>
  </>;
}
