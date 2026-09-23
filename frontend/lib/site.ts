const fallbackUrl="http://localhost:3000";

function normalizeBaseUrl(value:string|undefined){
  try{
    const url=new URL(value||fallbackUrl);
    url.pathname="/";
    url.search="";
    url.hash="";
    return url.toString().replace(/\/$/,"");
  }catch{return fallbackUrl}
}

export const siteConfig={
  name:"دکتر مهرداد بختیاری",
  title:"دکتر مهرداد بختیاری | فوق تخصص مغز و اعصاب کودکان",
  description:"ارزیابی، تشخیص، درمان و پیگیری بیماری‌های مغز و اعصاب کودکان و نوجوانان توسط دکتر مهرداد بختیاری.",
  url:normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL),
  locale:"fa_IR",
  language:"fa-IR",
  doctorName:"دکتر مهرداد بختیاری",
  specialty:"فوق تخصص مغز و اعصاب کودکان",
  logoPath:"/site-icon-512.png",
  defaultShareImagePath:"/og-default.jpg",
} as const;

export function absoluteUrl(path="/"){
  return new URL(path,`${siteConfig.url}/`).toString();
}

export function absoluteMediaUrl(path:string|null|undefined){
  if(!path)return null;
  if(/^https?:\/\//i.test(path))return path;
  const mediaOrigin=normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL||siteConfig.url);
  return new URL(path,`${mediaOrigin}/`).toString();
}

export function canonicalPath(path:string){
  const normalized=path.startsWith("/")?path:`/${path}`;
  return normalized.length>1?normalized.replace(/\/+$/,""):normalized;
}
