# GrandStay Frontend

## 1. Frontend Overview

The frontend is the current, runnable part of GrandStay: a responsive hotel, resort, villa, and bungalow discovery and booking-review prototype. It is built with React and Vite and uses local sample data plus browser-side state. It does not connect to a live hotel inventory, backend API, or persistent database.

The hotel and villa booking flows are separate. Hotel bookings select a room category; villa bookings use whole-property rental pricing.

## 2. Technology Stack

The versions below are the dependency ranges declared by `frontend/package.json`.

| Technology | Use | Declared version |
| --- | --- | --- |
| React / React DOM | UI and component state | `^19.3.1` |
| JavaScript / JSX | Application language | — |
| React Router DOM | Client-side routes | `^7.18.4` |
| Vite | Development server and production build | `^8.3.0` |
| `@vitejs/plugin-react` | Vite React support | `^6.1.1` |
| CSS | Component styling and responsive layouts | — |
| Leaflet | Interactive maps | `^1.9.4` |
| React Leaflet | Declared map-related dependency | `^5.0.0` |
| Oxlint | Lint command | `^1.81.0` |

Map components use Leaflet directly and display OpenStreetMap tiles. Map tiles are loaded from the OpenStreetMap tile service, so map viewing needs network access.

The repository has a root `bun.lock` and root workspace manifest. The root also defines npm workspace scripts.

## 3. Implemented Frontend Features

### Homepage and navigation

- GrandStay-branded responsive homepage and shared header/footer.
- Navigation for Hotels & Resorts, Villas & Bungalows, Deals & Offers, and Tours & Camping Packages.
- Homepage search with stay type, destination suggestions, date range, guest/room controls, and routes to the matching catalog.
- Featured hotel and villa cards, destination cards, tour previews, and sample promotional offers.
- Prototype sign-in and registration modal backed by browser storage; this is not server authentication.

### Hotel catalog and discovery

- Hotel listing with sorting and filter controls for destination, price, star rating, amenities, property type, booking conditions, meal plans, accessibility, review threshold, and supported distance options.
- Filter and search values represented in URL query parameters where supported.
- List/map view switch with Leaflet markers, OpenStreetMap tiles, and property previews.
- Sample-data availability notes are shown only where those fields exist; they do not represent live inventory.

### Hotel details

- Dedicated `/hotels/:hotelId` pages with a photo gallery, hotel information, amenities, and room comparison.
- Optional sightseeing tour selection.
- Property map and nearby location information where sample data is available.
- Sample ratings, reviews, review filters, policies, and frequently asked questions.

### Villas and bungalows

- Dedicated catalog, trending page, and property details for whole-property stays.
- Guest capacity, bedrooms/bathrooms, amenities, photographs, and date-based rental estimates from sample records.
- Villa booking uses a separate route and whole-property calculation rather than hotel room selection.

### Booking and checkout interface

- Hotel and villa booking review experiences on separate flows.
- Shared date-range picker and stay-duration calculations.
- Hotel room selection, room count, guest allocation (including adult/child details where shown), rate-plan and price-estimate UI.
- Villa whole-property guest allocation and rental total estimate.
- Lead guest details, special requests, and payment-method selection UI in the booking prototype.
- Local confirmation and downloadable text voucher UI where implemented.

All booking details, payment choices, and confirmations are prototype interactions. They do not create persisted reservations, check live availability, process payments, or generate a server-issued invoice.

### Design system and responsive UI

- Shared buttons, cards, badges, inputs, icons, loading/empty/error states, and design tokens.
- Responsive navigation, catalogs, maps, details, and booking forms.
- A design-system showcase is retained at `/design-system` for project review.

## 4. Application Routes

Routes are declared in `src/App.jsx`.

| Route | Page |
| --- | --- |
| `/` | Homepage |
| `/hotels` | Hotel catalog |
| `/hotels/:hotelId` | Hotel details |
| `/trending-hotels` | Trending hotels |
| `/villas` | Villa and bungalow catalog |
| `/villas/:villaId` | Villa or bungalow details |
| `/trending-villas` | Trending villas |
| `/booking` | Hotel booking review |
| `/villas/:villaId/booking` | Separate villa booking review |
| `/design-system` | Design-system showcase |
| `/my-stays` | Placeholder route requiring the prototype auth gate |
| `/history` | Placeholder route requiring the prototype auth gate |
| `/settings` | Placeholder page |
| `/about` | Placeholder page |

The placeholder routes are not complete dashboards or account-management features.

## 5. Frontend Architecture

- `src/App.jsx` configures `BrowserRouter` and the route table. It also retains the design-system showcase.
- `src/pages/` contains route-level page components.
- `src/components/` holds reusable UI, catalog, homepage, and shared layout components.
- `src/styles/variables.css` and `src/styles/global.css` provide design tokens and global styles; components and pages also have focused CSS files.
- Vite loads `src/main.jsx`, which mounts the React application.

The frontend uses client-side routing. Booking context is passed between pages using route state and, for catalog searches, URL query parameters.

## 6. Data and Service Layer

Current demonstration data is stored in JavaScript modules:

- `src/data/sampleHotels.js` and `src/data/trendingHotels.js`
- `src/data/villas.js`
- `src/data/sampleDestinations.js`
- `src/data/sampleTours.js`
- `src/data/sampleOffers.js`

`src/services/hotelService.js` provides hotel listing, filtering, and lookup helpers. `src/services/villaService.js` provides villa listing and lookup helpers. These services currently work with local data; they do not make HTTP requests.

`src/data/authSession.js` stores prototype user/session information in browser storage. This is for interface demonstration only and is not secure authentication.

## 7. Project Structure

```text
frontend/
├── package.json
├── vite.config.js
├── public/
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── assets/
    ├── components/
    │   ├── catalog/       # Hotel filter sidebar and catalog map
    │   ├── common/        # Shared controls, cards, maps, and UI states
    │   ├── home/          # Homepage sections and sign-in modal
    │   └── layout/        # Header, footer, and container
    ├── data/              # Sample properties, destinations, tours, and offers
    ├── pages/             # Homepage, catalog, detail, booking, and placeholder routes
    ├── services/          # Local hotel and villa data access
    ├── styles/            # Global CSS and design tokens
    └── utils/             # Shared date and rental helpers
```

## 8. Installation and Setup

### Prerequisites

- Node.js
- Bun for installing from the checked-in `bun.lock`

No frontend environment file is required for the current sample-data prototype. OpenStreetMap tiles and some property images are remote resources and require network access.

### Install and start

From the repository root:

```bash
bun install
cd frontend
bun run dev
```

Vite serves the application at [http://localhost:3000](http://localhost:3000). The dev server configuration binds to `0.0.0.0` on port `3000`.

## 9. Development Commands

Run these from `frontend/` after dependencies are installed:

```bash
bun run dev      # Start Vite development server
bun run lint     # Run Oxlint
bun run build    # Create the production frontend build
bun run preview  # Preview the built frontend
```

The root `package.json` also exposes workspace commands: `npm run dev`, `npm run lint`, `npm run build`, and `npm run preview`.

## 10. Current Limitations

- Property, review, destination, tour, and offer data are samples, not live inventory.
- Prototype authentication is browser-side and does not validate credentials against a server.
- Booking and guest information is not saved to a persistent database.
- Availability is not checked and no reservation is confirmed by the frontend.
- Payment method controls are interface-only; no payment provider is connected.
- Any local confirmation or text voucher is not a server-issued invoice or proof of a real reservation.
- Some account routes are placeholders.
- Maps depend on remote OpenStreetMap tiles.

## 11. Planned Backend Integration

The current roadmap specifies a future backend using Node.js, Express.js, and MongoDB; Mongoose may be selected during implementation. No backend code or database connection is present yet.

Planned integration work includes:

1. Agree on the backend architecture, data models, authentication approach, and API contract.
2. Build and validate the Express API and MongoDB models.
3. Replace the local reads in the service layer with API requests.
4. Add server-side authentication, authorization, availability checks, booking validation, pricing, and persistence.
5. Add payment and invoice integrations only if confirmed in the academic project scope.
6. Test frontend/API integration and configure deployment.

Older source comments still refer to a Django REST Framework/MySQL plan. They are historical comments; this README reflects the newer backend direction in the current documentation brief. The final stack should be confirmed before implementation.

## 12. Future Frontend Work

- Connect the hotel and villa service modules to the agreed backend API.
- Add clear loading, empty, validation, and server-error handling for API requests.
- Replace prototype auth state with the approved backend authentication flow.
- Connect customer history and administration screens after their requirements are defined.
- Verify end-to-end booking, availability, and payment states against backend responses.
