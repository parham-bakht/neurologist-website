type IconName="article"|"patient"|"new-patient"|"calendar"|"inbox"|"records"|"users";

const paths:Record<IconName,string>={
  article:"M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M17 3l4 4-9 9-5 1 1-5 9-9ZM14 6l4 4",
  patient:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  "new-patient":"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM20 8v6M17 11h6",
  calendar:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 14h2M14 14h2M8 18h2",
  inbox:"M3 13h5l2 3h4l2-3h5M3 13l3-9h12l3 9v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6Z",
  records:"M8 3h8v4H8V3ZM8 5H5a2 2 0 0 0-2 2v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7a2 2 0 0 0-2-2h-3M7 12h10M7 16h7",
  users:"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v1M8.5 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 8v6M14 11h6",
};

export default function DashboardIcon({name}:{name:IconName}){
  return <svg className="dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
