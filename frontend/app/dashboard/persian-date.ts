const dateFormatter=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{
  year:"numeric",month:"long",day:"numeric",weekday:"long",timeZone:"Asia/Tehran"
});
const dateTimeFormatter=new Intl.DateTimeFormat("fa-IR-u-ca-persian",{
  year:"numeric",month:"long",day:"numeric",weekday:"long",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Tehran"
});

export function formatPersianDate(value:string,{withTime=true}:{withTime?:boolean}={}){
  return (withTime?dateTimeFormatter:dateFormatter).format(new Date(value));
}

export const visitStatusLabel={scheduled:"برنامه‌ریزی‌شده",completed:"انجام‌شده",cancelled:"لغوشده"} as const;

export function persianVisitDisplay(value:string){
  const date=new Date(value);
  const read=(options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat("fa-IR-u-ca-persian",{...options,timeZone:"Asia/Tehran"}).format(date);
  return {
    weekday:read({weekday:"long"}),
    day:read({day:"numeric"}),
    monthYear:read({month:"long",year:"numeric"}),
    time:read({hour:"2-digit",minute:"2-digit"}),
  };
}
