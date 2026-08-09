import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Booking } from '@shared/types';

interface LabMap { [id: string]: string }

export default function ClubBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);
  const [labMap, setLabMap] = useState<LabMap>({});
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  useEffect(() => {
    fetch('/api/labs').then(r => r.json()).then(j => {
      if (j.success) {
        const map: LabMap = {};
        j.data.forEach((l: any) => map[l._id] = l.name);
        setLabMap(map);
      }
    }).catch(() => {});
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/bookings/club-pending/${user._id}`);
      const j = await res.json();
      if (j.success) setBookings(j.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const body: any = { action, approvedBy: user._id };
      if (action === 'reject') body.rejectionReason = 'Rejected via UI';
      const res = await fetch(`/api/bookings/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await res.json();
      if (j.success) fetchBookings();
      else alert(j.message || 'Error');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Club Pending Bookings</h2>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lab</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(b => (
            <TableRow key={b._id}>
              <TableCell>{labMap[b.labId] || b.labId}</TableCell>
              <TableCell>{b.date}</TableCell>
              <TableCell>{b.startTime} - {b.endTime}</TableCell>
              <TableCell>{b.purpose}</TableCell>
              <TableCell>
                <Button variant="ghost" onClick={() => handleAction(b._id!, 'approve')}>Approve</Button>
                <Button variant="destructive" onClick={() => handleAction(b._id!, 'reject')}>Reject</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
