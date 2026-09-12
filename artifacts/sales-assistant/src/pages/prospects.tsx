import {
  getListProspectsQueryKey,
  useCreateProspect,
  useListProspects,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Building2, Mail, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  contacted: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  replied: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  qualified: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  unqualified: "bg-slate-100 text-slate-700 hover:bg-slate-100",
};

export default function ProspectsList() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    website: "",
    linkedin: "",
    notes: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    data: prospects = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useListProspects(undefined, {
    query: {
      queryKey: getListProspectsQueryKey(),
      retry: 1,
    },
  });
  const createProspect = useCreateProspect();
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = prospects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.company?.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      company: "",
      role: "",
      website: "",
      linkedin: "",
      notes: "",
    });
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    createProspect.mutate(
      {
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          ...(form.company.trim() && { company: form.company.trim() }),
          ...(form.role.trim() && { role: form.role.trim() }),
          ...(form.website.trim() && { website: form.website.trim() }),
          ...(form.linkedin.trim() && { linkedin: form.linkedin.trim() }),
          ...(form.notes.trim() && { notes: form.notes.trim() }),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProspectsQueryKey() });
          setIsAddOpen(false);
          resetForm();
          toast({ title: "Prospect added", description: "The prospect was saved to your database." });
        },
        onError: () => {
          setFormError("The prospect could not be saved. Please try again.");
          toast({
            title: "Could not add prospect",
            description: "The API request failed. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Prospects</h1>
          <p className="text-slate-500 mt-1">Manage your contacts and lead pipeline.</p>
        </div>
        <Button className="gap-2 shadow-sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Prospect
        </Button>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a prospect</DialogTitle>
            <DialogDescription>
              Add a contact to your pipeline. Required fields are marked by the browser.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prospect-name">Name</Label>
                <Input
                  id="prospect-name"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospect-email">Email</Label>
                <Input
                  id="prospect-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="jane@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospect-company">Company</Label>
                <Input
                  id="prospect-company"
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospect-role">Role</Label>
                <Input
                  id="prospect-role"
                  value={form.role}
                  onChange={(event) => updateField("role", event.target.value)}
                  placeholder="Head of Sales"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospect-website">Website</Label>
                <Input
                  id="prospect-website"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  placeholder="company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospect-linkedin">LinkedIn</Label>
                <Input
                  id="prospect-linkedin"
                  value={form.linkedin}
                  onChange={(event) => updateField("linkedin", event.target.value)}
                  placeholder="linkedin.com/in/janedoe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospect-notes">Notes</Label>
              <Textarea
                id="prospect-notes"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Context for your next conversation"
              />
            </div>
            {formError && (
              <p className="text-sm text-red-600" role="alert">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProspect.isPending}>
                {createProspect.isPending ? "Saving..." : "Save Prospect"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            {isError ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="space-y-3">
                    <p className="text-red-600" role="alert">
                      {error instanceof Error
                        ? error.message
                        : "Could not load prospects from the API."}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No prospects found
                </TableCell>
              </TableRow>
            ) : (
                filtered.map((prospect) => (
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
