import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  ANALYTICS_ATTENDED_FILL,
  ANALYTICS_REGISTERED_FILL,
  ANALYTICS_TREND_FILL,
  ANALYTICS_PIE_FILLS,
  analyticsCartesianGridProps,
  analyticsTooltipContentStyle,
} from '@/constants/analyticsCharts';

export function TeacherAnalytics() {
  const { events, getAnalytics } = useData();
  const [eventSearch, setEventSearch] = useState('');
  const { eventParticipation, attendanceTrends, userActivity } = getAnalytics();

  const filteredParticipation = useMemo(() => {
    if (!eventSearch.trim()) return eventParticipation;
    const ids = new Set(filterEventsBySearch(events, eventSearch).map((e) => e.id));
    return eventParticipation.filter((p) => ids.has(p.eventId));
  }, [events, eventParticipation, eventSearch]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
        <p className="text-slate-600 mt-1">Event participation, attendance trends, and user activity</p>
      </div>

      {events.length > 0 && (
        <EventListSearchBar
          id="teacher-analytics-events-search"
          value={eventSearch}
          onChange={setEventSearch}
          className="max-w-xl"
          placeholder="Filter event participation chart by title, location, organiser…"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 ring-1 ring-blue-950/[0.04]">
          <h2 className="font-semibold text-slate-900 mb-1">Event participation</h2>
          <p className="text-xs text-slate-500 mb-4">Registered vs attended per event</p>
          <div className="h-80">
            {filteredParticipation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredParticipation} margin={{ top: 8, right: 8, left: 0, bottom: 60 }}>
                  <CartesianGrid {...analyticsCartesianGridProps} />
                  <XAxis dataKey="eventTitle" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={analyticsTooltipContentStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
                  <Bar dataKey="registered" fill={ANALYTICS_REGISTERED_FILL} name="Registered" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="attended" fill={ANALYTICS_ATTENDED_FILL} name="Attended" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : eventParticipation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No event data yet.</div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No events match your search.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 ring-1 ring-blue-950/[0.04]">
          <h2 className="font-semibold text-slate-900 mb-1">User activity by role</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution across roles</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userActivity}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={88}
                  paddingAngle={2}
                  label={false}
                  labelLine={false}
                >
                  {userActivity.map((_, i) => (
                    <Cell key={i} fill={ANALYTICS_PIE_FILLS[i % ANALYTICS_PIE_FILLS.length]} stroke="#fff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value}
                  labelFormatter={(label: string) => label}
                  contentStyle={analyticsTooltipContentStyle}
                />
                <Legend formatter={(value: string) => value} wrapperStyle={{ paddingTop: '16px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 ring-1 ring-blue-950/[0.04]">
        <h2 className="font-semibold text-slate-900 mb-1">Attendance trends</h2>
        <p className="text-xs text-slate-500 mb-4">Scans recorded over time</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceTrends} margin={{ top: 8, right: 8, left: 0, bottom: 30 }}>
              <CartesianGrid {...analyticsCartesianGridProps} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={analyticsTooltipContentStyle} cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }} />
              <Bar dataKey="count" fill={ANALYTICS_TREND_FILL} name="Scans" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
