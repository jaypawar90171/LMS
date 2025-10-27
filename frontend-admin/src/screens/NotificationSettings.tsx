import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import {
  Bell,
  Mail,
  MessageSquare,
  Package,
  Pencil,
  Printer,
  RefreshCw,
} from "lucide-react";
import React, { FC, useEffect, useState } from "react";
import { toast } from "sonner";

interface Template {
  emailSubject: string;
  emailBody: string;
  whatsappMessage: string;
}

interface NotificationTemplates {
  bookIssued: Template;
  bookOverdue: Template;
  bookReturned: Template;
}

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string, data: Template) => void;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateKey: string;
  templateData: Template;
  onSave: (key: string, data: Template) => void;
}

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationTemplates | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    key: string;
    data: Template;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("Access token not found.");
      }

      const response = await axios.get(
        "https://lms-backend1-q5ah.onrender.com/api/admin/settings/notification-templates",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setNotificationSettings(response.data.data.notificationTemplates);
      toast.success("Succesfully fetched the data");
    } catch (error: any) {
      console.log("Error in fetching the notification settings");
      toast.error(error.message || "Failed to fetch settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setLoading(false);
  }, []);

  const handleOpenModal = (key: string, data: Template) => {
    setSelectedTemplate({ key, data });
    setIsModalOpen(true);
  };

  const handleSaveChanges = async (key: string, data: Template) => {
    const payload = data;

    const promise = axios.put(
      `https://lms-backend1-q5ah.onrender.com/api/admin/settings/notification-templates/${key}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    toast.promise(promise, {
      loading: "Saving changes...",
      success: () => {
        fetchData();
        setIsModalOpen(false);
        return "Settings updated successfully!";
      },
      error: "Failed to update settings.",
    });
  };

  const formatTitle = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted mx-auto"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Loading Report Data
            </h3>
            <p className="text-muted-foreground">
              Fetching your latest records...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Error Loading Report
                </h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => {}} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const AddTemplateModal: FC<AddTemplateModalProps> = ({
    isOpen,
    onClose,
    onSave,
  }) => {
    const [templateKey, setTemplateKey] = useState("");
    const [subject, setSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("");

    const handleSave = () => {
      if (!templateKey) {
        toast.error("Template key is required!");
        return;
      }
      onSave(templateKey, {
        emailSubject: subject,
        emailBody,
        whatsappMessage,
      });
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Template Key</Label>
              <Input
                id="key"
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                placeholder="e.g. userActivated"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Message</Label>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const EditTemplateModal: FC<EditTemplateModalProps> = ({
    isOpen,
    onClose,
    templateKey,
    templateData,
    onSave,
  }) => {
    const [subject, setSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");
    const [whatsappMessage, setWhatsappMessage] = useState("");

    useEffect(() => {
      if (templateData) {
        setSubject(templateData.emailSubject);
        setEmailBody(templateData.emailBody);
        setWhatsappMessage(templateData.whatsappMessage);
      }
    }, [templateData]);

    const handleSave = () => {
      onSave(templateKey, {
        emailSubject: subject,
        emailBody: emailBody,
        whatsappMessage: whatsappMessage,
      });
    };

    const formatTitle = (key: string) =>
      key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit: {formatTitle(templateKey)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailBody">Email Body</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">WhatsApp Message</Label>
              <Textarea
                id="whatsappMessage"
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Notification Settings
            </h1>
            <p className="text-muted-foreground">
              Manage system-generated notifications for various events.
            </p>
          </div>
        </div>

        {/* Templates Display */}
        <Card>
          <div className="flex justify-end mr-3 mt-3">
              <Button onClick={() => setIsModalOpen(true)}>
                + Add New Template
              </Button>
            </div>
          <CardHeader >
            <CardTitle className="flex items-center gap-2">
              <Bell /> Notification Templates
            </CardTitle>
            
          </CardHeader>
          <CardContent>
            {notificationSettings && (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(notificationSettings).map(([key, template]) => (
                  <AccordionItem value={key} key={key}>
                    <AccordionTrigger className="text-lg font-semibold">
                      {formatTitle(key)}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <Tabs defaultValue="email">
                        <TabsList>
                          <TabsTrigger value="email">
                            <Mail className="h-4 w-4 mr-2" />
                            Email
                          </TabsTrigger>
                          <TabsTrigger value="whatsapp">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            WhatsApp
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent
                          value="email"
                          className="p-4 border rounded-md bg-background"
                        >
                          <p className="text-sm font-semibold text-muted-foreground">
                            Subject:
                          </p>
                          <p className="mb-4 p-2 border rounded-sm">
                            {template.emailSubject}
                          </p>
                          <p className="text-sm font-semibold text-muted-foreground">
                            Body:
                          </p>
                          <p className="p-2 border rounded-sm whitespace-pre-wrap">
                            {template.emailBody}
                          </p>
                        </TabsContent>
                        <TabsContent
                          value="whatsapp"
                          className="p-4 border rounded-md bg-background"
                        >
                          <p className="text-sm font-semibold text-muted-foreground">
                            Message:
                          </p>
                          <p className="p-2 border rounded-sm">
                            {template.whatsappMessage}
                          </p>
                        </TabsContent>
                      </Tabs>
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => handleOpenModal(key, template)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Template
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Render Modal */}
      {selectedTemplate && (
        <EditTemplateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          templateKey={selectedTemplate.key}
          templateData={selectedTemplate.data}
          onSave={handleSaveChanges}
        />
      )}

      <AddTemplateModal
        isOpen={isModalOpen && !selectedTemplate}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveChanges}
      />
    </div>
  );
}
