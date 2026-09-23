"use client";

import type {Editor} from "@tiptap/react";

type Props={editor:Editor|null;onImage:()=>void;onVideo:()=>void};
type ToolProps={label:string;title:string;active?:boolean;disabled?:boolean;run:()=>void};

function Tool({label,title,active=false,disabled=false,run}:ToolProps){
  return <button type="button" className={active?"is-active":""} aria-label={title} title={title} aria-pressed={active} disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={run}>{label}</button>;
}

export default function ArticleEditorToolbar({editor,onImage,onVideo}:Props){
  if(!editor)return <div className="article-toolbar article-toolbar-loading" aria-hidden="true"/>;
  const link=()=>{
    const previous=editor.getAttributes("link").href as string|undefined;
    const href=window.prompt("نشانی کامل پیوند را وارد کنید",previous||"https://");
    if(href===null)return;
    if(!href.trim()){editor.chain().focus().extendMarkRange("link").unsetLink().run();return}
    if(!/^(https?:\/\/|mailto:|tel:)/i.test(href)){window.alert("پیوند باید با https://، http://، mailto: یا tel: شروع شود.");return}
    editor.chain().focus().extendMarkRange("link").setLink({href:href.trim()}).run();
  };
  const youtube=()=>{
    const url=window.prompt("نشانی ویدیوی YouTube را وارد کنید","https://www.youtube.com/watch?v=");
    if(url)editor.commands.setYoutubeVideo({src:url.trim(),width:720,height:405});
  };
  return <div className="article-toolbar" role="toolbar" aria-label="ابزارهای قالب‌بندی مقاله">
    <div className="toolbar-group">
      <Tool label="B" title="پررنگ (Ctrl+B)" active={editor.isActive("bold")} run={()=>editor.chain().focus().toggleBold().run()}/>
      <Tool label="I" title="مورب (Ctrl+I)" active={editor.isActive("italic")} run={()=>editor.chain().focus().toggleItalic().run()}/>
      <Tool label="U" title="زیرخط" active={editor.isActive("underline")} run={()=>editor.chain().focus().toggleUnderline().run()}/>
      <Tool label="S" title="خط‌خورده" active={editor.isActive("strike")} run={()=>editor.chain().focus().toggleStrike().run()}/>
      <Tool label="&lt;/&gt;" title="کد درون‌خطی" active={editor.isActive("code")} run={()=>editor.chain().focus().toggleCode().run()}/>
    </div>
    <div className="toolbar-group">
      <Tool label="متن" title="پاراگراف" active={editor.isActive("paragraph")} run={()=>editor.chain().focus().setParagraph().run()}/>
      {[1,2,3].map(level=><Tool key={level} label={`H${level}`} title={`عنوان سطح ${level}`} active={editor.isActive("heading",{level})} run={()=>editor.chain().focus().toggleHeading({level:level as 1|2|3}).run()}/>) }
    </div>
    <div className="toolbar-group">
      <Tool label="• فهرست" title="فهرست نشانه‌دار" active={editor.isActive("bulletList")} run={()=>editor.chain().focus().toggleBulletList().run()}/>
      <Tool label="۱. فهرست" title="فهرست شماره‌دار" active={editor.isActive("orderedList")} run={()=>editor.chain().focus().toggleOrderedList().run()}/>
      <Tool label="❝" title="نقل‌قول" active={editor.isActive("blockquote")} run={()=>editor.chain().focus().toggleBlockquote().run()}/>
      <Tool label="کد" title="بلوک کد" active={editor.isActive("codeBlock")} run={()=>editor.chain().focus().toggleCodeBlock().run()}/>
      <Tool label="—" title="خط جداکننده" run={()=>editor.chain().focus().setHorizontalRule().run()}/>
    </div>
    <div className="toolbar-group">
      <Tool label="راست" title="چینش راست" active={editor.isActive({textAlign:"right"})} run={()=>editor.chain().focus().setTextAlign("right").run()}/>
      <Tool label="وسط" title="چینش وسط" active={editor.isActive({textAlign:"center"})} run={()=>editor.chain().focus().setTextAlign("center").run()}/>
      <Tool label="چپ" title="چینش چپ" active={editor.isActive({textAlign:"left"})} run={()=>editor.chain().focus().setTextAlign("left").run()}/>
    </div>
    <div className="toolbar-group">
      <Tool label="پیوند" title="افزودن یا ویرایش پیوند" active={editor.isActive("link")} run={link}/>
      <Tool label="تصویر" title="درج تصویر در متن" run={onImage}/>
      <Tool label="ویدئو" title="بارگذاری و درج ویدئو در متن" run={onVideo}/>
      <Tool label="YouTube" title="درج ویدیوی YouTube" run={youtube}/>
    </div>
    <div className="toolbar-group toolbar-history">
      <Tool label="↶" title="بازگردانی (Ctrl+Z)" disabled={!editor.can().undo()} run={()=>editor.chain().focus().undo().run()}/>
      <Tool label="↷" title="انجام دوباره (Ctrl+Shift+Z)" disabled={!editor.can().redo()} run={()=>editor.chain().focus().redo().run()}/>
      <Tool label="پاک‌سازی" title="پاک‌کردن قالب‌بندی" run={()=>editor.chain().focus().unsetAllMarks().clearNodes().run()}/>
    </div>
  </div>;
}
