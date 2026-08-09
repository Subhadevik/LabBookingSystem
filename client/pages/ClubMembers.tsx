import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User } from '@shared/types';

export default function ClubMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [user, setUser] = useState<any>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (user) fetchMembers();
  }, [user]);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/clubs');
      const j = await res.json();
      if (j.success) {
        // find club managed by this user
        const myClub = j.data.find((c: any) => c.clubInchargeId === user._id);
        if (!myClub) return;
        setClubId(myClub._id);
        const membersRes = await fetch(`/api/clubs/${myClub._id}`);
        const mjson = await membersRes.json();
        if (mjson.success) setMembers(mjson.data.members || []);
      }
    } catch (err) { console.error(err); }
  };

  const handleAddMember = async () => {
    setMessage('');
    if (!emailToAdd || !clubId) return setMessage('Provide email and ensure club exists');

    try {
      // find user by email
      const usersRes = await fetch('/api/users');
      const usersJson = await usersRes.json();
      if (!usersJson.success) return setMessage('Unable to fetch users');
      const found = usersJson.data.find((u: any) => u.email === emailToAdd);
      if (!found) return setMessage('No user with that email');

      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: found._id })
      });
      const j = await res.json();
      if (j.success) {
        setMessage('Member added');
        setEmailToAdd('');
        fetchMembers();
      } else setMessage(j.message || 'Error adding member');
    } catch (err) {
      console.error(err); setMessage('Network error');
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!clubId) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: memberId }) });
      const j = await res.json();
      if (j.success) fetchMembers();
      else setMessage(j.message || 'Error removing');
    } catch (err) { console.error(err); setMessage('Network error'); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Club Members</h2>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
      <div className="mb-4 flex gap-2 items-center">
        <input className="input" placeholder="member@example.com" value={emailToAdd} onChange={(e) => setEmailToAdd(e.target.value)} />
        <Button onClick={handleAddMember}>Add Member</Button>
        {message && <div className="text-sm text-muted-foreground">{message}</div>}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m: any) => (
            <TableRow key={m._id}>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.role}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => handleRemove(m._id)} className="text-destructive">Remove</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
