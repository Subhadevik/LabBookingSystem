<img width="923" height="1600" alt="image" src="https://github.com/user-attachments/assets/4c6fda59-9f15-45c4-9307-25f9e1bb8dc0" /># Lab Booking System

A modern lab booking and approval platform for colleges and academic departments. This system helps students, faculty, club incharges, lab incharges, and administrators manage lab reservations, club activity bookings, approvals, and member management through an intuitive web application.

![Lab Booking System Dashboard](https://via.placeholder.com/1200x600.png?text=Lab+Booking+System)

## Overview

The Lab Booking System streamlines the process of reserving laboratories for classes, events, club activities, and department work. It provides a workflow-based approval system so bookings are reviewed by the appropriate club or lab authority before confirmation.

## Key Features

- User authentication and role-based access control
- Lab booking creation and scheduling
- Two-stage booking approvals
  - Club approval
  - Lab approval
- Admin lab management
- Club incharge member management
- Lab incharge dashboard for assigned labs
- Responsive, modern UI built with React and Tailwind CSS
- Backend APIs powered by Express and MongoDB

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: MongoDB
- Authentication: JWT + bcrypt

## Project Structure

```text
client/          # React frontend
server/          # Express backend APIs
shared/          # Shared TypeScript types
public/          # Static assets
docs/            # Project documentation
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ recommended
- npm
- MongoDB running locally or a reachable MongoDB URI

## Installation

1. Clone the repository

```bash
git clone https://github.com/Subhadevik/LabBookingSystem.git
cd LabBookingSystem
```

2. Install dependencies

```bash
npm install
```

3. Start the application

```bash
npm run dev
```

The app will start with the Vite development server and show the local URL in the terminal.

## Environment Configuration

If needed, create a `.env` file in the project root with your MongoDB settings.

Example:

```env
MONGODB_URI=mongodb://localhost:27017
DB_NAME=lab_booking_system
```

## User Roles

The application supports these roles:

- Admin
- Faculty
- Lab Incharge
- Club Incharge
- Club Member
- Club Executive
- Club Secretary

## Usage Flow

- Students and faculty can request lab bookings
- Club incharges can approve club-level requests and manage club members
- Lab incharges can manage bookings for their assigned labs
- Admins can manage labs and oversee the system

## Screenshots

You can add your own screenshots here:

![Login Page](<img width="923" height="1600" alt="image" src="https://github.com/user-attachments/assets/6c922687-b593-4060-9f41-11737a350933" />)

![Booking Page](<img width="1600" height="835" alt="image" src="https://github.com/user-attachments/assets/7c1f61c0-13c7-4425-adf5-cd48ac6ce4ed" />)(<img width="1600" height="727" alt="image" src="https://github.com/user-attachments/assets/d21c55bd-1343-4196-aa1a-dee68044c2e4" />)(<img width="1600" height="781" alt="image" src="https://github.com/user-attachments/assets/3557b75e-001c-4f87-a203-f6415ad96191" />)

![Admin Lab Management](<img width="1600" height="727" alt="image" src="https://github.com/user-attachments/assets/a91ffaf6-a08e-49e7-98ba-4fed4fc2ef10" />)

![Admin User Management](<img width="1600" height="960" alt="image" src="https://github.com/user-attachments/assets/49dee312-25be-4a78-9516-71e7406cfed3" />)

![Admin Club Management](<img width="1600" height="681" alt="image" src="https://github.com/user-attachments/assets/97b6ec21-8fee-4db8-adfd-20810f5d53ce" />)

![Approve Lab Bookings](<img width="1600" height="785" alt="image" src="https://github.com/user-attachments/assets/3efaba66-dcdb-474a-98c4-cddaf8172b59" />)


## Documentation

Additional project notes are available here:

- docs/lab-management.md

## License

This project is intended for academic and institutional use.
```

If you want, I can also make it even more professional with:
- a screenshot section using your real images,
- badges for React/Node/MongoDB,
- and a “How it works” diagram.If you want, I can also make it even more professional with:
- a screenshot section using your real images,
- badges for React/Node/MongoDB,
- and a “How it works” diagram.

Made changes.
