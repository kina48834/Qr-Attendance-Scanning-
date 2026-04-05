import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { EventListSearchBar } from '@/components/EventListSearchBar';
import { filterEventsBySearch } from '@/utils/eventSearch';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  ANALYTICS_ATTENDED_FILL,
  ANALYTICS_REGISTERED_FILL,
  analyticsCartesianGridProps,
  analyticsTooltipContentStyle,
} from '@/constants/analyticsCharts';

export function OrganiserAnalytics() {
  const { user } = useAuth();
  const { events, getAnalytics, getEventAttendance } = useData();
  const [eventSearch, setEventSearch] = useState('');
  const myEvents = useMemo(() => events.filter((e) => e.organiserId === user?.id), [events, user?.id]);
  const { eventParticipation } = getAnalytics();
  const myParticipation = useMemo(
    () => eventParticipation.filter((p) => myEvents.some((e) => e.id === p.eventId)),
    [eventParticipation, myEvents]
  );
  const filteredMyEvents = useMemo(() => filterEventsBySearch(myEvents, eventSearch), [myEvents, eventSearch]);
  const filteredParticipation = useMemo(() => {
    if (!eventSearch.trim()) return myParticipation;
    const ids = new Set(filteredMyEvents.map((e) => e.id));
    return myParticipation.filter((p) => ids.has(p.eventId));
  }, [myParticipation, filteredMyEvents, eventSearch]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Event Analytics</h1>
        <p className="text-slate-600 mt-1">Participation and attendance for your events</p>
      </div>

      {myEvents.length > 0 && (
        <EventListSearchBar
          id="organiser-analytics-events-search"
          value={eventSearch}
          onChange={setEventSearch}
          className="max-w-xl"
        />
      )}

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-6 ring-1 ring-blue-950/[0.04]">
        <h2 className="font-semibold text-slate-900 mb-1">Participation by event</h2>
        <p className="text-xs text-slate-500 mb-4">Registered vs attended for your events</p>
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
          ) : myParticipation.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">No event data yet.</div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">No events match your search.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Summary</h2>
        </div>
        <div className="p-5 space-y-2">
          {filteredMyEvents.map((evt) => {
            const count = getEventAttendance(evt.id).length;
            return (
              <div key={evt.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-900">{evt.title}</span>
                <span className="text-slate-600">{count} attended</span>
              </div>
            );
          })}
          {myEvents.length === 0 && <p className="text-slate-500">No events to show.</p>}
          {myEvents.length > 0 && filteredMyEvents.length === 0 && (
            <p className="text-slate-500">No events match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
