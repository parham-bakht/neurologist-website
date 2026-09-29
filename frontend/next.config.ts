import type { NextConfig } from "next";

const configuredSiteUrl=process.env.NEXT_PUBLIC_SITE_URL;
let canonicalHost="";
try{canonicalHost=configuredSiteUrl?new URL(configuredSiteUrl).hostname:""}catch{}
const alternateHost=canonicalHost&&!canonicalHost.startsWith("www.")?`www.${canonicalHost}`:"";

const nextConfig: NextConfig = {
  output:"standalone",
  // Keep production builds from overwriting a running development server's files.
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === "production" ? ".next-build" : ".next"),
  devIndicators: false,
  poweredByHeader:false,
  compress:true,
  trailingSlash:false,
  images:{formats:["image/avif","image/webp"]},
  async headers(){
    const noindex=[{key:"X-Robots-Tag",value:"noindex, nofollow, noarchive"}];
    return [
      {source:"/:path*",headers:[
        {key:"X-Content-Type-Options",value:"nosniff"},
        {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
        {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"},
      ]},
      {source:"/dashboard/:path*",headers:noindex},
      {source:"/login",headers:noindex},
      {source:"/register",headers:noindex},
      {source:"/api/:path*",headers:noindex},
    ];
  },
  async redirects(){
    if(!configuredSiteUrl||!alternateHost)return [];
    return [{source:"/:path*",has:[{type:"host",value:alternateHost}],destination:`${configuredSiteUrl.replace(/\/$/,"")}/:path*`,permanent:true}];
  },
};

export default nextConfig;
