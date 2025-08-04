# MediScript Refill System

## Overview

The MediScript Refill System is a comprehensive solution that allows patients to request refills for their prescribed medicines and enables administrators to manage these requests efficiently. The system includes prescription management, refill cart functionality, request processing, and administrative controls.

## Features

### Patient Features

- **My Prescriptions**: View all prescriptions with refill status
- **Refill Cart**: Add medicines to cart before submitting request
- **Request Management**: Submit, track, and view refill request history
- **Prescription Details**: View detailed prescription information with refill options

### Admin Features

- **Request Management**: View, approve, decline, and mark requests as delivered
- **Filtering & Search**: Filter requests by status and search by patient name
- **Archiving**: Archive completed requests for historical records
- **Statistics**: Track refill request metrics and revenue

## Database Schema

### Core Tables

#### 1. `refill_cart`

Stores items in patient refill cart before submission

```sql
CREATE TABLE refill_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(12) NOT NULL,
    prescription_medicine_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients (user_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_medicine_id) REFERENCES prescription_medicines (id) ON DELETE CASCADE
);
```

#### 2. `refill_requests_final`

Main table for refill requests

```sql
CREATE TABLE refill_requests_final (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(12) NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    status ENUM('pending', 'approved', 'declined', 'delivered') DEFAULT 'pending',
    delivery_method VARCHAR(50),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients (user_id) ON DELETE CASCADE
);
```

#### 3. `refill_request_items`

Individual items in each refill request

```sql
CREATE TABLE refill_request_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    prescription_medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    total_price DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (request_id) REFERENCES refill_requests_final (request_id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_medicine_id) REFERENCES prescription_medicines (id) ON DELETE CASCADE
);
```

#### 4. `refill_request_history`

Archived refill requests for historical records

```sql
CREATE TABLE refill_request_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES refill_requests_final (request_id) ON DELETE CASCADE
);
```

### Additional Schema Updates

#### Prescription Medicines Table

Added `refillable` column to track which medicines can be refilled:

```sql
ALTER TABLE prescription_medicines
ADD COLUMN refillable BOOLEAN DEFAULT FALSE;
```

## API Endpoints

### Patient Endpoints

#### Prescriptions

- `GET /patient/prescriptions` - Get all patient prescriptions with refill status
- `GET /patient/prescription/:id` - Get detailed prescription information

#### Refill Cart

- `GET /patient/refill-cart` - Get patient's refill cart
- `POST /patient/refill-cart` - Add medicine to cart
- `PUT /patient/refill-cart` - Update cart item quantity
- `DELETE /patient/refill-cart/:cart_id` - Remove item from cart
- `DELETE /patient/refill-cart` - Clear entire cart

#### Refill Requests

- `POST /patient/refill-request` - Submit refill request
- `GET /patient/refill-requests` - Get request history
- `GET /patient/refill-request/:id` - Get request details

### Admin Endpoints

#### Refill Request Management

- `GET /admin/refill-requests` - Get all refill requests (with status filter)
- `GET /admin/refill-request/:id` - Get request details
- `POST /admin/refill-request/:id/approve` - Approve request
- `POST /admin/refill-request/:id/decline` - Decline request
- `POST /admin/refill-request/:id/delivered` - Mark as delivered
- `POST /admin/refill-requests/archive` - Archive completed requests
- `GET /admin/refill-history` - Get archived requests

## Frontend Pages

### Patient Pages

#### 1. My Prescriptions (`/patient/my_prescriptions.html`)

- **Features**:
  - View all prescriptions with refill status
  - View prescription details in modal
  - Add medicines to refill cart
  - Download prescription as text file
- **Key Components**:
  - Prescription listing table
  - Status indicators (Refillable, Partially Refillable, Non-Refillable)
  - Prescription details modal
  - Refill cart integration

#### 2. Refill Request (`/patient/refill_request.html`)

- **Features**:
  - Cart management with quantity controls
  - Request history tracking
  - Checkout process with address and notes
  - Request status tracking
- **Key Components**:
  - Tabbed interface (Cart/History)
  - Cart items table with quantity controls
  - Checkout modal
  - Request history table

### Admin Pages

#### 1. Refill Request Management (`/admin/admin_patient_refillReq.html`)

- **Features**:
  - View all refill requests with filtering
  - Approve/decline/deliver requests
  - Archive completed requests
  - View archived history
- **Key Components**:
  - Status filtering dropdown
  - Patient search functionality
  - Request details modal with action buttons
  - Archive functionality

## Workflow

### Patient Refill Process

1. **View Prescriptions**: Patient accesses "My Prescriptions" page
2. **Check Refill Status**: System shows which medicines are refillable
3. **Add to Cart**: Patient adds refillable medicines to cart
4. **Manage Cart**: Patient can adjust quantities or remove items
5. **Submit Request**: Patient provides delivery address and notes
6. **Track Status**: Patient can monitor request status in history

### Admin Approval Process

1. **Review Requests**: Admin views pending requests in management page
2. **Filter & Search**: Admin can filter by status and search by patient
3. **View Details**: Admin opens request details to review items and patient info
4. **Take Action**: Admin can approve, decline, or mark as delivered
5. **Archive**: Completed requests are moved to archive for historical records

## Key Features

### Refill Eligibility Logic

- Medicines must have `refillable = TRUE` in prescription_medicines table
- Duration-based validation (future enhancement)
- Prescription age validation (future enhancement)

### Cart Management

- Prevents duplicate items in cart
- Quantity controls with automatic removal when quantity = 0
- Automatic price calculation
- Cart persistence across sessions

### Request Processing

- Transaction-based submission to ensure data integrity
- Automatic cart clearing after successful submission
- Status tracking throughout the process
- Delivery method tracking

### Admin Controls

- Bulk archiving of completed requests
- Comprehensive filtering and search
- Detailed request analytics
- Revenue tracking for delivered requests

## Database Views

### 1. `refill_request_summary`

Provides comprehensive view of refill requests with patient and financial data.

### 2. `refill_cart_summary`

Shows cart items with medicine details, pricing, and doctor information.

### 3. `prescription_refill_status`

Calculates refill status for each prescription based on medicine refillability.

## Stored Procedures

### 1. `ArchiveCompletedRequests()`

Automatically archives delivered and declined requests.

### 2. `GetPatientRefillStats(patient_id)`

Returns refill statistics for a specific patient.

## Functions

### 1. `IsMedicineRefillable(prescription_medicine_id)`

Determines if a specific prescription medicine is refillable.

## Triggers

### 1. Price Calculation Triggers

- `calculate_total_price_insert`: Calculates total price on insert
- `calculate_total_price_update`: Recalculates total price on update

### 2. Statistics Update Trigger

- `update_refill_statistics`: Updates refill statistics when requests change

## Events

### 1. `cleanup_old_cart_items`

Automatically removes cart items older than 7 days.

## Installation & Setup

### 1. Database Setup

Run the complete database schema:

```bash
mysql -u your_username -p mediscript < database_schema_refill_system.sql
```

### 2. Backend Setup

The backend controllers and routes are already implemented:

- `server/controllers/patientController.js` - Patient refill functionality
- `server/controllers/adminController.js` - Admin refill management
- `server/routes/patientRoutes.js` - Patient refill routes
- `server/routes/adminRoutes.js` - Admin refill routes

### 3. Frontend Setup

All frontend files are created and ready:

- `public/patient/my_prescriptions.html` - Patient prescriptions page
- `public/patient/refill_request.html` - Patient refill request page
- `public/admin/admin_patient_refillReq.html` - Admin refill management page
- `public/js/patient_prescriptions.js` - Patient prescriptions JavaScript
- `public/js/patient_refill_request.js` - Patient refill request JavaScript
- `public/js/admin_refill_requests.js` - Admin refill management JavaScript

### 4. Navigation Updates

Patient and admin dashboards have been updated with navigation to the new refill system pages.

## Testing

### Patient Testing

1. Login as a patient
2. Navigate to "My Prescriptions"
3. View prescription details and add medicines to cart
4. Go to "Refill Request" to manage cart and submit request
5. Check request history

### Admin Testing

1. Login as admin
2. Navigate to "Refill Requests" in admin panel
3. View pending requests
4. Approve/decline requests
5. Mark requests as delivered
6. Archive completed requests

## Future Enhancements

### 1. Advanced Refill Logic

- Duration-based refill eligibility
- Prescription expiration handling
- Doctor approval requirements

### 2. Payment Integration

- Online payment processing
- Payment status tracking
- Invoice generation

### 3. Delivery Tracking

- Real-time delivery status
- Delivery partner integration
- SMS/email notifications

### 4. Analytics Dashboard

- Refill request analytics
- Revenue reports
- Patient refill patterns

### 5. Mobile App

- Native mobile application
- Push notifications
- Offline functionality

## Security Considerations

### 1. Authentication

- All endpoints require proper authentication
- Role-based access control (patient/admin)

### 2. Data Validation

- Input validation on all forms
- SQL injection prevention
- XSS protection

### 3. Transaction Safety

- Database transactions for critical operations
- Rollback mechanisms for failed operations

## Performance Optimizations

### 1. Database Indexes

- Optimized indexes for common queries
- Composite indexes for filtering operations

### 2. Caching

- Session-based caching for user data
- Query result caching for statistics

### 3. Pagination

- Implemented for large result sets
- Efficient data loading

## Troubleshooting

### Common Issues

#### 1. Cart Items Not Loading

- Check database connection
- Verify patient authentication
- Check for JavaScript errors

#### 2. Request Submission Fails

- Verify all required fields are filled
- Check database transaction logs
- Ensure proper authentication

#### 3. Admin Actions Not Working

- Verify admin permissions
- Check request status before actions
- Review server logs for errors

### Debug Mode

Enable debug logging in the controllers for detailed error information.

## Support

For technical support or questions about the refill system implementation, please refer to the code comments and this documentation. The system is designed to be modular and extensible for future enhancements.
