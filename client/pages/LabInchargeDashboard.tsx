import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lab, Booking } from '@shared/types';

export default function LabInchargeDashboard() {
  const [user, setUser] = useState<any>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking[]>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) return navigate('/login');
    const parsed = JSON.parse(u);
    setUser(parsed);
    fetchLabs(parsed);
  }, [navigate]);

  const fetchLabs = async (u: any) => {
    try {
      const res = await fetch('/api/admin/labs');
      const j = await res.json();
      if (j.success) {
        const mine = j.data.filter((l: any) => l.labInchargeId === u._id);
        setLabs(mine);
      }
    } catch (err) { console.error(err); }
  };

  const viewBookings = async (labId: string) => {
    try {
      const res = await fetch(`/api/bookings/lab/${labId}`);
      const j = await res.json();
      if (j.success) setBookings(prev => ({ ...prev, [labId]: j.data }));
    } catch (err) { console.error(err); }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', approvedBy: user._id }) });
      const j = await res.json();
      if (j.success) {
        // refresh bookings
        Object.keys(bookings).forEach(id => viewBookings(id));
      } else alert(j.message || 'Error');
    } catch (err) { console.error(err); }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', approvedBy: user._id, rejectionReason: 'Rejected by lab incharge' }) });
      const j = await res.json();
      if (j.success) Object.keys(bookings).forEach(id => viewBookings(id));
      else alert(j.message || 'Error');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Lab Incharge — Managed Labs</h2>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>

      {labs.map(lab => (
        <Card key={lab._id} className="mb-4">
          <CardHeader>
            <CardTitle>{lab.name} — {lab.capacity} seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Button onClick={() => viewBookings(lab._id!)}>View Bookings</Button>
            </div>
            {bookings[lab._id!] && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings[lab._id!].map(b => (
                    <TableRow key={b._id}>
                      <TableCell>{b.date}</TableCell>
                      <TableCell>{b.startTime} - {b.endTime}</TableCell>
                      <TableCell>{b.purpose}</TableCell>
                      <TableCell>{b.status}</TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => handleApprove(b._id!)}>Approve</Button>
                        <Button variant="destructive" onClick={() => handleReject(b._id!)}>Reject</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ))}

      {labs.length === 0 && <div className="text-muted-foreground">You are not assigned as incharge for any labs.</div>}
    </div>
  );
}
