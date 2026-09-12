import { 
  useGetCampaign, 
  useListEmails,
  useListProspects,
  getGetCampaignQueryKey,
  getListEmailsQueryKey,
  getListProspectsQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Target, Users, Send, Edit, Play, Pause, CheckCircle2, Mail, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const campaignId = params?.id ? parseInt(params.id, 10) : 0;

  const { data: campaign, isLoading } = useGetCampaign(campaignId, {
    query: { enabled: !!campaignId, queryKey: getGetCampaignQueryKey(campaignId) }
  });

  const { data: prospects, isLoading: prospectsLoading } = useListProspects({ campaignId }, {
    query: { enabled: !!campaignId, queryKey: getListProspectsQueryKey({ campaignId }) }
  });

  const { data: emails, isLoading: emailsLoading } = useListEmails({ campaignId }, {
    query: { enabled: !!campaignId, queryKey: getListEmailsQueryKey({ campaignId }) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/campaigns">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={statusColors[campaign.status] || "bg-slate-100"}>{campaign.status}</Badge>
            <span className="text-sm text-slate-500">Created {format(new Date(campaign.createdAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          {campaign.status === 'draft' || campaign.status === 'paused' ? (
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Play className="w-4 h-4" />
              Activate
            </Button>
          ) : campaign.status === 'active' ? (
            <Button size="sm" variant="outline" className="gap-2 text-amber-600 hover:bg-amber-50">
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-slate-900">{campaign.description || "No description provided."}</p>
            </div>
            {campaign.goal && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Goal
                </h4>
                <p className="text-slate-900 bg-slate-50 p-4 rounded-lg border border-slate-100">{campaign.goal}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="font-medium text-slate-900">Prospects</div>
              </div>
              <div className="text-2xl font-bold">{campaign.prospectCount || 0}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div className="font-medium text-slate-900">Emails Sent</div>
              </div>
              <div className="text-2xl font-bold">{campaign.emailsSent || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Assigned Prospects
            </CardTitle>
            <CardDescription>Prospects targeted in this campaign</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospectsLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : prospects?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No prospects assigned yet.</TableCell></TableRow>
              ) : (
                prospects?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-900 pl-6">{p.name}</TableCell>
                    <TableCell className="text-slate-600">{p.company || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                       <Link href={`/prospects/${p.id}`}>
                         <Button variant="ghost" size="sm">View</Button>
                       </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
