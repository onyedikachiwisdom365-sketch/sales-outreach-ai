import { useGetDashboardStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, MousePointerClick, Send, Activity, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activities, isLoading: activitiesLoading } = useGetRecentActivity({ limit: 10 });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Here is what's happening with your pipeline today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Prospects" 
          value={stats?.totalProspects} 
          icon={Users} 
          loading={statsLoading} 
          trend={`+${stats?.newProspectsThisWeek} this week`}
        />
        <StatCard 
          title="Emails Sent" 
          value={stats?.emailsSent} 
          icon={Send} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Open Rate" 
          value={stats ? `${(stats.openRate * 100).toFixed(1)}%` : undefined} 
          icon={MousePointerClick} 
          loading={statsLoading} 
        />
        <StatCard 
          title="Draft Emails" 
          value={stats?.emailsDraft} 
          icon={Mail} 
          loading={statsLoading} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activitiesLoading ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activities?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No activity yet</div>
            ) : (
              <div className="space-y-4">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary/50 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {activity.prospectName && <span>{activity.prospectName}</span>}
                        {activity.campaignName && (
                          <>
                            <span>•</span>
                            <span>{activity.campaignName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Prospects by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
               <div className="space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
               </div>
            ) : (
              <div className="space-y-4">
                {stats?.prospectsByStatus?.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <span className="text-sm capitalize font-medium text-slate-700">{status.status}</span>
                    <span className="text-sm font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-600">{status.count}</span>
                  </div>
                ))}
                {!stats?.prospectsByStatus?.length && (
                  <div className="text-center py-8 text-slate-500">No prospects</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading, trend }: any) {
  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
        <Icon className="w-4 h-4 text-slate-400" />
      </CardHeader>
      <CardContent className="relative z-10">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold text-slate-900">{value !== undefined ? value : '-'}</div>
        )}
        {trend && !loading && (
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
