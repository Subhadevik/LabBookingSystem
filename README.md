# Lab Booking System

A modern lab booking and approval platform for colleges and academic departments. This system helps students, faculty, club incharges, lab incharges, and administrators manage lab reservations, club activity bookings, approvals, and member management through an intuitive web application.

## Dashboard

<img src="https://github.com/user-attachments/assets/6c922687-b593-4060-9f41-11737a350933" alt="Login Page" width="500">

## Overview

The Lab Booking System streamlines the process of reserving laboratories for classes, events, club activities, and department work. It provides a workflow-based approval system so bookings are reviewed by the appropriate club or lab authority before confirmation.

## Key Features

* User authentication and role-based access control
* Lab booking creation and scheduling
* Two-stage booking approvals

  * Club approval
  * Lab approval
* Admin lab management
* Club incharge member management
* Lab incharge dashboard for assigned labs
* Responsive, modern UI built with React and Tailwind CSS
* Backend APIs powered by Express and MongoDB

## Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Node.js, Express, TypeScript
* **Database:** MongoDB
* **Authentication:** JWT + bcrypt

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

* Node.js 18+ recommended
* npm
* MongoDB running locally or a reachable MongoDB URI

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Subhadevik/LabBookingSystem.git
cd LabBookingSystem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the application

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

* Admin
* Faculty
* Lab Incharge
* Club Incharge
* Club Member
* Club Executive
* Club Secretary

## Usage Flow

* Students and faculty can request lab bookings
* Club incharges can approve club-level requests and manage club members
* Lab incharges can manage bookings for their assigned labs
* Admins can manage labs and oversee the system

## Screenshots

### Login Page

<img width="1915" height="864" alt="image" src="https://github.com/user-attachments/assets/1c8fca78-9e83-4276-a46c-a98b6ce00859" alt="Login Page" width="500">

### Booking Page

<img src="https://github.com/user-attachments/assets/7c1f61c0-13c7-4425-adf5-cd48ac6ce4ed" alt="Booking Page" width="100%">

<img src="https://github.com/user-attachments/assets/d21c55bd-1343-4196-aa1a-dee68044c2e4" alt="Booking Details" width="100%">

<img src="https://github.com/user-attachments/assets/3557b75e-001c-4f87-a203-f6415ad96191" alt="Booking Approval Status" width="100%">

### Admin Lab Management

<img src="https://github.com/user-attachments/assets/821eb513-3b78-43d6-ad46-4cadab81b745" alt="Lab Booking System Dashboard" width="100%">

<img src="https://github.com/user-attachments/assets/a91ffaf6-a08e-49e7-98ba-4fed4fc2ef10" alt="Admin Lab Management" width="100%">

### Admin User Management

<img src="https://github.com/user-attachments/assets/49dee312-25be-4a78-9516-71e7406cfed3" alt="Admin User Management" width="100%">

### Admin Club Management

<img src="https://github.com/user-attachments/assets/97b6ec21-8fee-4db8-adfd-20810f5d53ce" alt="Admin Club Management" width="100%">

### Approve Lab Bookings

<img src="https://github.com/user-attachments/assets/3efaba66-dcdb-474a-98c4-cddaf8172b59" alt="Approve Lab Bookings" width="100%">

## Documentation

Additional project notes are available here:

* `docs/lab-management.md`

## License

This project is intended for academic and institutional use.
