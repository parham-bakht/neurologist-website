import {authorizedBackend,backendJson} from "../../../../../lib/server/backend";

const actions=new Set(["publish","unpublish","schedule"]);
export async function POST(request:Request,{params}:{params:Promise<{id:string;action:string}>}){
  const {id,action}=await params;
  if(!actions.has(action))return Response.json({detail:"Unknown article action"},{status:404});
  const body=action==="schedule"?await request.text():undefined;
  return backendJson(await authorizedBackend(`/api/v1/articles/${id}/${action}`,{method:"POST",headers:body?{"Content-Type":"application/json"}:undefined,body}));
}
