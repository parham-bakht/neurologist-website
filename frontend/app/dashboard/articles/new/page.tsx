import {redirect} from "next/navigation";
import ArticleEditor from "../../../../components/articles/ArticleEditor";
import {requireDashboardUser} from "../../auth";

export default async function NewArticlePage(){const {user}=await requireDashboardUser();if(user.role==="user")redirect("/dashboard");return <ArticleEditor/>}
