import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import type { Event } from '@/types';
import {
  toDatetimeLocalString,
  maxDatetimeLocal,
  eventIsFullyPast,
  validateEventNotInPast,
} from '@/utils/eventDatetimeLocal';

export function OrganiserEventForm() {
  const { user } = useAuth();
  const { events, addEvent, updateEvent } = useData();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = Boolean(eventId);
  const existing = events.find((e) => e.id === eventId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<string>('');
  const [status, setStatus] = useState<Event['status']>('draft');
  const [submitError, setSubmitError] = useState('');

  const historicalEdit = Boolean(
    isEdit && existing && eventIsFullyPast(existing.endDate)
  );

  const minNow = toDatetimeLocalString(new Date());
  const startMin = historicalEdit ? undefined : minNow;
  const endMin = historicalEdit
    ? startDate || undefined
    : startDate
      ? maxDatetimeLocal(startDate, minNow)
      : minNow;

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setLocation(existing.location);
      setStartDate(existing.startDate.slice(0, 16));
      setEndDate(existing.endDate.slice(0, 16));
      setMaxAttendees(existing.maxAttendees?.toString() ?? '');
      setStatus(existing.status);
    }
  }, [existing]);

  useEffect(() => {
    if (historicalEdit || !startDate || !endDate) return;
    const mn = toDatetimeLocalString(new Date());
    const floor = maxDatetimeLocal(startDate, mn);
    if (endDate < floor) setEndDate(floor);
  }, [startDate, historicalEdit, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const mode = historicalEdit ? 'historicalEdit' : 'strict';
    const pastErr = validateEventNotInPast(startDate, endDate, mode);
    if (pastErr) {
      setSubmitError(pastErr);
      return;
    }
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();
    if (new Date(end).getTime() < new Date(start).getTime()) {
      setSubmitError('End must be on or after start.');
      return;
    }
    try {
      if (isEdit && eventId) {
        await updateEvent(eventId, {
          title,
          description,
          location,
          startDate: start,
          endDate: end,
          maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
          status,
        });
        navigate('/organiser/events');
      } else {
        await addEvent({
          title,
          description,
          location,
          startDate: start,
          endDate: end,
          organiserId: user!.id,
          organiserName: user!.name,
          status,
          maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        });
        navigate('/organiser/events');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save the event.');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Event' : 'New Event'}</h1>
        <p className="text-slate-600 mt-1">
          {isEdit ? 'Update event details' : 'Create a new school event'}
        </p>
        {!historicalEdit && (
          <p className="text-sm text-slate-500 mt-2">
            Start and end must be today or later — past times cannot be selected in the calendar.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            placeholder="Event title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            placeholder="Event description"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            placeholder="Venue or room"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              min={startMin}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              min={endMin}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max attendees (optional)</label>
          <input
            type="number"
            min="1"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            placeholder="Leave empty for unlimited"
          />
        </div>
        {isEdit && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Event['status'])}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary"
          >
            {isEdit ? 'Save changes' : 'Create event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/organiser/events')}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
