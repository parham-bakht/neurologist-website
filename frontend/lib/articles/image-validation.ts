export const MAX_ARTICLE_IMAGE_BYTES=10*1024*1024;
const ALLOWED_IMAGE_TYPES=new Set(["image/jpeg","image/png","image/webp"]);

export function validateArticleImage(file:File):string|null{
  if(!ALLOWED_IMAGE_TYPES.has(file.type))return "فقط تصویرهای JPEG، PNG یا WebP قابل بارگذاری هستند.";
  if(file.size===0)return "فایل تصویر خالی است.";
  if(file.size>MAX_ARTICLE_IMAGE_BYTES)return "حجم تصویر باید حداکثر ۱۰ مگابایت باشد.";
  return null;
}
