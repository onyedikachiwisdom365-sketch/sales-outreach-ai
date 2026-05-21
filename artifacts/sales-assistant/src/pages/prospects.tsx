import { useListProspects } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Building2, Mail, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  contacted: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  replied: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  qualified: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  unqualified: "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

export default function ProspectsList() {
  const [search, setSearch] = useState("");
  const { data: prospects, isLoading } = useListProspects();

  const filtered = prospects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.company?.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Prospects</h1>
          <p className="text-slate-500 mt-1">Manage your contacts and lead pipeline.</p>
        </div>
        <Button className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Add Prospect
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search prospects..." 
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
              <TableHead className="w-[300px]">Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No prospects found
                </TableCell>
              </TableRow>
            ) : (
              filtered?.map((prospect) => (
                <TableRow key={prospect.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                        {prospect.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{prospect.name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {prospect.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {prospect.company ? (
                      <div className="flex items-center gap-2 text-slate-700">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {prospect.company}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[prospect.status] || "bg-slate-100"}>
                      {prospect.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/prospects/${prospect.id}`}>
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
