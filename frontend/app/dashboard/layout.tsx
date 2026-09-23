import type {ReactNode} from "react";
import type {Metadata} from "next";
import "./polish.css";
import "../../components/articles/article-editor.css";
import "./articles/article-loading.css";

export const metadata:Metadata={title:"پنل کاربری",robots:{index:false,follow:false,nocache:true},alternates:{canonical:null}};

export default function DashboardLayout({children}:{children:ReactNode}){
  return <div className="dashboard-area">{children}</div>;
}
