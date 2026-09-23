import Link from "next/link";
import {redirect} from "next/navigation";
import {requireDashboardUser} from "../../auth";
import NewPatientForm from "./patient-form";

export default async function NewPatientPage(){
  const {user}=await requireDashboardUser();
  if(user.role==="user")redirect("/dashboard");
  return <main className="dashboard-subpage narrow-dashboard-page">
    <Link className="back-link" href="/dashboard">← بازگشت به پنل</Link>
    <header className="subpage-header"><p className="eyebrow">پرونده بیمار</p><h1>ثبت‌نام بیمار جدید</h1><p className="muted">برای دسترسی خانواده به سوابق ویزیت، حساب بیمار را ایجاد کنید.</p></header>
    <NewPatientForm/>
  </main>;
}
