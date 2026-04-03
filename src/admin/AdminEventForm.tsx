import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import type { Event } from '@/types';

export function AdminEventForm() {
  const { events, users, addEvent, updateEvent } = useData();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = Boolean(eventId);
  const existing = events.find((e) => e.id === eventId);
  const organisers = users.filter((u) => u.role === 'organiser' || u.role === 'teacher');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<string>('');
  const [status, setStatus] = useState<Event['status']>('draft');
  const [organiserId, setOrganiserId] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setDescription(existing.description);
      setLocation(existing.location);
      setStartDate(existing.startDate.slice(0, 16));
      setEndDate(existing.endDate.slice(0, 16));
      setMaxAttendees(existing.maxAttendees?.toString() ?? '');
      setStatus(existing.status);
      setOrganiserId(existing.organiserId);
    } else if (organisers.length > 0 && !organiserId) {
      setOrganiserId(organisers[0].id);
    }
  }, [existing, organisers, organiserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const organiser = users.find((u) => u.id === organiserId);
    if (!organiser && !isEdit) {
      return;
    }
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();
    if (isEdit && eventId) {
      updateEvent(eventId, {
        title,
        description,
        location,
        startDate: start,
        endDate: end,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        status,
        ...(organiser && { organiserId: organiser.id, organiserName: organiser.name }),
      });
      navigate('/admin/events');
    } else if (organiser) {
      addEvent({
        title,
        description,
        location,
        startDate: start,
        endDate: end,
        organiserId: organiser.id,
        organiserName: organiser.name,
        status,
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      });
      navigate('/admin/events');
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Event' : 'Add Event'}</h1>
        <p className="text-slate-600 mt-1">
          {isEdit ? 'Update event details' : 'Create a new event and assign an organiser'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Organiser/Teacher</label>
          <select
            value={organiserId}
            onChange={(e) => setOrganiserId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
          >
            <option value="">Select organiser or teacher...</option>
            {isEdit && existing && !organisers.some((o) => o.id === existing.organiserId) && (
              <option value={existing.organiserId}>{existing.organiserName} (reassign below)</option>
            )}
            {organisers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.email})
              </option>
            ))}
          </select>
          {organisers.length === 0 && !existing && (
            <p className="text-sm text-amber-600 mt-1">No organisers or teachers yet. Add one in User Management.</p>
          )}
        </div>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Max attendees (optional)</label>
          <input
            type="number"
            min={1}
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-campus-primary focus:border-campus-primary"
            placeholder="Leave empty for unlimited"
          />
        </div>
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
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-campus-primary text-white rounded-lg font-medium hover:bg-campus-secondary"
          >
            {isEdit ? 'Save changes' : 'Add event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/events')}
            className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
