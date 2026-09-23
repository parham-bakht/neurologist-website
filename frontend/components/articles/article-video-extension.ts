import {mergeAttributes,Node} from "@tiptap/core";
import ArticleVideoNodeView,{ReactNodeViewRenderer} from "./ArticleVideoNodeView";

export const ArticleVideo=Node.create({
  name:"articleVideo",group:"block",atom:true,draggable:true,selectable:true,
  addAttributes(){return{src:{default:null},caption:{default:""}}},
  parseHTML(){return[{tag:"figure[data-article-video]"}]},
  addNodeView(){return ReactNodeViewRenderer(ArticleVideoNodeView)},
  renderHTML({HTMLAttributes}){const {src,caption}=HTMLAttributes;return ["figure",mergeAttributes({"data-article-video":""}),["video",{src,controls:"",preload:"metadata",playsinline:""}],["figcaption",{},caption||""]]},
});
