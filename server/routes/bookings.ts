import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../db";
import { Booking, ApiResponse, User, Club } from "@shared/types";

export const getBookings: RequestHandler = async (req, res) => {
  try {
    const { userId, status, clubId, pendingFor } = req.query;
    const db = await getDatabase();
    
    let query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (clubId) {
      query.clubId = clubId;
    }
    
    // Special query for approval workflows
    if (pendingFor === 'club') {
      query.status = 'pending_club_approval';
    } else if (pendingFor === 'lab') {
      query.status = 'pending_lab_approval';
    }
    
    const bookings = await db.collection<Booking>('bookings').find(query).toArray();
    
    res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const createBooking: RequestHandler = async (req, res) => {
  try {
    const { labId, userId: rawUserId, clubId, date, startTime, endTime, purpose } = req.body;
    let userId = rawUserId;

    // If userId is not provided in the body, attempt to read from Authorization token
    if (!userId) {
      const authHeader = req.headers.authorization?.replace('Bearer ', '');
      if (authHeader) {
        try {
          // Lazy import to avoid top-level dependency changes
          const jwt = await import('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
          const decoded = jwt.verify(authHeader, JWT_SECRET) as { userId?: string } | string;
          if (typeof decoded === 'object' && (decoded as any).userId) {
            userId = (decoded as any).userId;
          }
        } catch (err) {
          // ignore token errors here; we will handle missing user later
        }
      }
    }

    const db = await getDatabase();

    // Get user to check their role
    // Normalize various _id shapes (string, { $oid: string }, ObjectId)
    let objectIdToQuery: any = userId;
    if (userId && typeof userId === 'object' && (userId as any).$oid) {
      objectIdToQuery = (userId as any).$oid;
    }
    try {
      objectIdToQuery = new ObjectId(objectIdToQuery);
    } catch (err) {
      // If conversion fails, leave as-is (query by string fallback)
    }

    const user = await db.collection<User>('users').findOne({ _id: objectIdToQuery });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      } as ApiResponse);
    }

    // Check for conflicts - fetch same-lab/date bookings and check time overlap in JS
    const candidates = await db.collection<Booking>('bookings').find({
      labId,
      date,
      status: { $in: ['pending_club_approval', 'pending_lab_approval', 'approved'] }
    }).toArray();

    const toMinutes = (t: string) => {
      const [hh, mm] = (t || '').split(':').map(Number);
      if (Number.isFinite(hh) && Number.isFinite(mm)) return hh * 60 + mm;
      return null;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newStart === null || newEnd === null) {
      return res.status(400).json({ success: false, message: 'Invalid start or end time' } as ApiResponse);
    }

    const overlap = candidates.some(b => {
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);
      if (bStart === null || bEnd === null) return false;
      // Overlap if start < otherEnd AND end > otherStart
      return newStart < bEnd && newEnd > bStart;
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: 'Time slot already booked' } as ApiResponse);
    }

    // Determine initial status based on user role and booking type
    let initialStatus = 'pending_lab_approval';
    let clubApprovalStatus = undefined;

    // Club members (club_member, club_executive, club_secretary) go through club approval first
    const isClubRole = ['club_member', 'club_executive', 'club_secretary'].includes(user.role);

    if (clubId && isClubRole) {
      // Club booking by club members - needs club approval first
      initialStatus = 'pending_club_approval';
      clubApprovalStatus = 'pending';
    }
    // Faculty and lab_incharge bookings go directly to lab approval regardless of clubId
    
    const newBooking: Booking = {
      labId,
      userId,
      clubId,
      date,
      startTime,
      endTime,
      purpose,
      status: initialStatus as any,
      ...(clubApprovalStatus && { clubApprovalStatus }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<Booking>('bookings').insertOne(newBooking);
    
    res.status(201).json({ 
      success: true, 
      data: { ...newBooking, _id: result.insertedId } 
    } as ApiResponse<Booking>);
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const updateBookingStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, approvedBy, rejectionReason } = req.body; // 'approve' or 'reject'
    
    const db = await getDatabase();
    
    // Get current booking
    const booking = await db.collection<Booking>('bookings').findOne({ _id: new ObjectId(id) });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' } as ApiResponse);
    }
    
    // Get approver info
    const approver = await db.collection<User>('users').findOne({ _id: new ObjectId(approvedBy) });

    if (!approver) {
      return res.status(404).json({ success: false, message: 'Approver not found' } as ApiResponse);
    }
    
    let updateData: Partial<Booking> = {
      updatedAt: new Date()
    };
    
    if (action === 'approve') {
      if (booking.status === 'pending_club_approval') {
        // Club incharge approval - ensure approver is club_incharge for the club or admin
        if (approver.role === 'club_incharge') {
          if (!booking.clubId) {
            return res.status(400).json({ success: false, message: 'Booking has no club to approve' } as ApiResponse);
          }
          const club = await db.collection<Club>('clubs').findOne({ _id: new ObjectId(booking.clubId) });
          const clubInchargeId = club?.clubInchargeId;
          if (!clubInchargeId || clubInchargeId !== approvedBy) {
            return res.status(403).json({ success: false, message: 'Not authorized to approve this club booking' } as ApiResponse);
          }

          // Authorized
          updateData.status = 'pending_lab_approval';
          updateData.clubApprovalStatus = 'approved';
          updateData.clubApprovedBy = approvedBy;
          updateData.clubApprovedAt = new Date();
        } else if (approver.role === 'admin') {
          // Admin can approve and forward
          updateData.status = 'pending_lab_approval';
          updateData.clubApprovalStatus = 'approved';
          updateData.clubApprovedBy = approvedBy;
          updateData.clubApprovedAt = new Date();
        } else {
          return res.status(403).json({ success: false, message: 'Invalid approver for club approval' } as ApiResponse);
        }
      } else if (booking.status === 'pending_lab_approval') {
        // Lab incharge or admin final approval; if lab_incharge ensure assigned to same lab
        if (approver.role === 'lab_incharge') {
          if (!approver.labId || approver.labId !== booking.labId) {
            return res.status(403).json({ success: false, message: 'Not authorized to approve bookings for this lab' } as ApiResponse);
          }
          updateData.status = 'approved';
          updateData.labApprovedBy = approvedBy;
          updateData.labApprovedAt = new Date();
        } else if (approver.role === 'admin') {
          updateData.status = 'approved';
          updateData.labApprovedBy = approvedBy;
          updateData.labApprovedAt = new Date();
        } else {
          return res.status(403).json({ success: false, message: 'Invalid approver for lab approval' } as ApiResponse);
        }
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid approval action for current status' 
        } as ApiResponse);
      }
    } else if (action === 'reject') {
      if (booking.status === 'pending_club_approval' && approver.role === 'club_incharge') {
        updateData.status = 'rejected_by_club';
        updateData.clubApprovalStatus = 'rejected';
        updateData.clubApprovedBy = approvedBy;
        updateData.clubApprovedAt = new Date();
      } else if (booking.status === 'pending_lab_approval' && 
                 (approver.role === 'lab_incharge' || approver.role === 'admin')) {
        updateData.status = 'rejected_by_lab';
        updateData.labApprovedBy = approvedBy;
        updateData.labApprovedAt = new Date();
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid rejection action for current status' 
        } as ApiResponse);
      }
      
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }
    
    const result = await db.collection<Booking>('bookings').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Booking status updated successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const deleteBooking: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDatabase();
    
    const result = await db.collection<Booking>('bookings').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' } as ApiResponse);
    }
    
    res.json({ success: true, message: 'Booking deleted successfully' } as ApiResponse);
    
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const getBookingsByLab: RequestHandler = async (req, res) => {
  try {
    const { labId } = req.params;
    const { date } = req.query;
    
    const db = await getDatabase();
    
    let query: any = { labId };
    
    if (date) {
      query.date = date;
    }
    
    const bookings = await db.collection<Booking>('bookings')
      .find(query)
      .sort({ date: 1, startTime: 1 })
      .toArray();
    
    res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
  } catch (error) {
    console.error('Get bookings by lab error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const getClubPendingBookings: RequestHandler = async (req, res) => {
  try {
    const { clubInchargeId } = req.params;
    
    const db = await getDatabase();
    
    // Find clubs where user is the incharge
    const clubs = await db.collection<Club>('clubs').find({ clubInchargeId }).toArray();
    const clubIds = clubs.map(club => club._id?.toString()).filter(Boolean);
    
    if (clubIds.length === 0) {
      return res.json({ success: true, data: [] } as ApiResponse<Booking[]>);
    }
    
    // Get pending bookings for these clubs
    const bookings = await db.collection<Booking>('bookings')
      .find({ 
        clubId: { $in: clubIds },
        status: 'pending_club_approval'
      })
      .toArray();
    
    res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
  } catch (error) {
    console.error('Get club pending bookings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};

export const getLabPendingBookings: RequestHandler = async (req, res) => {
  try {
    const { labInchargeId } = req.params;
    
    const db = await getDatabase();
    
    // Find labs where user is the incharge
    const labIncharge = await db.collection<User>('users').findOne({ 
      _id: new ObjectId(labInchargeId),
      role: { $in: ['lab_incharge', 'admin'] }
    });
    
    if (!labIncharge) {
      return res.status(403).json({ success: false, message: 'Unauthorized' } as ApiResponse);
    }
    
    let query: any = { status: 'pending_lab_approval' };
    
    // If lab incharge (not admin), filter by their assigned lab
    if (labIncharge.role === 'lab_incharge' && labIncharge.labId) {
      query.labId = labIncharge.labId;
    }
    
    const bookings = await db.collection<Booking>('bookings').find(query).toArray();
    
    res.json({ success: true, data: bookings } as ApiResponse<Booking[]>);
  } catch (error) {
    console.error('Get lab pending bookings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' } as ApiResponse);
  }
};
