export default function DashboardLoading(){
  return <main className="dashboard-subpage dashboard-loading" aria-busy="true" aria-label="در حال دریافت اطلاعات پنل">
    <p className="eyebrow" role="status">در حال دریافت اطلاعات…</p>
    <div className="dashboard-skeleton skeleton-heading"/>
    <div className="dashboard-skeleton skeleton-description"/>
    <div className="dashboard-loading-grid">{[0,1,2].map(item=><div className="dashboard-skeleton skeleton-card" key={item}/>)}</div>
  </main>;
}
