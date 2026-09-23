export type SaveState="saved"|"dirty"|"saving"|"error";
const labels:Record<SaveState,string>={saved:"ذخیره شد",dirty:"تغییرات ذخیره‌نشده",saving:"در حال ذخیره…",error:"ذخیره خودکار ناموفق بود"};
export default function AutosaveIndicator({state}: {state:SaveState}){return <span className={`autosave-indicator ${state}`} role="status"><i aria-hidden="true"/>{labels[state]}</span>}
