import { 
  useGetEmail,
  useUpdateEmail,
  useSendEmail,
  getGetEmailQueryKey
} from "@workspace/api-client-react";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Save, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const emailStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-purple-100 text-purple-700",
  replied: "bg-emerald-100 text-emerald-700",
  bounced: "bg-red-100 text-red-700",
};

export default function EmailDetail() {
  const [, params] = useRoute("/emails/:id");
  const emailId = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: email, isLoading } = useGetEmail(emailId, {
    query: { enabled: !!emailId, queryKey: getGetEmailQueryKey(emailId) }
  });

  const updateEmail = useUpdateEmail();
  const sendEmail = useSendEmail();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const isInitialized = useRef(false);

  useEffect(() => {
    if (email && !isInitialized.current) {
      setSubject(email.subject);
      setBody(email.body);
      isInitialized.current = true;
    }
  }, [email]);

  const handleSave = () => {
    updateEmail.mutate({
      id: emailId,
      data: { subject, body }
    }, {
      onSuccess: () => {
        toast({ title: "Draft saved" });
        queryClient.invalidateQueries({ queryKey: getGetEmailQueryKey(emailId) });
      }
    });
  };

  const handleSend = () => {
    sendEmail.mutate({ id: emailId }, {
      onSuccess: () => {
        toast({ title: "Email sent successfully" });
        queryClient.invalidateQueries({ queryKey: getGetEmailQueryKey(emailId) });
        setLocation("/emails");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!email) {
    return <div>Email not found</div>;
  }

  const isDraft = email.status === 'draft';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/emails">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Email Viewer</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={emailStatusColors[email.status] || "bg-slate-100"}>{email.status}</Badge>
            <span className="text-sm text-slate-500">
              {email.sentAt 
                ? `Sent ${format(new Date(email.sentAt), "MMM d, yyyy h:mm a")}` 
                : `Created ${format(new Date(email.createdAt), "MMM d, yyyy")}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 w-12 text-right font-medium">To:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border shadow-sm">
                  {email.prospectName} <span className="text-slate-400 font-normal">&lt;{email.prospectEmail}&gt;</span>
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-500 w-12 text-right font-medium">Subject:</span>
                {isDraft ? (
                  <Input 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)} 
                    className="font-medium bg-white"
                  />
                ) : (
                  <span className="font-medium text-slate-900">{email.subject}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isDraft ? (
                <Textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-[400px] border-0 rounded-none focus-visible:ring-0 p-6 text-slate-700 leading-relaxed resize-none"
                />
              ) : (
                <div className="min-h-[400px] p-6 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {email.body}
                </div>
              )}
            </CardContent>
            {isDraft && (
              <CardFooter className="bg-slate-50/50 border-t justify-end gap-2 p-4">
                <Button variant="outline" onClick={handleSave} disabled={updateEmail.isPending} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Draft
                </Button>
                <Button onClick={handleSend} disabled={sendEmail.isPending} className="gap-2">
                  <Send className="w-4 h-4" />
                  {sendEmail.isPending ? "Sending..." : "Send Email"}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="md:col-span-1 space-y-4">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Recipient
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 space-y-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Name</p>
                <Link href={`/prospects/${email.prospectId}`}>
                  <span className="font-medium text-primary hover:underline cursor-pointer">{email.prospectName}</span>
                </Link>
              </div>
              {email.prospectCompany && (
                <div>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Company</p>
                  <p className="text-slate-900">{email.prospectCompany}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
