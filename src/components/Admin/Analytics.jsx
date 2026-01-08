import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Clock,
  BarChart3,
  PieChartIcon,
  LineChartIcon,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAllReports } from "@/utils/user";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF7C7C",
];

const INCIDENT_TYPES = [
  "accident",
  "traffic",
  "crime",
  "fire",
  "medical",
  "disaster",
  "other",
];

function processAnalyticsData(reports) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  // Weekly Incidents by Type
  const weeklyIncidents = [
    { day: "Sun" },
    { day: "Mon" },
    { day: "Tue" },
    { day: "Wed" },
    { day: "Thu" },
    { day: "Fri" },
    { day: "Sat" },
  ].map((d, i) => {
    const dayReports = reports.filter((r) => {
      const date = new Date(r.timestamp);
      return date.getDay() === i && date >= startOfWeek && date <= today;
    });
    const typeCounts = {};
    INCIDENT_TYPES.forEach((type) => {
      typeCounts[type] = dayReports.filter(
        (r) => r.incidentType === type
      ).length;
    });
    return {
      ...d,
      ...typeCounts,
    };
  });

  // Daily Incidents (last 7 days)
  const dailyIncidents = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);
    const dayReports = reports.filter((r) => {
      const rDate = new Date(r.timestamp).toISOString().slice(0, 10);
      return rDate === dateStr;
    });
    const typeCounts = {};
    INCIDENT_TYPES.forEach((type) => {
      typeCounts[type] = dayReports.filter(
        (r) => r.incidentType === type
      ).length;
    });
    dailyIncidents.push({
      date: dateStr,
      ...typeCounts,
    });
  }

  // Hourly Incidents (0-23)
  const hourlyIncidents = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    incidents: reports.filter((r) => new Date(r.timestamp).getHours() === hour)
      .length,
  }));

  // Alert Types (pie chart)
  const typeCounts = {};
  INCIDENT_TYPES.forEach((type) => {
    typeCounts[type] = reports.filter((r) => r.incidentType === type).length;
  });
  const alertTypes = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // Insights
  const totalIncidents = reports.length;
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);
  const prevWeek = new Date(today);
  prevWeek.setDate(today.getDate() - 14);

  const lastWeekCount = reports.filter(
    (r) => new Date(r.timestamp) >= lastWeek
  ).length;
  const prevWeekCount = reports.filter((r) => {
    const d = new Date(r.timestamp);
    return d >= prevWeek && d < lastWeek;
  }).length;
  const incidentTrend =
    prevWeekCount === 0
      ? 100
      : Math.round(((lastWeekCount - prevWeekCount) / prevWeekCount) * 100);

  // Peak hour
  const hourCounts = hourlyIncidents.map((h) => h.incidents);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Top alert type
  const topAlert = alertTypes.reduce(
    (max, curr) => (curr.value > (max?.value || 0) ? curr : max),
    null
  );

  const avgDailyIncidents = Math.round(totalIncidents / 7);

  const insights = {
    totalIncidents,
    incidentTrend,
    peakHour,
    topAlertType: topAlert?.name || "N/A",
    topAlertCount: topAlert?.value || 0,
    avgDailyIncidents,
  };

  return {
    weeklyIncidents,
    dailyIncidents,
    hourlyIncidents,
    alertTypes,
    insights,
  };
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    try {
      const response = await fetchAllReports();
      if (!response) throw new Error("Failed to fetch analytics data");
      const analytics = processAnalyticsData(response);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast("Error", {
        description: "Failed to fetch analytics data. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading analytics data...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">No analytics data available.</div>
          </div>
        </main>
      </div>
    );
  }

  const {
    weeklyIncidents,
    dailyIncidents,
    hourlyIncidents,
    alertTypes,
    insights,
  } = analyticsData;

  return (
    <div className="min-h-screen  bg-gray-50 p-0">
      <main className="container mx-auto py-1">
        {/* Key Insights Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Incidents
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.totalIncidents}
              </div>
              <p className="text-xs text-muted-foreground">
                {insights.incidentTrend > 0 ? (
                  <span className="text-red-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />+
                    {insights.incidentTrend}% from last week
                  </span>
                ) : (
                  <span className="text-green-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {insights.incidentTrend}% from last week
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.peakHour}:00</div>
              <p className="text-xs text-muted-foreground">
                Most active time for incidents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Alert Type
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.topAlertType}</div>
              <p className="text-xs text-muted-foreground">
                {insights.topAlertCount} occurrences this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Daily Incidents
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {insights.avgDailyIncidents}
              </div>
              <p className="text-xs text-muted-foreground">Per day average</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid - Top Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Weekly Incidents by Type - Bar Chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Weekly Incidents by Type
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <ChartContainer config={{}} className="h-[250px] w-full">
                <BarChart
                  data={weeklyIncidents}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={({ payload }) => (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {payload.map((entry, idx) => (
                          <li
                            key={entry.value}
                            className="flex items-center gap-2"
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                backgroundColor: entry.color,
                                borderRadius: "50%",
                              }}
                            />
                            <span>{entry.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                  <Bar
                    dataKey="accident"
                    stackId="a"
                    fill="#8884d8"
                    name="accident"
                  />
                  <Bar
                    dataKey="traffic"
                    stackId="a"
                    fill="#82ca9d"
                    name="traffic"
                  />
                  <Bar
                    dataKey="crime"
                    stackId="a"
                    fill="#ffc658"
                    name="crime"
                  />
                  <Bar dataKey="fire" stackId="a" fill="#ff7c7c" name="fire" />
                  <Bar
                    dataKey="medical"
                    stackId="a"
                    fill="#ffbb28"
                    name="medical"
                  />
                  <Bar
                    dataKey="disaster"
                    stackId="a"
                    fill="#00c49f"
                    name="disaster"
                  />
                  <Bar
                    dataKey="other"
                    stackId="a"
                    fill="#0088fe"
                    name="other"
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Daily Incident Type - Line Chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChartIcon className="h-5 w-5" />
                Daily Incident Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <ChartContainer config={{}} className="h-[250px] w-full">
                <LineChart
                  data={dailyIncidents}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={({ payload }) => (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {payload.map((entry, idx) => (
                          <li
                            key={entry.value}
                            className="flex items-center gap-2"
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                backgroundColor: entry.color,
                                borderRadius: "50%",
                              }}
                            />
                            <span>{entry.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="accident"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="accident"
                  />
                  <Line
                    type="monotone"
                    dataKey="traffic"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="traffic"
                  />
                  <Line
                    type="monotone"
                    dataKey="crime"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="crime"
                  />
                  <Line
                    type="monotone"
                    dataKey="medical"
                    stroke="#ff7c7c"
                    strokeWidth={2}
                    name="medical"
                  />
                  <Line
                    type="monotone"
                    dataKey="disaster"
                    stroke="#00c49f"
                    strokeWidth={2}
                    name="disaster"
                  />
                  <Line
                    type="monotone"
                    dataKey="other"
                    stroke="#0088fe"
                    strokeWidth={2}
                    name="other"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid - Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Incidents per Hour - Area Chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Incidents per Hour
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <ChartContainer config={{}} className="h-[250px] w-full">
                <AreaChart
                  data={hourlyIncidents}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Most Common Alert Types - Pie Chart */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChartIcon className="h-5 w-5" />
                Most Common Alert Types
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <ChartContainer config={{}} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={alertTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {alertTypes.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={({ payload }) => (
                      <ul className="flex flex-wrap gap-2 mt-2">
                        {payload.map((entry, idx) => (
                          <li
                            key={entry.value}
                            className="flex items-center gap-2"
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                backgroundColor: entry.color,
                                borderRadius: "50%",
                              }}
                            />
                            <span>{entry.value}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
