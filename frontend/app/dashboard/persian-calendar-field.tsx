"use client";

import {useId,useMemo,useState} from "react";
import DatePicker,{DateObject} from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import Toolbar from "react-multi-date-picker/plugins/toolbar";
import persian from "react-date-object/calendars/persian";
import persianFa from "react-date-object/locales/persian_fa";
import {jalaliToGregorian} from "./jalali-date";

type Props={
  value?:string;
  includeTime?:boolean;
  dateName?:string;
  label?:string;
  onChange?:(value:string)=>void;
};

const pad=(value:number)=>String(value).padStart(2,"0");

function initialDate(value:string|undefined,includeTime:boolean){
  if(!value&&!includeTime)return null;
  const source=value?new Date(value.length===10?`${value}T00:00:00+03:30`:value):new Date();
  return new DateObject({date:source}).convert(persian,persianFa);
}

export default function PersianCalendarField({value,includeTime=false,dateName,label="تاریخ",onChange}:Props){
  const inputId=useId();
  const initial=useMemo(()=>initialDate(value,includeTime),[value,includeTime]);
  const [selected,setSelected]=useState<DateObject|null>(initial);
  const gregorianValue=useMemo(()=>{
    if(!selected)return "";
    const {gy,gm,gd}=jalaliToGregorian(selected.year,selected.month.number,selected.day);
    return `${gy}-${pad(gm)}-${pad(gd)}`;
  },[selected]);
  const plugins=includeTime?[
    <TimePicker key="time" position="bottom" hideSeconds header hStep={1} mStep={5}/>,
    <Toolbar key="toolbar" position="bottom" names={{today:"امروز",deselect:"پاک کردن",close:"بستن"}}/>,
  ]:[<Toolbar key="toolbar" position="bottom" names={{today:"امروز",deselect:"پاک کردن",close:"بستن"}}/>];

  return <div className="persian-calendar-field">
    <label htmlFor={inputId}>{label}</label>
    <div className="calendar-input-wrap"><span className="calendar-field-icon" aria-hidden="true">▦</span><DatePicker
      id={inputId}
      value={selected}
      onChange={date=>{const next=date as DateObject|null;setSelected(next);onChange?.(next?next.toDate().toISOString():"")}}
      calendar={persian}
      locale={persianFa}
      format={includeTime?"YYYY/MM/DD - HH:mm":"YYYY/MM/DD"}
      plugins={plugins}
      calendarPosition="bottom-right"
      inputClass="persian-calendar-input"
      containerClassName="persian-calendar-container"
      className="teal professional-persian-calendar"
      weekStartDayIndex={0}
      placeholder="انتخاب تاریخ از تقویم"
      editable={false}
    /></div>
    {includeTime&&selected&&<>
      <input type="hidden" name="jalali_year" value={selected.year}/>
      <input type="hidden" name="jalali_month" value={selected.month.number}/>
      <input type="hidden" name="jalali_day" value={selected.day}/>
      <input type="hidden" name="visit_time" value={`${pad(selected.hour)}:${pad(selected.minute)}`}/>
    </>}
    {!includeTime&&dateName&&<input type="hidden" name={dateName} value={gregorianValue}/>} 
    {includeTime&&<small className="calendar-help">تاریخ شمسی و ساعت را از تقویم انتخاب کنید.</small>}
  </div>;
}
