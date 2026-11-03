# GrandStay | Hotel Booking and Management System

GrandStay is a staged BCA Honours group project exploring how travelers can discover hotels, resorts, villas, and bungalows; compare accommodation options; and prepare a booking. The repository currently contains a substantial React frontend prototype. Backend services, a persistent database, live inventory, and real reservations have not been implemented.

## 1. Project Overview

The project is intended to bring property discovery, stay planning, optional local experiences, and booking review into one responsive web application. It is being developed in stages: the frontend foundation and customer-facing prototype are being built first, with backend integration planned for a later phase.

The frontend uses sample data for demonstration. Prices, availability notes, ratings, and reviews in the prototype are not live hotel inventory or confirmed offers.

## 2. Project Objectives

- Make it easier to discover properties by destination and preferences.
- Present property details, room categories, amenities, location, and review information clearly.
- Support separate hotel-room and whole-property villa booking experiences.
- Let users review guest and stay details and view an estimate before a future reservation is submitted.
- Build the project in stages so the frontend prototype can be reviewed before backend and database work begins.

## 3. Original Project Planning

The broader project plan includes the following capabilities. These are project goals; they should not be read as a claim that each capability is already implemented.

- Search and compare multiple hotels, room categories, and properties by destination and filters.
- Display hotel details, room comparisons, and availability information.
- Register and authenticate customers and manage hotel and villa reservations.
- Support whole-property bookings for villas and bungalows.
- Offer optional sightseeing tours and packages.
- Present pricing breakdowns, coupons, discounts, and downloadable booking documents.
- Support reviews, ratings, maps, nearby places, booking history, and customer dashboards.
- Provide administration tools and management reports.
- Explore recommendations based on hotel information.

## 4. Features Implemented So Far

The completed work is primarily frontend functionality backed by local sample data and browser-side state.

- Responsive GrandStay homepage with destination search, featured stays, villas, offers, and tour previews.
- Hotel catalog with sorting, filters, query-string search state, list/map views, and interactive property previews.
- Hotel details with galleries, room comparison, reviews, policies, location information, and optional tour selection.
- Separate villa and bungalow catalog, details, and whole-property booking flow.
- Hotel booking review with room selection, guest information, guest allocation, rate choices, price estimates, special requests, and payment-method selection UI.
- Prototype sign-in and registration, responsive navigation, and a preserved design-system showcase.
- Leaflet maps using OpenStreetMap tiles for catalog and property location views.

These are interface and prototype interactions. The app does not confirm room availability, create a server-side reservation, charge a payment method, or persist booking records to a database.

## 5. Technology Stack

Versions below are the ranges declared in the package manifests, not promises about an exact installed version.

| Area | Technology |
| --- | --- |
| Frontend | React and React DOM (`^19.3.1`) |
| Language | JavaScript and JSX |
| Routing | React Router DOM (`^7.18.4`) |
| Build and development server | Vite (`^8.3.0`) with the React plugin (`^6.1.1`) |
| Styling | CSS and project design tokens |
| Maps | Leaflet (`^1.9.4`) and OpenStreetMap tiles |
| Linting | Oxlint (`^1.81.0`) |
| Package setup | Bun lockfile and a root workspace manifest; npm workspace scripts are also defined |

The current frontend also declares `react-leaflet` (`^5.0.0`) as a dependency; the map components in the source use Leaflet directly.

## 6. System Architecture and Current Status

```text
Browser
  └── React + Vite frontend
      ├── React Router pages
      ├── Shared components and CSS
      ├── Sample data and browser-side prototype state
      └── Leaflet maps with OpenStreetMap tiles

Backend API and persistent database: planned, not present in this repository
```

The root repository currently contains the frontend workspace and project documentation. There is no implemented backend application or database connection. The hotel and villa service modules currently read local JavaScript data; they are not making API requests.

## 7. Planned Backend Development

The current backend direction for future work is **Node.js, Express.js, and MongoDB**. Mongoose may be used if it is selected during implementation. This is planned work only.

> **Planning note:** Older README text and comments in the frontend service/authentication code refer to Django REST Framework and MySQL. This documentation records the newer Node.js/Express/MongoDB direction from the current project brief. Those older references remain in source and no backend stack has been implemented; the group should confirm the final choice before backend development.

Planned work includes:

### Backend architecture and API

- Create the backend application and its module structure.
- Define REST APIs, request validation, and centralized error handling.
- Configure environment variables and frontend-to-backend communication.
- Replace local service reads with API-backed data access.

### MongoDB data storage

- Select a MongoDB deployment and define collections and references.
- Model users, hotels, room categories, villas, bookings, reviews, coupons, and other agreed project data.
- Migrate the frontend prototype from sample modules to persistent records.

### Authentication and access control

- Add registration and login with secure password hashing.
- Implement session or token handling and customer/admin authorization.

### Reservations, payments, and administration

- Validate booking dates and availability on the server and persist hotel and villa reservations.
- Calculate prices and validate discounts on the backend.
- Add booking history, cancellation handling, and invoice generation if included in the final requirements.
- Build administration workflows for properties, rooms, bookings, customers, reviews, and reports.
- Select and integrate a payment provider only when the project scope and requirements are approved.

### Integration, testing, and deployment

- Connect frontend services to the API and handle loading, validation, and server errors.
- Add backend and integration tests, verify persistence and authorization, then prepare deployment configuration.

## 8. Project Structure

This outline reflects the current repository; there is no `backend/` directory yet.

```text
Project-Hotel-Management/
├── package.json                 # Root workspace scripts
├── bun.lock                     # Dependency lockfile
├── README.md
└── frontend/
    ├── package.json             # Frontend scripts and dependencies
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.jsx               # Browser routes and design-system showcase
        ├── components/           # Common, catalog, home, and layout components
        ├── data/                 # Hotel, villa, destination, tour, and offer data
        ├── pages/                # Customer-facing route pages
        ├── services/             # Local data access helpers
        ├── styles/               # Global styles and design tokens
        └── utils/                # Shared utilities
```

For route details and frontend setup, see [frontend/README.md](frontend/README.md).

## 9. Getting Started

### Prerequisites

- Node.js
- Bun, which matches the checked-in `bun.lock`

The repository does not pin a runtime version in `package.json`.

### Install and run the frontend

From the repository root:

```bash
bun install
cd frontend
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The Vite development script is configured to use port `3000`.

No backend startup command or database setup is available because those parts have not been implemented.

## 10. Development Status

| Area | Status |
| --- | --- |
| Design system, homepage, navigation | Frontend prototype implemented |
| Hotel and villa discovery/details | Frontend prototype implemented with sample data |
| Hotel and villa booking review | Frontend prototype; no reservation persistence or real payment |
| Authentication | Browser-side demonstration only |
| Backend API and database | Pending |
| Production deployment | Pending |

## 11. Future Scope

The next major phase is to confirm the backend architecture and build the API and persistent data layer. Later work can connect the frontend to that API, implement real availability and reservation management, add authenticated customer and admin dashboards, support payment/invoice workflows, and deploy the system. These items remain future scope until implemented and verified.

## 12. Academic Project Information

GrandStay is a BCA Honours group project. This repository documents the current frontend foundation and the planned direction of subsequent development. Team member names and institutional details are intentionally omitted because they are not recorded in the project files.
