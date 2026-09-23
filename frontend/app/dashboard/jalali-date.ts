const pad=(value:number)=>String(value).padStart(2,"0");

export function jalaliToGregorian(jy:number,jm:number,jd:number){
  jy+=1595;
  let days=-355668+(365*jy)+(Math.floor(jy/33)*8)+Math.floor(((jy%33)+3)/4)+jd+(jm<7?(jm-1)*31:((jm-7)*30)+186);
  let gy=400*Math.floor(days/146097);
  days%=146097;
  if(days>36524){gy+=100*Math.floor(--days/36524);days%=36524;if(days>=365)days++}
  gy+=4*Math.floor(days/1461);
  days%=1461;
  if(days>365){gy+=Math.floor((days-1)/365);days=(days-1)%365}
  let gd=days+1;
  const monthDays=[0,31,((gy%4===0&&gy%100!==0)||gy%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
  let gm=1;
  while(gm<=12&&gd>monthDays[gm]){gd-=monthDays[gm];gm++}
  return {gy,gm,gd};
}

export function gregorianToJalali(gy:number,gm:number,gd:number){
  const cumulative=[0,31,59,90,120,151,181,212,243,273,304,334];
  const adjustedYear=gm>2?gy+1:gy;
  let days=355666+(365*gy)+Math.floor((adjustedYear+3)/4)-Math.floor((adjustedYear+99)/100)+Math.floor((adjustedYear+399)/400)+gd+cumulative[gm-1];
  let jy=-1595+(33*Math.floor(days/12053));
  days%=12053;
  jy+=4*Math.floor(days/1461);
  days%=1461;
  if(days>365){jy+=Math.floor((days-1)/365);days=(days-1)%365}
  const jm=days<186?1+Math.floor(days/31):7+Math.floor((days-186)/30);
  const jd=1+(days<186?days%31:(days-186)%30);
  return {jy,jm,jd};
}

export function daysInJalaliMonth(year:number,month:number){
  if(month<=6)return 31;
  if(month<=11)return 30;
  const gregorian=jalaliToGregorian(year,12,30);
  const roundTrip=gregorianToJalali(gregorian.gy,gregorian.gm,gregorian.gd);
  return roundTrip.jy===year&&roundTrip.jm===12&&roundTrip.jd===30?30:29;
}

export function visitDateParts(value?:string){
  const date=value?new Date(value):new Date();
  const dateParts=new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:"Asia/Tehran"}).formatToParts(date);
  const part=(type:Intl.DateTimeFormatPartTypes)=>Number(dateParts.find(item=>item.type===type)?.value||0);
  const timeParts=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Tehran"}).formatToParts(date);
  const timePart=(type:"hour"|"minute")=>Number(timeParts.find(item=>item.type===type)?.value||0);
  return {year:part("year"),month:part("month"),day:part("day"),time:`${pad(timePart("hour")%24)}:${pad(timePart("minute"))}`};
}

export function persianDateTimeToIso(form:FormData){
  const year=Number(form.get("jalali_year"));
  const month=Number(form.get("jalali_month"));
  const day=Number(form.get("jalali_day"));
  const time=String(form.get("visit_time")||"00:00");
  if(!year||!month||!day||day>daysInJalaliMonth(year,month))throw new Error("Invalid Persian date");
  const {gy,gm,gd}=jalaliToGregorian(year,month,day);
  return new Date(`${gy}-${pad(gm)}-${pad(gd)}T${time}:00+03:30`).toISOString();
}
