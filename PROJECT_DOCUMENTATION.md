# PhotoPin App - Project Documentation

## Code & Testing

### Main Classes and Functions Used in Code

#### Backend Architecture

**1. Controllers (Request Handlers)**
- **`PhotoController`** (`backend/src/controllers/PhotoController.ts`)
  - `uploadPhoto()` - Handles single photo upload with metadata extraction
  - `uploadMultiplePhotos()` - Handles batch photo uploads
  - `getPhotos()` - Retrieves user photos with filtering (year, trip, location, tags)
  - `getTimeline()` - Returns photos grouped by date for timeline view
  - `getMapPins()` - Returns photos with GPS/location data for map display
  - `searchPhotos()` - Searches photos by filename, tags, camera info
  - `getPhoto()` - Retrieves single photo by ID
  - `updatePhoto()` - Updates photo metadata (tags, location, display name, favorite status)
  - `rotatePhoto()` - Rotates photo by 90/180/270 degrees
  - `deletePhoto()` - Deletes photo and associated files
  - `bulkUpdatePhotos()` - Updates multiple photos (tags, location)
  - `bulkDeletePhotos()` - Deletes multiple photos

- **`AuthController`** (`backend/src/controllers/AuthController.ts`)
  - `register()` - Creates new user account in Firebase Auth
  - `getProfile()` - Retrieves authenticated user's profile information

- **`TripController`** (`backend/src/controllers/TripController.ts`)
  - Handles trip/album creation, retrieval, updates, and deletion
  - Manages photo associations with trips

**2. Services (Business Logic Layer)**

- **`PhotoService`** (`backend/src/services/PhotoService.ts`)
  - Core service for photo management operations
  - `uploadPhoto()` - Processes photo upload: extracts EXIF metadata, generates thumbnails, uploads to Firebase Storage, saves to Firestore
  - `getUserPhotos()` - Queries Firestore with advanced filtering (date range, trip, location, tags)
  - `getPhotoById()` - Retrieves single photo with ownership verification
  - `updatePhoto()` - Updates photo metadata with validation
  - `rotatePhoto()` - Rotates image using Sharp library, regenerates thumbnail
  - `deletePhoto()` - Removes photo from Storage and Firestore
  - `getPhotosWithLocation()` - Filters photos with GPS coordinates or location data
  - `searchPhotos()` - Performs client-side text search across photo metadata
  - `getPhotoTimeline()` - Groups photos by date (YYYY-MM-DD format)
  - `bulkUpdatePhotos()` - Batch updates tags and location for multiple photos
  - `bulkDeletePhotos()` - Batch deletes multiple photos

- **`TripService`** (`backend/src/services/TripService.ts`)
  - Manages trip/album functionality
  - `createTrip()` - Creates new trip with associated photos
  - `getUserTrips()` - Retrieves all trips for a user
  - `getTripById()` - Retrieves single trip with ownership check
  - `updateTrip()` - Updates trip metadata
  - `deleteTrip()` - Deletes trip and removes tripId from photos
  - `addPhotosToTrip()` - Associates photos with existing trip
  - `autoClusterPhotos()` - Automatically groups photos into trips based on location and time proximity
  - `generateTripName()` - Creates human-readable trip names (e.g., "Weekend in Galway")

- **`GooglePhotosService`** (`backend/src/services/GooglePhotosService.ts`)
  - Handles Google Photos API integration
  - OAuth 2.0 authentication flow
  - Photo import with metadata preservation
  - Downloads full-resolution images from Google Photos

- **`GeocodingService`** (`backend/src/services/GeocodingService.ts`)
  - Converts addresses to GPS coordinates (forward geocoding)
  - Converts GPS coordinates to addresses (reverse geocoding)
  - Uses Google Maps Geocoding API

- **`MapService`** (`backend/src/services/MapService.ts`)
  - Provides map-related utilities and calculations

**3. Utilities**

- **`PhotoMetadataUtil`** (`backend/src/utils/photoMetadata.ts`)
  - `extractMetadata()` - Extracts EXIF data (GPS, camera info, date taken) using `exifr` library
  - `generateThumbnail()` - Creates optimized thumbnails using Sharp library
  - `generateTags()` - Automatically generates tags based on metadata
  - `calculateDistance()` - Calculates distance between two GPS coordinates (Haversine formula)
  - `isValidImageFile()` - Validates file types (JPEG, PNG, WebP, GIF, HEIC)

**4. Middleware**

- **`authMiddleware`** (`backend/src/middleware/authMiddleware.ts`)
  - Verifies Firebase ID tokens
  - Attaches user information to request object
  - Protects routes from unauthorized access

- **`errorHandler`** (`backend/src/middleware/errorHandler.ts`)
  - Global error handling middleware
  - Formats error responses consistently

- **`upload`** (`backend/src/middleware/upload.ts`)
  - Multer middleware for file uploads
  - Validates file size and type
  - Handles multipart/form-data

**5. Configuration**

- **`firebaseAdmin`** (`backend/src/config/firebaseAdmin.ts`)
  - Initializes Firebase Admin SDK
  - Provides Firestore, Auth, and Storage instances
  - Handles service account credentials

- **`environment`** (`backend/src/environment/environment.ts`)
  - Centralized environment variable management
  - Validates required configuration
  - Provides type-safe access to config values

#### Frontend Architecture

**1. Main Components**

- **`App.tsx`** (`frontend/src/App.tsx`)
  - Main application component
  - Sets up React Router with protected routes
  - Manages authentication state
  - Renders Navbar and page components

- **`HomePage`** (`frontend/src/components/Home/HomePage.tsx`)
  - Interactive map view with Google Maps integration
  - Displays photos as markers on map
  - Geocodes addresses to coordinates
  - Search functionality to filter photos
  - Side panel for viewing photos at selected location
  - Full-screen photo viewer integration
  - Uses Google Maps AdvancedMarkerElement for custom pin icons

- **`PhotoGallery`** (`frontend/src/components/Photos/PhotoGallery.tsx`)
  - Grid layout for displaying photos
  - Selection mode for bulk operations
  - Photo upload dialog with drag-and-drop
  - Integration with PhotoViewer and EditPhotoDialog
  - Bulk actions (tag updates, location updates, deletion)

- **`PhotoViewer`** (`frontend/src/components/Photos/PhotoViewer.tsx`)
  - Full-screen photo viewing experience
  - Navigation between photos
  - Favorite toggle
  - Edit and delete actions
  - Displays photo metadata

- **`PhotoUpload`** (`frontend/src/components/Photos/PhotoUpload.tsx`)
  - Dedicated upload page
  - Drag-and-drop interface
  - Progress tracking
  - Multiple file support

- **`TimelineView`** (`frontend/src/components/Timeline/TimelineView.tsx`)
  - Chronological photo display grouped by date
  - Scrollable timeline interface

- **`AlbumsView`** (`frontend/src/components/Albums/AlbumsView.tsx`)
  - Displays all user trips/albums
  - Create new album functionality

- **`AlbumDetailView`** (`frontend/src/components/Albums/AlbumDetailView.tsx`)
  - Shows photos in a specific album/trip
  - Album metadata display

- **`GooglePhotosImport`** (`frontend/src/components/Import/GooglePhotosImport.tsx`)
  - Initiates Google Photos OAuth flow
  - Photo selection and import interface

- **`FavoritesView`** (`frontend/src/components/Favorites/FavoritesView.tsx`)
  - Displays all favorited photos

- **`MemoriesView`** (`frontend/src/components/Memories/MemoriesView.tsx`)
  - Shows photos from previous years (memories feature)

**2. Common Components**

- **`Navbar`** (`frontend/src/components/Common/Navbar.tsx`)
  - Navigation bar with route links
  - Theme toggle (light/dark mode)
  - User email display
  - Logout functionality

- **`ProtectedRoute`** (`frontend/src/components/Common/ProtectedRoute.tsx`)
  - Wraps routes requiring authentication
  - Redirects to login if not authenticated

- **`ErrorBoundary`** (`frontend/src/components/Common/ErrorBoundary.tsx`)
  - Catches React component errors
  - Displays error UI

**3. Hooks**

- **`useAuth`** (`frontend/src/hooks/useAuth.tsx`)
  - Manages authentication state
  - Provides login, logout, signup functions
  - Tracks current user

- **`useTheme`** (`frontend/src/hooks/useTheme.tsx`)
  - Manages theme mode (light/dark)
  - Persists theme preference

**4. Services**

- **`api.service`** (`frontend/src/services/api.service.ts`)
  - Centralized API client
  - Axios-based HTTP requests
  - Handles authentication tokens
  - Provides typed functions for all API endpoints

**5. Types**

- **`Photo`** (`frontend/src/types/photo.types.ts`)
  - TypeScript interface for photo data structure
  - Includes metadata, location, tags, URLs

- **`Trip`** (`frontend/src/types/trip.types.ts`)
  - TypeScript interface for trip/album data

---

### Testing Procedure and Testing Tools

#### Testing Tools Used

1. **Manual Testing**
   - Primary testing method used throughout development
   - Test cases documented in `SETUP_GUIDE.md`
   - Manual verification of all features and user flows

2. **Firebase Test Script** (`testFirebase.js`)
   - Custom test script for Firebase connectivity
   - Tests Firestore read/write operations
   - Verifies Authentication service access
   - Validates Storage service connectivity
   - Located in both root and `backend/` directories

3. **Postman Collection** (`postman_collection.json`)
   - API endpoint testing collection
   - Pre-configured requests for all backend endpoints
   - Used for testing API functionality without frontend

4. **Browser DevTools**
   - Console logging for debugging
   - Network tab for API request monitoring
   - Application tab for service worker and storage inspection

5. **React Development Tools**
   - Component inspection
   - State debugging
   - Performance profiling

#### Test Plans and Test Specifications

**1. Authentication Testing**

**Test Plan:**
- **Sign Up Flow**
  1. Navigate to `/signup`
  2. Enter email and password
  3. Submit registration
  4. Verify user created in Firebase Console
  5. Verify redirect to home page

- **Sign In Flow**
  1. Navigate to `/login`
  2. Enter credentials
  3. Submit login
  4. Verify authentication token received
  5. Verify protected routes accessible

- **Protected Routes**
  1. Attempt to access `/gallery` without authentication
  2. Verify redirect to `/login`
  3. Sign in
  4. Verify access granted

**Test Specifications:**
- Email validation (format checking)
- Password strength requirements
- Error handling for invalid credentials
- Token persistence across page refreshes

**2. Photo Upload Testing**

**Test Plan:**
- **Single Photo Upload**
  1. Navigate to `/upload` or use gallery upload dialog
  2. Select photo with EXIF data (GPS coordinates)
  3. Upload photo
  4. Verify:
     - Photo appears in gallery
     - Metadata extracted (camera make/model, GPS, date taken)
     - Thumbnail generated
     - Photo stored in Firebase Storage
     - Document created in Firestore

- **Multiple Photo Upload**
  1. Select multiple photos (up to 10)
  2. Upload all photos
  3. Verify all photos appear in gallery
  4. Verify progress tracking works

- **Metadata Extraction**
  1. Upload photo with GPS coordinates
  2. Check Firestore document: `photos/{photoId}`
  3. Verify `metadata.gps` contains latitude/longitude
  4. Verify `metadata.cameraMake` and `metadata.cameraModel` populated
  5. Verify `metadata.takenAt` date extracted

**Test Specifications:**
- Supported formats: JPEG, PNG, WebP, GIF, HEIC
- Maximum file size: 50MB
- Maximum files per upload: 10
- Automatic thumbnail generation (optimized for performance)
- Tag generation based on metadata

**3. Map Functionality Testing**

**Test Plan:**
- **Map Display**
  1. Upload at least 2 photos with GPS coordinates
  2. Navigate to `/` (HomePage with map)
  3. Verify:
     - Google Maps loads without errors
     - Markers appear at correct GPS locations
     - Custom orange teardrop pin icons display
     - Map auto-fits to show all photos

- **Map Search**
  1. Use search bar on map page
  2. Search by:
     - Photo filename
     - Camera make/model
     - Tags
     - Location (city, country)
  3. Verify:
     - Map filters to matching photos
     - Map centers on search results
     - Search result count displays
     - Markers update dynamically

- **Location Geocoding**
  1. Upload photo with address but no GPS
  2. Verify address is geocoded to coordinates
  3. Verify coordinates saved to photo metadata
  4. Verify marker appears on map

- **Marker Interaction**
  1. Click marker on map
  2. Verify side panel opens with photos at that location
  3. Verify photo thumbnails display
  4. Click photo thumbnail
  5. Verify full-screen viewer opens

**Test Specifications:**
- Google Maps API integration
- AdvancedMarkerElement for custom markers
- Geocoding API for address-to-coordinates conversion
- Real-time search filtering
- Responsive map bounds calculation

**4. Google Photos Import Testing**

**Test Plan:**
- **OAuth Flow**
  1. Navigate to `/import`
  2. Click "Connect Google Photos"
  3. Sign in with Google account
  4. Grant permissions
  5. Verify redirect back with authorization code
  6. Verify access token stored

- **Photo Import**
  1. After OAuth, click "Import Photos"
  2. Select number of photos to import
  3. Verify:
     - Photos download from Google Photos
     - Metadata extracted (creation time, camera info)
     - Photos appear in gallery
     - GPS coordinates preserved (if available)
     - Full-resolution images imported

**Test Specifications:**
- OAuth 2.0 flow implementation
- Google Photos Library API integration
- Metadata preservation during import
- Error handling for failed imports

**5. Timeline Testing**

**Test Plan:**
1. Navigate to `/timeline`
2. Verify photos grouped by date (YYYY-MM-DD format)
3. Check date formatting is readable
4. Verify chronological order (newest first)
5. Verify photos display correctly in date groups

**Test Specifications:**
- Date grouping algorithm
- Chronological sorting
- Empty state handling

**6. Security Testing**

**Test Plan:**
- **Unauthorized Access**
  1. Sign out
  2. Attempt API call: `GET /api/photos`
  3. Verify 401 Unauthorized response

- **User Isolation**
  1. Create two test accounts (User A and User B)
  2. Upload photos with User A
  3. Sign in as User B
  4. Verify User B cannot see User A's photos
  5. Verify User B cannot access User A's photo URLs directly

- **Storage Rules**
  1. Attempt to upload to another user's path
  2. Verify blocked by storage rules
  3. Verify own photos accessible

**Test Specifications:**
- Firebase Authentication middleware
- Firestore security rules
- Storage security rules
- CORS configuration
- Rate limiting

**7. Bulk Operations Testing**

**Test Plan:**
- **Bulk Tag Update**
  1. Enter selection mode in gallery
  2. Select multiple photos
  3. Open bulk actions dialog
  4. Add/remove tags
  5. Verify all selected photos updated

- **Bulk Location Update**
  1. Select multiple photos
  2. Set location (city, country, address)
  3. Verify all photos updated with location

- **Bulk Delete**
  1. Select multiple photos
  2. Delete via bulk actions
  3. Verify all selected photos removed
  4. Verify files deleted from Storage

**Test Specifications:**
- Selection state management
- Batch API operations
- Error handling for partial failures

#### Testing Execution

**Development Testing:**
- Continuous manual testing during development
- Console logging for debugging
- Network request monitoring
- Component state inspection

**Pre-Deployment Testing:**
- Full feature walkthrough
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile device testing (iOS Safari, Android Chrome)
- Performance testing (large photo collections)
- Error scenario testing

**Post-Deployment Testing:**
- Smoke testing on production environment
- User acceptance testing
- Performance monitoring
- Error log review

---

### Customer Testing

#### Customer Testing Approach

**1. Beta Testing Phase**
- Limited release to selected users
- Feedback collection through:
  - User surveys
  - Direct feedback forms
  - Usage analytics
  - Error reporting

**2. User Acceptance Testing (UAT)**
- Real-world usage scenarios
- Testing with actual photo collections
- Performance with large datasets (1000+ photos)
- Cross-device compatibility

**3. Feedback Collection Methods**

- **In-App Feedback**
  - User can report issues directly
  - Feature request mechanism
  - Bug reporting interface

- **User Surveys**
  - Post-signup survey
  - Feature satisfaction ratings
  - Usability questions

- **Analytics**
  - Feature usage tracking
  - Performance metrics
  - Error rate monitoring

**4. Customer Testing Scenarios**

**Scenario 1: New User Onboarding**
- First-time user signs up
- Uploads first photo
- Explores map view
- Creates first album
- Provides feedback on experience

**Scenario 2: Power User Workflow**
- User with 500+ photos
- Bulk operations (tagging, location updates)
- Google Photos import
- Album creation and management
- Performance evaluation

**Scenario 3: Mobile User**
- Mobile device testing
- Photo upload from mobile
- Map interaction on touch devices
- Offline functionality (PWA)
- Installation and home screen experience

**Scenario 4: Google Photos Migration**
- User imports photos from Google Photos
- Verifies metadata preservation
- Checks photo quality
- Validates GPS coordinates

**5. Customer Testing Checklist**

- [ ] Sign up and login process intuitive
- [ ] Photo upload works smoothly
- [ ] Map displays photos correctly
- [ ] Search functionality effective
- [ ] Timeline view useful
- [ ] Album creation straightforward
- [ ] Google Photos import successful
- [ ] Mobile experience satisfactory
- [ ] Performance acceptable with large collections
- [ ] Error messages helpful
- [ ] UI/UX intuitive and modern

**6. Customer Feedback Integration**

- Regular review of customer feedback
- Prioritization of feature requests
- Bug fix prioritization
- UI/UX improvements based on user suggestions
- Performance optimizations based on usage patterns

---

## Graphical User Interface (GUI) Layout

### Overall Application Structure

**Layout Type:** Single Page Application (SPA) with React Router

**Main Layout Components:**
1. **Navbar** (Top Navigation Bar)
2. **Main Content Area** (Page-specific content)
3. **Modals/Dialogs** (Overlays for actions)

### Navigation Bar (Navbar)

**Location:** Top of page, fixed position

**Components:**
- **Logo** (Left side)
  - PhotoPin logo image
  - Clickable, navigates to home page
  - Height: 40px

- **Navigation Links** (Center)
  - Gallery - `/gallery`
  - Timeline - `/timeline`
  - Albums - `/albums`
  - Memories - `/memories`
  - Favorites - Heart icon, `/favorites`
  - Import - `/import`

- **User Controls** (Right side)
  - Theme Toggle - Light/Dark mode switch
  - User Email - Display current user's email
  - Logout Button - Signs out user

**Styling:**
- Material-UI AppBar component
- Primary color theme (#ff4e00)
- Responsive design (hides some links on mobile)

### Home Page (Map View)

**Route:** `/` (Default route)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│  Search Bar                                     │
│  [Search photos by name, tags, camera...]       │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│  Side Panel  │      Google Maps                │
│  (Photos)    │      (Interactive Map)          │
│              │                                  │
│  - Photo     │      - Markers (Orange Pins)    │
│    Grid      │      - Click to open panel      │
│  - Location  │      - Search filters markers   │
│    Info      │                                  │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

**Components:**
- **Search Bar**
  - Full-width text input
  - Search icon on left
  - Clear button (X) when text entered
  - Real-time filtering
  - Result count display

- **Side Panel** (Left Drawer)
  - Opens when marker clicked
  - Width: 400px
  - Header: Photo count and location
  - Photo grid: 2 columns
  - Scrollable photo list
  - Close button (X)

- **Google Maps**
  - Full viewport height (minus navbar)
  - Custom orange teardrop pin markers
  - Marker clustering for nearby photos
  - Auto-fit bounds to show all photos
  - Map controls (zoom, street view, fullscreen)

**Features:**
- Geocoding addresses to coordinates
- Real-time search filtering
- Photo viewer integration
- Responsive layout (panel collapses on mobile)

### Photo Gallery Page

**Route:** `/gallery`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│  [Upload] [Select]  (Action Buttons)           │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │    │ │    │ │    │ │    │ │    │           │
│  │Photo│ │Photo│ │Photo│ │Photo│ │Photo│      │
│  │    │ │    │ │    │ │    │ │    │           │
│  └────┘ └────┘ └────┘ └────┘ └────┘           │
│                                                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐           │
│  │    │ │    │ │    │ │    │ │    │           │
│  │Photo│ │Photo│ │Photo│ │Photo│ │Photo│      │
│  │    │ │    │ │    │ │    │ │    │           │
│  └────┘ └────┘ └────┘ └────┘ └────┘           │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Action Buttons** (Top right)
  - Upload button (circular, primary color)
  - Select button (circular, primary color)
  - Floating action buttons

- **Photo Grid**
  - Responsive grid layout:
    - Mobile (xs): 2 columns
    - Tablet (sm): 3 columns
    - Desktop (md): 4 columns
    - Large (lg): 5 columns
    - XL: 6 columns
  - Fixed height per photo card
  - Aspect ratio: 1:1 (square)
  - Hover effects (scale, shadow)

- **Photo Cards**
  - Thumbnail image
  - Favorite icon overlay
  - Selection checkbox (in selection mode)
  - Click to view full screen

- **Selection Mode Toolbar**
  - Appears when selection mode active
  - Shows selected count
  - Select All / Deselect All
  - Bulk Actions button

**Dialogs:**
- **Upload Dialog**
  - Drag-and-drop area
  - File list with remove option
  - Upload button
  - Progress indicator
  - Success/error messages

- **Bulk Actions Dialog**
  - Tag management (add/remove)
  - Location update
  - Delete option
  - Confirmation dialogs

- **Edit Photo Dialog**
  - Display name editing
  - Tag management
  - Location editing
  - Favorite toggle

- **Photo Viewer** (Full Screen)
  - Large image display
  - Navigation arrows (previous/next)
  - Metadata display
  - Edit/Delete actions
  - Favorite toggle

### Timeline Page

**Route:** `/timeline`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  November 15, 2023                       │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │  │
│  │  │Photo│ │Photo│ │Photo│ │Photo│        │  │
│  │  └────┘ └────┘ └────┘ └────┘           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  November 10, 2023                       │  │
│  │  ┌────┐ ┌────┐ ┌────┐                  │  │
│  │  │Photo│ │Photo│ │Photo│                 │  │
│  │  └────┘ └────┘ └────┘                  │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Date Headers**
  - Formatted date (e.g., "November 15, 2023")
  - Sticky headers while scrolling
  - Typography: Heading variant

- **Photo Groups**
  - Photos grouped by date
  - Grid layout (similar to gallery)
  - Chronological order (newest first)

### Albums Page

**Route:** `/albums`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│  [Create Album]  (Action Button)                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  Cover   │ │  Cover   │ │  Cover   │        │
│  │  Photo   │ │  Photo   │ │  Photo   │        │
│  │          │ │          │ │          │        │
│  │  Album   │ │  Album   │ │  Album   │        │
│  │  Name    │ │  Name    │ │  Name    │        │
│  │  Date    │ │  Date    │ │  Date    │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Album Cards**
  - Cover photo thumbnail
  - Album name
  - Date range or creation date
  - Photo count
  - Click to view album details

- **Create Album Button**
  - Opens dialog for album creation
  - Name and description input
  - Photo selection

### Album Detail Page

**Route:** `/albums/:id`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│  Album Name                                      │
│  Description                                     │
│  Date Range                                      │
│  [Edit] [Delete]  (Action Buttons)              │
├─────────────────────────────────────────────────┤
│                                                  │
│  Photo Grid (Same as Gallery)                   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Album Header**
  - Album name (editable)
  - Description (editable)
  - Date range
  - Photo count
  - Edit/Delete buttons

- **Photo Grid**
  - Same layout as gallery
  - Photos filtered to album
  - Can add/remove photos

### Import Page

**Route:** `/import`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│              Navbar (Top)                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │      Google Photos Import                │  │
│  │                                          │  │
│  │  [Connect Google Photos]                │  │
│  │                                          │  │
│  │  Status: Connected / Not Connected      │  │
│  │                                          │  │
│  │  [Import Photos]                        │  │
│  │  Number of photos: [Input]              │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Components:**
- **Connection Status**
  - Shows if Google Photos connected
  - OAuth button if not connected

- **Import Controls**
  - Number of photos input
  - Import button
  - Progress indicator
  - Success/error messages

### Authentication Pages

**Login Page** (`/login`)
- Email input
- Password input
- Login button
- Link to signup page
- Centered form layout

**Signup Page** (`/signup`)
- Email input
- Password input
- Display name input (optional)
- Signup button
- Link to login page
- Centered form layout

### Design System

**Color Scheme:**
- Primary Color: #ff4e00 (Orange)
- Background: White (light mode) / Dark (dark mode)
- Text: Black (light mode) / White (dark mode)
- Accent: Material-UI theme colors

**Typography:**
- Material-UI Typography component
- Headings: h1-h6 variants
- Body: body1, body2 variants
- Caption: caption variant

**Spacing:**
- Material-UI spacing system (8px base unit)
- Consistent padding and margins
- Responsive spacing (xs, sm, md, lg, xl breakpoints)

**Components Library:**
- Material-UI (MUI) v5
- Consistent component styling
- Theme customization
- Dark mode support

**Responsive Design:**
- Mobile-first approach
- Breakpoints:
  - xs: 0px (mobile)
  - sm: 600px (tablet)
  - md: 900px (small desktop)
  - lg: 1200px (desktop)
  - xl: 1536px (large desktop)

**Accessibility:**
- **Alt text** on images (logo, photos) for screen readers
- **ARIA label** on theme toggle button (`aria-label="toggle theme"`)
- **Tooltips** (title attributes) on icon buttons for context
- **Keyboard navigation** in PhotoViewer (Arrow keys for navigation, Escape to close)
- **Semantic HTML** through Material-UI components (AppBar, main, buttons)
- **Material-UI built-in accessibility** - MUI components include basic accessibility features
- **React Dropzone** configured with `noKeyboard: false` to allow keyboard file selection

**Note:** While basic accessibility features are implemented, there is room for improvement:
- Additional ARIA labels on more interactive elements
- Enhanced keyboard navigation throughout the app
- Focus management for modals and dialogs
- Screen reader announcements for dynamic content updates

**Progressive Web App (PWA) Features:**
- Service worker for offline functionality
- App manifest for installation
- Home screen icon
- Splash screen
- Offline page caching

---

## Summary

This documentation provides a comprehensive overview of the PhotoPin application, covering:

1. **Code Architecture**: Detailed description of main classes, functions, and components used throughout the application
2. **Testing Procedures**: Complete testing methodology, tools, test plans, and specifications
3. **Customer Testing**: Approach to user acceptance testing and feedback collection
4. **GUI Layout**: Detailed description of all user interface components, layouts, and design system

The application follows modern web development best practices with a clear separation of concerns, comprehensive error handling, and a user-friendly interface designed for both desktop and mobile devices.

