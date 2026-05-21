import { useListEmails } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, ExternalLink, Clock, Target } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { format } from "date-fns";

const emailStatusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  opened: "bg-purple-100 text-purple-700",
  replied: "bg-emerald-100 text-emerald-700",
  bounced: "bg-red-100 text-red-700",
};

export default function EmailsList() {
  const [search, setSearch] = useState("");
  const { data: emails, isLoading } = useListEmails();

  const filtered = emails?.filter(e => 
    e.subject.toLowerCase().includes(search.toLowerCase()) || 
    e.prospectName?.toLowerCase().includes(search.toLowerCase()) ||
    e.prospectEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Emails</h1>
          <p className="text-slate-500 mt-1">Review drafts, sent emails, and replies.</p>
        </div>
      </div>

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
