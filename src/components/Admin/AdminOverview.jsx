import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { fetchAllReports } from "@/utils/user";
import { countActiveUsers } from "@/utils/user";
import { toast } from "sonner";

const RISK_LEVELS = {
  low: { label: "Low Risk", color: "success", value: 20 },
  medium: { label: "Medium Risk", color: "warning", value: 50 },
  high: { label: "High Risk", color: "destructive", value: 80 },
};

function groupReportsByLocationAndType(reports) {
  const groups = {};
  reports.forEach((r) => {
    const loc = r.location || { lat: r.latitude, lng: r.longitude };
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") return;
    const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}|${r.incidentType}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return groups;
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalReports24h: 0,
    totalReports7d: 0,
    verifiedReports: 0,
    fakeReports: 0,
    pendingReports: 0,
    activeUsers: 0,
    riskAlerts: [],
    trendData: {
      reportsTrend: "up",
      verificationRate: 0,
      fakeRate: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  const getTimestampMs = (ts) => {
    if (!ts) return 0;
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    if (typeof ts === "number") return ts;
    if (typeof ts === "string") return new Date(ts).getTime();
    if (ts instanceof Date) return ts.getTime();
    return 0;
  };

  const fetchDashboardStats = async () => {
    try {
      const reports = await fetchAllReports();

      const locationGroups = groupReportsByLocationAndType(reports);
      const riskAlerts = Object.entries(locationGroups).map(
        ([locTypeKey, group]) => {
          let level = "none";
          if (group.length >= 7) level = "high";
          else if (group.length >= 2) level = "medium";
          else if (group.length >= 1) level = "low";
          const [locationKey, incidentType] = locTypeKey.split("|");
          // Find the latest incident in the group
          const latestIncident = group.reduce(
            (latest, curr) =>
              getTimestampMs(curr.timestamp) > getTimestampMs(latest.timestamp)
                ? curr
                : latest,
            group[0]
          );
          return {
            locKey: locationKey,
            incidentType,
            count: group.length,
            alertLevel: level,
            status: latestIncident.status,
            timestamp: latestIncident.timestamp,
            latestIncident, // add this
          };
        }
      );
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneDayAgo = now - oneDay;
      const sevenDaysAgo = now - 7 * oneDay;
      const twoDaysAgo = now - 2 * oneDay;

      const totalReportsPrev24h = reports.filter(
        (r) =>
          getTimestampMs(r.timestamp) >= twoDaysAgo &&
          getTimestampMs(r.timestamp) < oneDayAgo
      ).length;
      const totalReports24h = reports.filter(
        (r) => getTimestampMs(r.timestamp) >= oneDayAgo
      ).length;
      const totalReports7d = reports.filter(
        (r) => getTimestampMs(r.timestamp) >= sevenDaysAgo
      ).length;
      const verifiedReports = reports.filter(
        (r) => r.status === "resolved"
      ).length;
      const fakeReports = reports.filter((r) => r.status === "rejected").length;
      const pendingReports = reports.filter(
        (r) => r.status === "pending"
      ).length;

      // active users count for illustration
      const activeUsers = await countActiveUsers();

      // Simple risk level calculation based on pending reports
      let riskLevel = "low";
      if (pendingReports > 20) riskLevel = "high";
      else if (pendingReports > 10) riskLevel = "medium";

      let reportsTrend = "up";
      let reportsTrendPercent = 0;
      if (totalReportsPrev24h > 0) {
        reportsTrendPercent = Math.round(
          ((totalReports24h - totalReportsPrev24h) / totalReportsPrev24h) * 100
        );
        reportsTrend = reportsTrendPercent >= 0 ? "up" : "down";
        reportsTrendPercent = Math.abs(reportsTrendPercent);
      } else if (totalReports24h > 0) {
        reportsTrend = "up";
        reportsTrendPercent = 100;
      } else {
        reportsTrend = "down";
        reportsTrendPercent = 0;
      }

      const trendData = {
        reportsTrend,
        reportsTrendPercent,
        verificationRate:
          reports.length > 0 ? verifiedReports / reports.length : 0,
        fakeRate: reports.length > 0 ? fakeReports / reports.length : 0,
      };

      // ...then in setStats:
      setStats({
        totalReports24h,
        totalReports7d,
        verifiedReports,
        fakeReports,
        pendingReports,
        activeUsers,
        riskLevel,
        trendData,
        riskAlerts,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error(`Error fetching dashboard stats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendPercent = 0,
    color = "default",
  }) => {
    // Color classes for value text
    const valueColor =
      color === "success"
        ? "text-green-600"
        : color === "warning"
        ? "text-yellow-600"
        : color === "destructive"
        ? "text-red-600"
        : "text-foreground";

    // Trend color
    const trendColor =
      trend === "up"
        ? "text-green-600"
        : trend === "down"
        ? "text-red-600"
        : "text-muted-foreground";

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && (
            <Icon
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{subtitle}</p>
            {trend && (
              <div className={`flex items-center text-xs ${trendColor}`}>
                {trend === "up" ? (
                  <TrendingUp
                    className="h-3 w-3 mr-1"
                    aria-label="Trending up"
                  />
                ) : (
                  <TrendingDown
                    className="h-3 w-3 mr-1"
                    aria-label="Trending down"
                  />
                )}
                {trend === "up" ? "+" : "-"}
                {trendPercent}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const HeatmapCard = () => {
    const currentRisk = RISK_LEVELS[stats.riskLevel] || RISK_LEVELS.low;

    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            City Risk Level Overview
          </CardTitle>
          <CardDescription>
            Real-time risk assessment based on incident patterns, severity, and
            response times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Risk Assessment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Risk Level</span>
                <Badge
                  variant={currentRisk.color}
                  className="text-sm px-3 py-1"
                >
                  {currentRisk.label}
                </Badge>
              </div>
              <Progress value={currentRisk.value} className="h-4" />
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Avg Response Time:
                  </span>
                  <span className="font-medium text-orange-600">5.2 min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Active Incidents:
                  </span>
                  <span className="font-medium text-red-600">
                    {stats.pendingReports}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Critical Areas:</span>
                  <span className="font-medium text-red-600">
                    {
                      stats.riskAlerts.filter(
                        (alert) => alert.alertLevel === "high"
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Trend:</span>
                  <span className="font-medium text-red-600">↑ 15%</span>
                </div>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Risk Distribution</h4>
              {Object.entries(RISK_LEVELS).map(([key, level]) => {
                // Count alerts by risk level
                const count = stats.riskAlerts.filter(
                  (alert) => alert.alertLevel === key
                ).length;
                // Calculate percentage (use total alerts)
                const totalAlerts = stats.riskAlerts.length || 1;
                const percentage = Math.round((count / totalAlerts) * 100);

                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full border-2 ${
                            key === "high"
                              ? "bg-orange-500 border-orange-700"
                              : key === "medium"
                              ? "bg-yellow-500 border-yellow-700"
                              : "bg-green-500 border-green-700"
                          }`}
                        />
                        <span className="text-sm font-medium">
                          {level.label}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{count} alerts</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          key === "high"
                            ? "bg-orange-500"
                            : key === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Risk Metrics</h4>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-800">
                      High Risk Incidents
                    </span>
                    <span className="text-lg font-bold text-red-600">
                      {stats.riskAlerts
                        .filter((alert) => alert.alertLevel === "high")
                        .reduce((sum, alert) => sum + alert.count, 0)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-orange-800">
                      Medium Priority
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {stats.riskAlerts
                        .filter((alert) => alert.alertLevel === "medium")
                        .reduce((sum, alert) => sum + alert.count, 0)}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">
                      Low Priority
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.riskAlerts
                        .filter((alert) => alert.alertLevel === "low")
                        .reduce((sum, alert) => sum + alert.count, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Heatmap Grid */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">District Risk Heatmap</h4>
              <div className="text-xs text-muted-foreground">
                Click on any district for detailed information
              </div>
            </div>

            <div className="grid grid-cols-8 gap-1 p-4 bg-gray-50 rounded-lg">
              {stats.riskAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="relative group cursor-pointer transform transition-all duration-200 hover:scale-110 hover:z-10"
                  title={`${alert.locKey}: ${alert.alertLevel} risk (${alert.count} incidents)`}
                >
                  <div
                    className="aspect-square rounded-sm border-2 flex items-center justify-center text-xs font-bold transition-all duration-200"
                    style={{
                      backgroundColor:
                        alert.alertLevel === "high"
                          ? "rgba(249, 115, 22, 0.8)"
                          : alert.alertLevel === "medium"
                          ? "rgba(245, 158, 11, 0.7)"
                          : "rgba(34, 197, 94, 0.6)",
                      borderColor:
                        alert.alertLevel === "high"
                          ? "rgb(194, 65, 12)"
                          : alert.alertLevel === "medium"
                          ? "rgb(180, 83, 9)"
                          : "rgb(21, 128, 61)",
                      color: alert.count > 5 ? "white" : "black",
                    }}
                  >
                    {alert.count}
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                    <div className="font-bold">{alert.locKey}</div>
                    <div>Risk: {alert.alertLevel}</div>
                    <div>Incident Type: {alert.incidentType}</div>
                    <div>Incidents: {alert.count}</div>
                    <div>Status: {alert.latestIncident?.status}</div>
                    <div>
                      Time:{" "}
                      {alert.latestIncident?.timestamp
                        ? new Date(
                            typeof alert.latestIncident.timestamp.toDate ===
                            "function"
                              ? alert.latestIncident.timestamp.toDate()
                              : alert.latestIncident.timestamp
                          ).toLocaleString()
                        : ""}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Legend */}
            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border-2 border-green-700 rounded-sm" />
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-700 rounded-sm" />
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 border-2 border-orange-700 rounded-sm" />
                  <span>High</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Numbers show incident count per district
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Reports (24h)"
          value={stats.totalReports24h}
          subtitle={`Last 7 days: ${stats.totalReports7d}`}
          icon={FileText}
          trend={stats.trendData.reportsTrend}
          trendPercent={stats.trendData.reportsTrendPercent}
          color="default"
        />

        <StatCard
          title="Resolved Reports"
          value={stats.verifiedReports}
          subtitle={`${Math.round(
            stats.trendData.verificationRate * 100
          )}% resolve rate`}
          icon={CheckCircle}
          trend="up"
          color="default"
        />

        <StatCard
          title="Reject Reports"
          value={stats.fakeReports}
          subtitle={`${Math.round(
            stats.trendData.fakeRate * 100
          )}% reject rate`}
          icon={XCircle}
          trend="down"
          color="default"
        />

        <StatCard
          title="Pending Reports"
          value={stats.pendingReports}
          subtitle="Awaiting verification"
          icon={Clock}
          color="default"
        />

        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          subtitle="Last 24 hours"
          icon={Users}
          trend="up"
          color="default"
        />

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operational</div>
            <p className="text-xs text-muted-foreground mt-1">
              All systems running normally
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap and Risk Overview */}
      <HeatmapCard />
    </div>
  );
}
