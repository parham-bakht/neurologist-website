import type {MetadataRoute} from "next";
import {absoluteUrl} from "../lib/site";

export default function robots():MetadataRoute.Robots{
  return {
    rules:{
      userAgent:"*",
      allow:"/",
      disallow:["/api/","/dashboard/","/login","/register"],
    },
    sitemap:absoluteUrl("/sitemap.xml"),
    host:absoluteUrl("/"),
  };
}
