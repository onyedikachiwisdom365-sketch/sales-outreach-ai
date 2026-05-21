import { useListCampaigns } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Megaphone, Users, Send, ExternalLink, Target } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function CampaignsList() {
  const [search, setSearch] = useState("");
  const { data: campaigns, isLoading } = useListCampaigns();

  const filtered = campaigns?.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage your outreach strategies.</p>
        </div>
        <Button className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-9 bg-slate-50/50 border-slate-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))
        ) : filtered?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>No campaigns found</p>
          </div>
        ) : (
          filtered?.map((campaign) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className={statusColors[campaign.status] || "bg-slate-100"}>
                    {campaign.status}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                  {campaign.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 min-h-[40px]">
                  {campaign.description || "No description provided."}
                </p>

                <div className="mt-auto pt-6 grid grid-cols-2 gap-4 border-t mt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Prospects
                    </span>
                    <span className="font-semibold text-slate-900">{campaign.prospectCount || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      Sent
                    </span>
                    <span className="font-semibold text-slate-900">{campaign.emailsSent || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
