import {
  getListEmailsQueryKey,
  useCreateEmail,
  useListEmails,
  useListProspects,
  useSendEmail,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Mail, ExternalLink, Clock, Send } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const emailStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-purple-100 text-purple-700",
  replied: "bg-emerald-100 text-emerald-700",
  bounced: "bg-red-100 text-red-700",
};

export default function EmailsList() {
  const [search, setSearch] = useState("");
  const [prospectId, setProspectId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [composeError, setComposeError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: emails, isLoading, isError: emailsError } = useListEmails();
  const {
    data: prospects = [],
    isLoading: prospectsLoading,
    isError: prospectsError,
  } = useListProspects();
  const createEmail = useCreateEmail();
  const sendEmail = useSendEmail();
  const isSending = createEmail.isPending || sendEmail.isPending;

  const filtered = emails?.filter(e => 
    e.subject.toLowerCase().includes(search.toLowerCase()) || 
    e.prospectName?.toLowerCase().includes(search.toLowerCase()) ||
    e.prospectEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const resetComposer = () => {
    setProspectId("");
    setSubject("");
    setBody("");
    setComposeError(null);
  };

  const handleSend = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setComposeError(null);
    setSuccessMessage(null);

    const selectedProspectId = Number(prospectId);
    if (!selectedProspectId || !subject.trim() || !body.trim()) {
      setComposeError("Select a prospect and enter both a subject and body.");
      return;
    }

    createEmail.mutate(
      {
        data: {
          prospectId: selectedProspectId,
          subject: subject.trim(),
          body: body.trim(),
        },
      },
      {
        onSuccess: (createdEmail) => {
          void queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey() });
          sendEmail.mutate(
            { id: createdEmail.id },
            {
              onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey() });
                resetComposer();
                setSuccessMessage("Email sent successfully");
                toast({ title: "Email sent successfully" });
              },
              onError: (error) => {
                void queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey() });
                setComposeError(
                  getErrorMessage(error, "The draft was saved, but the SMTP server could not send it."),
                );
              },
            },
          );
        },
        onError: (error) => {
          setComposeError(getErrorMessage(error, "The email draft could not be saved."));
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Emails</h1>
          <p className="text-slate-500 mt-1">Review drafts, sent emails, and replies.</p>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-4 w-4 text-primary" />
            Send an email
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSend} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="space-y-2">
                <Label htmlFor="email-prospect">Prospect</Label>
                <Select value={prospectId} onValueChange={setProspectId} disabled={prospectsLoading}>
                  <SelectTrigger id="email-prospect">
                    <SelectValue
                      placeholder={prospectsLoading ? "Loading prospects..." : "Select a prospect"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((prospect) => (
                      <SelectItem key={prospect.id} value={String(prospect.id)}>
                        {prospect.name} · {prospect.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {prospectsError && (
                  <p className="text-sm text-red-600" role="alert">
                    Could not load prospects. Refresh the page and try again.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Following up on our conversation"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Body</Label>
              <Textarea
                id="email-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write your message..."
                className="min-h-32 resize-y"
                required
              />
            </div>
            {(composeError || emailsError) && (
              <p className="text-sm text-red-600" role="alert">
                {composeError || "Could not load the email list."}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-emerald-600" role="status">
                {successMessage}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSending || prospectsLoading || prospects.length === 0} className="gap-2">
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send email"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search emails by subject or prospect..." 
            className="pl-9 bg-slate-50/50 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="w-[300px]">Subject</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  <Mail className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No emails found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((email) => (
                <TableRow key={email.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="font-medium text-slate-900 line-clamp-1">{email.subject || '(No subject)'}</div>
                    <div className="text-sm text-slate-500 line-clamp-1 mt-0.5">{email.body}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-700">{email.prospectName}</div>
                    <div className="text-sm text-slate-500">{email.prospectEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={emailStatusColors[email.status] || "bg-slate-100"}>
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(email.sentAt || email.createdAt), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/emails/${email.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
