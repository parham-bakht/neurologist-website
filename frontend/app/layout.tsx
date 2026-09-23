import type {Metadata,Viewport} from "next";

import {cookies} from "next/headers";
import SiteNavigation, {type NavUser} from "./site-navigation";
import "@fontsource-variable/vazirmatn/wght.css";
import "./globals.css";
import "./polish.css";
import "react-multi-date-picker/styles/colors/teal.css";
import {absoluteUrl,siteConfig} from "../lib/site";

export const metadata: Metadata = {
  metadataBase:new URL(siteConfig.url),
  title:{default:siteConfig.title,template:`%s | ${siteConfig.name}`},
  description:siteConfig.description,
  applicationName:siteConfig.name,
  authors:[{name:siteConfig.doctorName,url:absoluteUrl("/")}],
  creator:siteConfig.doctorName,
  publisher:siteConfig.doctorName,
  category:"health",
  referrer:"origin-when-cross-origin",
  robots:{index:true,follow:true,googleBot:{index:true,follow:true,"max-image-preview":"large","max-snippet":-1,"max-video-preview":-1}},
  openGraph:{type:"website",locale:siteConfig.locale,url:absoluteUrl("/"),siteName:siteConfig.name,title:siteConfig.title,description:siteConfig.description,images:[{url:absoluteUrl(siteConfig.defaultShareImagePath),width:1200,height:630,alt:siteConfig.title}]},
  twitter:{card:"summary_large_image",title:siteConfig.title,description:siteConfig.description,images:[absoluteUrl(siteConfig.defaultShareImagePath)]},
  icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/site-icon-192.png",type:"image/png",sizes:"192x192"}],apple:[{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}]},
  manifest:"/manifest.webmanifest",
  verification:{google:process.env.GOOGLE_SITE_VERIFICATION||undefined,other:process.env.BING_SITE_VERIFICATION?{"msvalidate.01":[process.env.BING_SITE_VERIFICATION]}:undefined},
};

export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#1d5961",colorScheme:"light"};

async function getNavUser():Promise<NavUser|null>{
  const token=(await cookies()).get("access_token")?.value;
  if(!token)return null;
  try{
    const response=await fetch(`${process.env.BACKEND_URL||"http://localhost:8000"}/api/v1/auth/me`,{headers:{Authorization:`Bearer ${token}`},cache:"no-store"});
    return response.ok?await response.json():null;
  }catch{return null}
}

export default async function RootLayout({children}:{children:React.ReactNode}) {
  const user=await getNavUser();
  return <html lang="fa" dir="rtl"><body><SiteNavigation user={user}/><div id="main-content" tabIndex={-1}>{children}</div></body></html>;
}
