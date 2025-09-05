export interface UpdateTemplateData {
  templateKey: string;
  data: {
    emailSubject?: string;
    emailBody?: string;
    whatsappMessage?: string;
  };
}