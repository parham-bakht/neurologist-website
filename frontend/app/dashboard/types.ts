export type User={id:string;full_name:string;email:string;phone:string|null;role:"user"|"doctor"|"admin";created_at:string;is_active:boolean;is_superuser:boolean};
export type {Article,ArticleMedia as Media} from "../../types/article";
export type ContactRequest={id:string;full_name:string;phone:string;description:string;follow_up_notes:string;status:"new"|"contacted";created_at:string;contacted_at:string|null};
export type Visit={id:string;patient_id:string;scheduled_at:string;status:"scheduled"|"completed"|"cancelled";description:string;medications:string;address:string;created_at:string;updated_at:string;doctor_name:string;doctor:{id:string;full_name:string}|null;patient:{id:string;full_name:string;email:string;phone:string|null}};
export type Patient=User&{additional_notes:string;visits:Visit[]};
export type PatientListVisit=Pick<Visit,"id"|"scheduled_at"|"status"|"doctor"|"doctor_name">;
export type PatientListItem=User&{next_visit:PatientListVisit|null;latest_completed_visit:PatientListVisit|null};
