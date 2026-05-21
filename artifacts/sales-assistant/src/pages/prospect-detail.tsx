import { 
  useGetProspect, 
  useListEmails,
  useUpdateProspect,
  useDeleteProspect,
  useGenerateEmailForProspect,
  getGetProspectQueryKey,
  getListEmailsQueryKey
} from "@workspace/api-client-react";
import { useRoute, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Building2, Globe, Linkedin, Edit, Trash2, Send, Clock, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  replied: "bg-emerald-100 text-emerald-700",
  qualified: "bg-purple-100 text-purple-700",
  unqualified: "bg-slate-100 text-slate-700",
};

export default function ProspectDetail() {
  const [, params] = useRoute("/prospects/:id");
  const prospectId = params?.id ? parseInt(params.id, 10) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: prospect, isLoading } = useGetProspect(prospectId, {
    query: { enabled: !!prospectId, queryKey: getGetProspectQueryKey(prospectId) }
  });

  const { data: emails, isLoading: emailsLoading } = useListEmails({ prospectId }, {
    query: { enabled: !!prospectId, queryKey: getListEmailsQueryKey({ prospectId }) }
  });

  const deleteProspect = useDeleteProspect();
  const generateEmail = useGenerateEmailForProspect();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [tone, setTone] = useState<"professional" | "friendly" | "concise" | "persuasive">("professional");
  const [context, setContext] = useState("");

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this prospect?")) {
      deleteProspect.mutate({ id: prospectId }, {
        onSuccess: () => {
          toast({ title: "Prospect deleted successfully" });
          setLocation("/prospects");
        }
      });
    }
  };

  const handleGenerate = () => {
    generateEmail.mutate({
      id: prospectId,
      data: {
        tone,
        context,
        campaignId: prospect?.campaignId
      }
    }, {
      onSuccess: () => {
        toast({ title: "Email draft generated" });
        setIsGenerateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListEmailsQueryKey({ prospectId }) });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!prospect) {
    return <div>Prospect not found</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/prospects">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{prospect.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusColors[prospect.status] || "bg-slate-100"}>{prospect.status}</Badge>
            {prospect.role && <span className="text-sm text-slate-500">{prospect.role}</span>}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsGenerateOpen(true)}>
            <Sparkles className="w-4 h-4" />
            Draft Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Email</p>
                  <p className="text-slate-900 truncate">{prospect.email}</p>
                </div>
              </div>
              
              {prospect.company && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Company</p>
                    <p className="text-slate-900 truncate">{prospect.company}</p>
                  </div>
                </div>
              )}

              {prospect.website && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Website</p>
                    <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                      {prospect.website}
                    </a>
                  </div>
                </div>
              )}

              {prospect.linkedin && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Linkedin className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">LinkedIn</p>
                    <a href={prospect.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                      Profile Link
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {prospect.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{prospect.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <div>
                <CardTitle className="text-lg">Emails</CardTitle>
                <CardDescription>All communications with this prospect</CardDescription>
              </div>
              <Badge variant="outline">{emails?.length || 0} Total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {emailsLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : emails?.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p>No emails sent yet.</p>
                  <Button variant="link" onClick={() => setIsGenerateOpen(true)}>Generate one now</Button>
                </div>
              ) : (
                <div className="divide-y">
                  {emails?.map((email) => (
                    <div key={email.id} className="p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-900">{email.subject}</h4>
                            <Badge variant={email.status === 'sent' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                              {email.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">{email.body}</p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(email.createdAt), "MMM d, yyyy")}
                          </div>
                          <Link href={`/emails/${email.id}`}>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate AI Draft
            </DialogTitle>
            <DialogDescription>
              Create a personalized email based on {prospect.name}'s profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Tone of Voice</Label>
              <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="persuasive">Persuasive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Additional Context (Optional)</Label>
              <Textarea 
                placeholder="E.g., mention our new Q3 product launch and their recent funding round..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="h-24 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generateEmail.isPending}>
              {generateEmail.isPending ? "Generating..." : "Generate Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
