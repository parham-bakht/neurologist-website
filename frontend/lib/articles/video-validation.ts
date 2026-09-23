export const MAX_ARTICLE_VIDEO_BYTES=100*1024*1024;
const accepted=new Set(["video/mp4","video/webm"]);

export function validateArticleVideo(file:File):string|null{
  if(!accepted.has(file.type))return "فقط فایل‌های MP4 یا WebM قابل بارگذاری هستند.";
  if(file.size>MAX_ARTICLE_VIDEO_BYTES)return "حجم ویدئو باید حداکثر ۱۰۰ مگابایت باشد.";
  if(file.size===0)return "فایل ویدئو خالی است.";
  return null;
}
