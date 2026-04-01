import { useMemo, useState } from 'react';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0f766e', '#14b8a6', '#0d9488', '#134e4a'];

export function AdminAnalytics() {
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
          id="admin-analytics-events-search"
          value={eventSearch}
          onChange={setEventSearch}
          className="max-w-xl"
          placeholder="Filter event participation chart by title, location, organiser…"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Event Participation</h2>
          <div className="h-80">
            {filteredParticipation.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredParticipation} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <XAxis dataKey="eventTitle" angle={-30} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="registered" fill="#94a3b8" name="Registered" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="attended" fill="#0f766e" name="Attended" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : eventParticipation.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No event data yet.</div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">No events match your search.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4">User Activity by Role</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userActivity}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={false}
                  labelLine={false}
                >
                  {userActivity.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value} labelFormatter={(label: string) => label} />
                <Legend formatter={(value: string) => value} wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Attendance Trends Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceTrends} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0f766e" name="Scans" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
