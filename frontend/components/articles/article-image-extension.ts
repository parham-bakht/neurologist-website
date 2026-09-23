import {mergeAttributes,Node} from "@tiptap/core";
import ArticleImageNodeView,{ReactNodeViewRenderer} from "./ArticleImageNodeView";

export const ArticleImage=Node.create({
  name:"articleImage",
  group:"block",
  atom:true,
  draggable:true,
  selectable:true,
  addAttributes(){return{
    src:{default:null},
    alt:{default:""},
    caption:{default:""},
    alignment:{default:"center"},
    width:{default:100},
  }},
  parseHTML(){return[{tag:"figure[data-article-image]"}]},
  addNodeView(){return ReactNodeViewRenderer(ArticleImageNodeView)},
  renderHTML({HTMLAttributes}){
    const {src,alt,caption,alignment,width}=HTMLAttributes;
    return ["figure",mergeAttributes({"data-article-image":"","data-alignment":alignment,"data-width":width}),
      ["img",{src,alt,style:`width:${Number(width)||100}%`}],
      ["figcaption",{},caption||""]
    ];
  },
});
