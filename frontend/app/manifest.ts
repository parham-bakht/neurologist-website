import type {MetadataRoute} from "next";

export default function manifest():MetadataRoute.Manifest{
  return {
    name:"دکتر مهرداد بختیاری | فوق تخصص مغز و اعصاب کودکان",
    short_name:"دکتر بختیاری",
    description:"وب‌سایت و پنل درمانی دکتر مهرداد بختیاری، فوق تخصص مغز و اعصاب کودکان.",
    start_url:"/",
    display:"standalone",
    background_color:"#f7fafc",
    theme_color:"#1d5961",
    lang:"fa",
    dir:"rtl",
    icons:[
      {src:"/site-icon-192.png",sizes:"192x192",type:"image/png"},
      {src:"/site-icon-512.png",sizes:"512x512",type:"image/png"},
    ],
  };
}
