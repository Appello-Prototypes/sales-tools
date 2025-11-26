# Inventory System Seed Data

This script populates the database with comprehensive, interconnected data for the inventory management system.

## What Gets Created

### 1. **Products** (22 products)
- Insulation materials (pipe insulation, board insulation, facing)
- Pipe & fittings (steel pipe, elbows, flanges)
- Fasteners (lag screws, hanger straps, sheet metal screws)
- Adhesives & sealants
- Mechanical equipment

Each product includes:
- Supplier information
- Pricing (last price, standard cost)
- Unit of measure
- Category classification

### 2. **Inventory Records** (~30+ records)
- Main warehouse inventory (15 products)
- Yard inventory (7 products across 2 yards)
- Jobsite inventory (8 products across 3 job sites)

Each inventory record tracks:
- On-hand quantities
- Allocated quantities
- Available quantities (calculated)
- On-order quantities
- Min/max levels
- Average cost

### 3. **Material Orders** (8 orders)
- Linked to jobs
- Multiple line items per order
- Various statuses (submitted, approved, po_issued, delivered, closed)
- Priority levels (urgent, standard, low)
- Delivery locations and instructions

### 4. **Purchase Orders** (11+ orders)
- Converted from material orders
- Standalone POs
- Complete line items with pricing
- Status tracking (draft, approved, sent, partially_received, received)
- Approval workflow data
- Financial totals (subtotal, tax, freight, total)

### 5. **Receiving Records** (8+ records)
- Linked to purchase orders
- Line-by-line receiving with quantities
- Condition tracking (good, damaged, incorrect_item)
- Bill of lading and material photos
- Location placement tracking
- **Automatically updates inventory** when materials are received

## Data Relationships

All data is interconnected:

```
Products
  ├── Inventory (by location)
  ├── Material Order Line Items
  ├── Purchase Order Line Items
  └── Receiving Line Items

Material Orders
  └── Purchase Orders (converted)

Purchase Orders
  ├── Material Orders (source)
  └── Receiving Records

Receiving Records
  └── Inventory Updates (automatic)
```

## Running the Seed Script

```bash
npm run seed-inventory
```

Or directly:

```bash
tsx scripts/seed-inventory-system.ts
```

## What Happens

1. **Clears existing data** for all models (Product, Inventory, MaterialOrder, PurchaseOrder, Receiving)
2. **Creates products** with realistic construction materials
3. **Creates inventory** across multiple locations
4. **Creates material orders** linked to jobs
5. **Creates purchase orders** from material orders + standalone POs
6. **Creates receiving records** and updates inventory automatically
7. **Prints summary** of all created data

## Sample Data Structure

### Suppliers
- Insulation Supply Co.
- Mechanical Materials Inc.
- Industrial Pipe & Fittings
- Fastener Warehouse
- Adhesive Solutions Ltd.

### Jobs
- Office Building - HVAC Retrofit
- Industrial Plant - Steam System
- Hospital - Mechanical Upgrade
- School District - Boiler Replacement
- Retail Complex - Ductwork

### Locations
- Main Warehouse
- Yard 1 - North
- Yard 2 - South
- Job Site A - Office Building
- Job Site B - Industrial Plant
- Job Site C - Hospital

## Notes

- All data uses realistic construction industry values
- Quantities, prices, and dates are randomized within realistic ranges
- Inventory automatically calculates available = onHand - allocated
- Receiving automatically updates inventory quantities
- Purchase orders calculate totals automatically (subtotal + tax + freight)
- Material orders link to purchase orders when converted
- All records include timestamps and denormalized data for quick access

## Verification

After running the seed script, you can verify the data:

```javascript
// In MongoDB shell or Compass
db.products.countDocuments()
db.inventories.countDocuments()
db.materialorders.countDocuments()
db.purchaseorders.countDocuments()
db.receivings.countDocuments()

// Check relationships
db.purchaseorders.findOne({ materialOrderId: { $exists: true } })
db.receivings.findOne({ purchaseOrderId: { $exists: true } })
db.inventories.findOne({ onHand: { $gt: 0 } })
```

