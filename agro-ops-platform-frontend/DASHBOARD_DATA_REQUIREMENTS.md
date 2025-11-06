# Dashboard Missing Data Requirements

This document outlines what data is needed for the dashboard to display meaningful information. Currently, the dashboard will show `0` for all metrics when tables are empty, but to populate it with real data, you'll need to add the following:

## Required Data Tables

### 1. **Inventory Table** (`inventory`)
   - **Purpose**: Track products/items in warehouse
   - **Required Fields**:
     - `name`: Product name
     - `category`: Product category (e.g., "seeds", "fertilizer", "equipment")
     - `quantity`: Current stock quantity
     - `unit`: Unit of measurement (e.g., "kg", "liters", "pieces")
     - `expiryDate`: Optional - expiration date for perishable items
   - **Dashboard Metrics**: Total products count, total quantity, low stock alerts

### 2. **Fields Table** (`fields`)
   - **Purpose**: Track agricultural fields/plots
   - **Required Fields**:
     - `name`: Field name
     - `area`: Field area in hectares
     - `cropType`: Type of crop being grown (optional but recommended)
     - `seasonId`: Link to active season (optional)
   - **Dashboard Metrics**: Active fields count, total area, crop type breakdown

### 3. **Seasons Table** (`seasons`)
   - **Purpose**: Track farming seasons/campaigns
   - **Required Fields**:
     - `name`: Season name (e.g., "Spring 2024")
     - `startDate`: Season start timestamp
     - `endDate`: Season end timestamp
     - `isActive`: Boolean flag for active season
   - **Dashboard Metrics**: Used to filter data by current season

### 4. **Activities Table** (`activities`)
   - **Purpose**: Track farming activities performed
   - **Required Fields**:
     - `type`: Activity type (e.g., "planting", "harvesting", "fertilizing")
     - `description`: Activity description (optional)
     - `date`: Activity date timestamp
     - `fieldId`: Link to field (optional)
     - `userId`: Clerk user ID who performed the activity
   - **Dashboard Metrics**: Recent activities feed, member activity segmentation

### 5. **Credits Table** (`credits`)
   - **Purpose**: Track financial transactions (income/expenses)
   - **Required Fields**:
     - `amount`: Transaction amount
     - `currency`: Currency code (e.g., "USD", "EUR", "BGN")
     - `type`: "income" or "expense"
     - `category`: Transaction category (optional)
     - `description`: Transaction description
     - `date`: Transaction date timestamp
     - `userId`: Clerk user ID who created the transaction
   - **Dashboard Metrics**: Financial summary (income, expenses, balance)

### 6. **Audits Table** (`audits`)
   - **Purpose**: Track compliance and quality audits
   - **Required Fields**:
     - `type`: Audit type (e.g., "compliance", "quality", "safety")
     - `title`: Audit title
     - `description`: Audit description
     - `status`: "pending", "completed", or "failed"
     - `date`: Scheduled audit date timestamp
     - `userId`: Clerk user ID who created the audit
   - **Dashboard Metrics**: Pending audits count and list

### 7. **Notifications Table** (`notifications`)
   - **Purpose**: User notifications
   - **Required Fields**:
     - `title`: Notification title
     - `message`: Notification message
     - `type`: Notification type (e.g., "info", "warning", "error")
     - `read`: Boolean flag for read status
     - `userId`: Clerk user ID recipient
   - **Dashboard Metrics**: Unread notifications count

## Organization Setup

### Clerk Organization
- Must have members added to the organization
- Used for: Team member count, member activity segmentation

## Data Population Priority

To get the dashboard working with meaningful data, prioritize in this order:

1. **Seasons** - Create at least one active season (sets the time period for other metrics)
2. **Fields** - Add fields with crop types (enables fields breakdown chart)
3. **Activities** - Add activities linked to fields and users (enables activity feed and member segmentation)
4. **Inventory** - Add inventory items (enables product count and alerts)
5. **Credits** - Add financial transactions (enables financial summary)
6. **Audits** - Add audits with "pending" status (enables audit widget)
7. **Notifications** - Add notifications for users (enables notification count)

## Notes

- All timestamps should be in milliseconds (Unix timestamp)
- User IDs should be Clerk user IDs (strings)
- Organization IDs are Convex document IDs (from the `organizations` table)
- The dashboard automatically handles empty states by showing `0` values
- All data is filtered by `organizationId` to ensure proper multi-tenancy

