import mongoose from 'mongoose';
import Product from '../models/Product';
import Inventory from '../models/Inventory';
import MaterialOrder from '../models/MaterialOrder';
import PurchaseOrder from '../models/PurchaseOrder';
import Receiving from '../models/Receiving';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appello-assessment';

// Helper to generate IDs (using nanoid-like format or simple counter)
let counter = 1;
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${counter++}`;
}

// Realistic construction materials data
const SUPPLIERS = [
  { id: 'supplier-001', name: 'Insulation Supply Co.', type: 'wholesale' },
  { id: 'supplier-002', name: 'Mechanical Materials Inc.', type: 'distributor' },
  { id: 'supplier-003', name: 'Industrial Pipe & Fittings', type: 'manufacturer' },
  { id: 'supplier-004', name: 'Fastener Warehouse', type: 'wholesale' },
  { id: 'supplier-005', name: 'Adhesive Solutions Ltd.', type: 'distributor' },
];

const PRODUCTS_DATA = [
  // Insulation Products
  { name: '2" Fiberglass Pipe Insulation', description: 'Standard fiberglass pipe insulation, 2" diameter', supplier: 'supplier-001', category: 'Insulation', unit: 'FT' as const, lastPrice: 3.25, standardCost: 3.00 },
  { name: '4" Fiberglass Pipe Insulation', description: 'Standard fiberglass pipe insulation, 4" diameter', supplier: 'supplier-001', category: 'Insulation', unit: 'FT' as const, lastPrice: 5.50, standardCost: 5.00 },
  { name: '6" Fiberglass Pipe Insulation', description: 'Standard fiberglass pipe insulation, 6" diameter', supplier: 'supplier-001', category: 'Insulation', unit: 'FT' as const, lastPrice: 8.75, standardCost: 8.00 },
  { name: '1" Fiberglass Board Insulation', description: 'Rigid fiberglass board, 1" thickness', supplier: 'supplier-001', category: 'Insulation', unit: 'SQ_FT' as const, lastPrice: 2.15, standardCost: 2.00 },
  { name: '2" Fiberglass Board Insulation', description: 'Rigid fiberglass board, 2" thickness', supplier: 'supplier-001', category: 'Insulation', unit: 'SQ_FT' as const, lastPrice: 4.30, standardCost: 4.00 },
  { name: 'ASJ Facing Material', description: 'All Service Jacket facing for insulation', supplier: 'supplier-001', category: 'Insulation', unit: 'ROLL' as const, lastPrice: 125.00, standardCost: 120.00 },
  
  // Pipe & Fittings
  { name: '2" Schedule 40 Steel Pipe', description: 'Black steel pipe, schedule 40', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'FT' as const, lastPrice: 12.50, standardCost: 11.00 },
  { name: '4" Schedule 40 Steel Pipe', description: 'Black steel pipe, schedule 40', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'FT' as const, lastPrice: 28.75, standardCost: 26.00 },
  { name: '2" 90 Degree Elbow', description: 'Steel pipe elbow, 90 degree', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'EA' as const, lastPrice: 8.50, standardCost: 7.50 },
  { name: '4" 90 Degree Elbow', description: 'Steel pipe elbow, 90 degree', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'EA' as const, lastPrice: 18.25, standardCost: 16.00 },
  { name: '2" Pipe Flange', description: 'Steel pipe flange, 150# rating', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'EA' as const, lastPrice: 22.00, standardCost: 20.00 },
  { name: '4" Pipe Flange', description: 'Steel pipe flange, 150# rating', supplier: 'supplier-003', category: 'Pipe & Fittings', unit: 'EA' as const, lastPrice: 45.00, standardCost: 42.00 },
  
  // Fasteners
  { name: '1/4" Lag Screws', description: 'Galvanized lag screws, 1/4" x 3"', supplier: 'supplier-004', category: 'Fasteners', unit: 'LB' as const, lastPrice: 4.25, standardCost: 4.00 },
  { name: '3/8" Lag Screws', description: 'Galvanized lag screws, 3/8" x 4"', supplier: 'supplier-004', category: 'Fasteners', unit: 'LB' as const, lastPrice: 5.50, standardCost: 5.00 },
  { name: 'Pipe Hanger Straps', description: 'Galvanized pipe hanger straps, 2"', supplier: 'supplier-004', category: 'Fasteners', unit: 'EA' as const, lastPrice: 2.75, standardCost: 2.50 },
  { name: 'Pipe Hanger Straps', description: 'Galvanized pipe hanger straps, 4"', supplier: 'supplier-004', category: 'Fasteners', unit: 'EA' as const, lastPrice: 4.50, standardCost: 4.00 },
  { name: 'Sheet Metal Screws', description: 'Self-tapping sheet metal screws, #10 x 1"', supplier: 'supplier-004', category: 'Fasteners', unit: 'BOX' as const, lastPrice: 18.50, standardCost: 17.00 },
  
  // Adhesives & Sealants
  { name: 'Insulation Adhesive', description: 'High-temperature insulation adhesive, 1 gallon', supplier: 'supplier-005', category: 'Adhesives', unit: 'GAL' as const, lastPrice: 45.00, standardCost: 42.00 },
  { name: 'Pipe Wrap Tape', description: 'Aluminum pipe wrap tape, 2" width', supplier: 'supplier-005', category: 'Adhesives', unit: 'ROLL' as const, lastPrice: 8.75, standardCost: 8.00 },
  { name: 'Duct Sealant', description: 'HVAC duct sealant, 10 oz cartridge', supplier: 'supplier-005', category: 'Adhesives', unit: 'EA' as const, lastPrice: 12.50, standardCost: 11.50 },
  
  // Mechanical Equipment
  { name: 'Pipe Support Brackets', description: 'Heavy-duty pipe support brackets, adjustable', supplier: 'supplier-002', category: 'Equipment', unit: 'EA' as const, lastPrice: 35.00, standardCost: 32.00 },
  { name: 'Expansion Joint', description: 'Rubber expansion joint, 4"', supplier: 'supplier-002', category: 'Equipment', unit: 'EA' as const, lastPrice: 185.00, standardCost: 170.00 },
];

const LOCATIONS = [
  { id: 'loc-001', name: 'Main Warehouse', type: 'warehouse' as const },
  { id: 'loc-002', name: 'Yard 1 - North', type: 'yard' as const },
  { id: 'loc-003', name: 'Yard 2 - South', type: 'yard' as const },
  { id: 'loc-004', name: 'Job Site A - Office Building', type: 'jobsite' as const, jobId: 'job-001' },
  { id: 'loc-005', name: 'Job Site B - Industrial Plant', type: 'jobsite' as const, jobId: 'job-002' },
  { id: 'loc-006', name: 'Job Site C - Hospital', type: 'jobsite' as const, jobId: 'job-003' },
];

const JOBS = [
  { id: 'job-001', name: 'Office Building - HVAC Retrofit', customer: 'ABC Construction' },
  { id: 'job-002', name: 'Industrial Plant - Steam System', customer: 'XYZ Manufacturing' },
  { id: 'job-003', name: 'Hospital - Mechanical Upgrade', customer: 'City Health System' },
  { id: 'job-004', name: 'School District - Boiler Replacement', customer: 'Metro Schools' },
  { id: 'job-005', name: 'Retail Complex - Ductwork', customer: 'Mall Properties Inc.' },
];

const USERS = [
  { id: 'user-001', name: 'John Foreman', role: 'foreman' },
  { id: 'user-002', name: 'Mike Purchasing', role: 'buyer' },
  { id: 'user-003', name: 'Sarah Project Manager', role: 'pm' },
  { id: 'user-004', name: 'Tom Field Tech', role: 'field' },
];

async function seedInventorySystem() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await MaterialOrder.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await Receiving.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // 1. Create Products
    console.log('📦 Creating products...');
    const products: any[] = [];
    for (const productData of PRODUCTS_DATA) {
      const supplier = SUPPLIERS.find(s => s.id === productData.supplier);
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        supplierId: productData.supplier,
        supplierName: supplier?.name,
        lastPrice: productData.lastPrice,
        standardCost: productData.standardCost,
        unitOfMeasure: productData.unit,
        category: productData.category,
        isActive: true,
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products\n`);

    // 2. Create Inventory Records
    console.log('📊 Creating inventory records...');
    const inventoryRecords: any[] = [];
    
    // Stock some products in main warehouse
    const warehouseProducts = products.slice(0, 15); // First 15 products
    for (const product of warehouseProducts) {
      const inventory = await Inventory.create({
        productId: product._id.toString(),
        productName: product.name,
        locationId: LOCATIONS[0].id,
        locationName: LOCATIONS[0].name,
        locationType: LOCATIONS[0].type,
        onHand: Math.floor(Math.random() * 1000) + 100, // Random 100-1100
        allocated: Math.floor(Math.random() * 200),
        onOrder: Math.floor(Math.random() * 500),
        minLevel: 50,
        maxLevel: 1000,
        averageCost: product.standardCost || product.lastPrice,
      });
      inventoryRecords.push(inventory);
    }

    // Stock some products in yards
    const yardProducts = products.slice(5, 12);
    for (const product of yardProducts) {
      const location = LOCATIONS[Math.floor(Math.random() * 2) + 1]; // Yard 1 or 2
      const inventory = await Inventory.create({
        productId: product._id.toString(),
        productName: product.name,
        locationId: location.id,
        locationName: location.name,
        locationType: location.type,
        onHand: Math.floor(Math.random() * 500) + 50,
        allocated: Math.floor(Math.random() * 100),
        onOrder: 0,
        minLevel: 25,
        maxLevel: 500,
        averageCost: product.standardCost || product.lastPrice,
      });
      inventoryRecords.push(inventory);
    }

    // Stock some products at job sites
    const jobsiteProducts = products.slice(0, 8);
    for (let i = 0; i < jobsiteProducts.length; i++) {
      const product = jobsiteProducts[i];
      const location = LOCATIONS[3 + (i % 3)]; // Job sites
      const inventory = await Inventory.create({
        productId: product._id.toString(),
        productName: product.name,
        locationId: location.id,
        locationName: location.name,
        locationType: location.type,
        jobId: location.jobId,
        onHand: Math.floor(Math.random() * 200) + 20,
        allocated: Math.floor(Math.random() * 50),
        onOrder: 0,
        averageCost: product.standardCost || product.lastPrice,
      });
      inventoryRecords.push(inventory);
    }
    console.log(`✅ Created ${inventoryRecords.length} inventory records\n`);

    // 3. Create Material Orders
    console.log('📋 Creating material orders...');
    const materialOrders: any[] = [];
    const priorities: Array<'urgent' | 'standard' | 'low'> = ['urgent', 'standard', 'low'];
    const statuses: Array<'submitted' | 'approved' | 'po_issued' | 'delivered' | 'closed'> = ['submitted', 'approved', 'po_issued', 'delivered', 'closed'];
    
    for (let i = 0; i < 8; i++) {
      const job = JOBS[i % JOBS.length];
      const user = USERS[Math.floor(Math.random() * USERS.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Select 2-5 random products for this material order
      const selectedProducts = products.slice(
        Math.floor(Math.random() * (products.length - 5)),
        Math.floor(Math.random() * (products.length - 2)) + 3
      ).slice(0, Math.floor(Math.random() * 4) + 2);

      const lineItems = selectedProducts.map(product => ({
        productId: product._id.toString(),
        productName: product.name,
        description: product.description,
        quantity: Math.floor(Math.random() * 500) + 50,
        unitOfMeasure: product.unitOfMeasure,
        notes: Math.random() > 0.7 ? 'Must match existing material' : undefined,
      }));

      const materialOrder = await MaterialOrder.create({
        materialOrderNo: `MO-2025-${String(i + 1).padStart(3, '0')}`,
        jobId: job.id,
        jobName: job.name,
        requiredByDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within 30 days
        priority,
        status,
        deliveryLocation: Math.random() > 0.5 ? 'jobsite' : 'warehouse',
        deliveryAddress: job.name,
        deliveryNotes: Math.random() > 0.6 ? 'Call foreman 30 min before arrival' : undefined,
        orderedByUserId: user.id,
        orderedByName: user.name,
        lineItems,
        notes: Math.random() > 0.7 ? 'Urgent - needed for next phase' : undefined,
      });
      materialOrders.push(materialOrder);
    }
    console.log(`✅ Created ${materialOrders.length} material orders\n`);

    // 4. Create Purchase Orders (linked to material orders)
    console.log('🛒 Creating purchase orders...');
    const purchaseOrders: any[] = [];
    
    // Create POs for approved/pending material orders
    const ordersToConvert = materialOrders.filter(mo => 
      ['approved', 'po_issued', 'delivered', 'closed'].includes(mo.status)
    );

    for (let i = 0; i < ordersToConvert.length; i++) {
      const materialOrder = ordersToConvert[i];
      const job = JOBS.find(j => j.id === materialOrder.jobId) || JOBS[0];
      
      // Find supplier for first product in material order
      const firstProduct = products.find(p => 
        p._id.toString() === materialOrder.lineItems[0]?.productId
      );
      const supplier = SUPPLIERS.find(s => s.id === firstProduct?.supplierId) || SUPPLIERS[0];
      
      const buyer = USERS.find(u => u.role === 'buyer') || USERS[1];
      const approver = USERS.find(u => u.role === 'pm') || USERS[2];

      // Convert material order line items to PO line items
      const poLineItems = materialOrder.lineItems.map((item: any) => {
        const product = products.find(p => p._id.toString() === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: product?.lastPrice || product?.standardCost || 10.00,
          extendedCost: (product?.lastPrice || product?.standardCost || 10.00) * item.quantity,
          costCodeId: `costcode-${Math.floor(Math.random() * 5) + 1}`,
          costCodeName: `Cost Code ${Math.floor(Math.random() * 5) + 1}`,
          notes: item.notes,
        };
      });

      const subtotal = poLineItems.reduce((sum, item) => sum + item.extendedCost, 0);
      const tax = subtotal * 0.13; // 13% tax
      const freight = Math.random() > 0.5 ? Math.floor(Math.random() * 200) + 50 : 0;
      const total = subtotal + tax + freight;

      const poStatus = materialOrder.status === 'delivered' || materialOrder.status === 'closed' 
        ? 'received' 
        : materialOrder.status === 'po_issued' 
        ? 'sent' 
        : 'approved';

      const purchaseOrder = await PurchaseOrder.create({
        poNumber: `PO-2025-${String(i + 1).padStart(3, '0')}`,
        vendorId: supplier.id,
        vendorName: supplier.name,
        jobId: job.id,
        jobName: job.name,
        materialOrderId: materialOrder._id.toString(),
        orderDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date within last 60 days
        expectedDeliveryDate: materialOrder.requiredByDate,
        status: poStatus,
        shipToAddress: materialOrder.deliveryAddress || job.name,
        deliveryInstructions: materialOrder.deliveryNotes,
        internalNotes: 'Auto-generated from material order',
        supplierNotes: 'Please deliver per instructions',
        buyerUserId: buyer.id,
        buyerName: buyer.name,
        approvedByUserId: approver.id,
        approvedByName: approver.name,
        approvedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        subtotal,
        tax,
        freight,
        total,
        lineItems: poLineItems,
      });
      purchaseOrders.push(purchaseOrder);

      // Update material order with PO reference
      materialOrder.purchaseOrderId = purchaseOrder._id.toString();
      await materialOrder.save();
    }

    // Create a few standalone POs (not from material orders)
    for (let i = 0; i < 3; i++) {
      const job = JOBS[Math.floor(Math.random() * JOBS.length)];
      const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
      const buyer = USERS.find(u => u.role === 'buyer') || USERS[1];
      
      const selectedProducts = products.slice(
        Math.floor(Math.random() * (products.length - 3)),
        Math.floor(Math.random() * (products.length - 1)) + 2
      ).slice(0, Math.floor(Math.random() * 3) + 2);

      const poLineItems = selectedProducts.map(product => ({
        productId: product._id.toString(),
        productName: product.name,
        description: product.description,
        quantity: Math.floor(Math.random() * 300) + 25,
        unitOfMeasure: product.unitOfMeasure,
        unitPrice: product.lastPrice || product.standardCost || 10.00,
        extendedCost: (product.lastPrice || product.standardCost || 10.00) * (Math.floor(Math.random() * 300) + 25),
        costCodeId: `costcode-${Math.floor(Math.random() * 5) + 1}`,
        costCodeName: `Cost Code ${Math.floor(Math.random() * 5) + 1}`,
      }));

      const subtotal = poLineItems.reduce((sum, item) => sum + item.extendedCost, 0);
      const tax = subtotal * 0.13;
      const freight = Math.random() > 0.5 ? Math.floor(Math.random() * 150) + 25 : 0;
      const total = subtotal + tax + freight;

      const po = await PurchaseOrder.create({
        poNumber: `PO-2025-${String(purchaseOrders.length + i + 1).padStart(3, '0')}`,
        vendorId: supplier.id,
        vendorName: supplier.name,
        jobId: job.id,
        jobName: job.name,
        orderDate: new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(Date.now() + Math.random() * 20 * 24 * 60 * 60 * 1000),
        status: ['approved', 'sent', 'partially_received'][Math.floor(Math.random() * 3)],
        shipToAddress: job.name,
        deliveryInstructions: 'Standard delivery',
        buyerUserId: buyer.id,
        buyerName: buyer.name,
        subtotal,
        tax,
        freight,
        total,
        lineItems: poLineItems,
      });
      purchaseOrders.push(po);
    }
    console.log(`✅ Created ${purchaseOrders.length} purchase orders\n`);

    // 5. Create Receiving Records (linked to POs)
    console.log('📥 Creating receiving records...');
    const receivingRecords: any[] = [];
    
    // Create receiving for sent/partially_received/received POs
    const posToReceive = purchaseOrders.filter(po => 
      ['sent', 'partially_received', 'received'].includes(po.status)
    );

    for (let i = 0; i < posToReceive.length; i++) {
      const po = posToReceive[i];
      const job = JOBS.find(j => j.id === po.jobId) || JOBS[0];
      const receiver = USERS.find(u => u.role === 'field') || USERS[3];

      // Determine how much was received (full or partial)
      const isPartial = po.status === 'partially_received';
      const receivePercent = isPartial ? 0.6 + Math.random() * 0.3 : 1.0; // 60-90% for partial, 100% for received

      const receivingLineItems = po.lineItems.map((item: any, index: number) => {
        const receivedQty = Math.floor(item.quantity * receivePercent);
        const previousReceived = Math.floor(item.quantity * (receivePercent - 0.3)); // Simulate previous receipt
        
        return {
          poLineItemIndex: index,
          productId: item.productId,
          productName: item.productName,
          orderedQuantity: item.quantity,
          receivedQuantity: receivedQty,
          previousReceivedQuantity: Math.max(0, previousReceived),
          condition: Math.random() > 0.9 ? 'damaged' : 'good' as const,
          notes: Math.random() > 0.8 ? 'Some items slightly damaged but usable' : undefined,
        };
      });

      const receiving = await Receiving.create({
        receiptNumber: `REC-2025-${String(i + 1).padStart(3, '0')}`,
        purchaseOrderId: po._id.toString(),
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        jobId: job.id,
        jobName: job.name,
        receivedByUserId: receiver.id,
        receivedByName: receiver.name,
        receivedDate: new Date(po.orderDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000), // Within 14 days of order
        deliveryDate: new Date(po.orderDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        locationPlaced: Math.random() > 0.5 ? `Job Site ${job.name}` : 'Main Warehouse',
        billOfLadingPhoto: `https://example.com/bills/lading-${i + 1}.jpg`,
        materialPhotos: [
          `https://example.com/materials/received-${i + 1}-1.jpg`,
          `https://example.com/materials/received-${i + 1}-2.jpg`,
        ],
        lineItems: receivingLineItems,
        status: 'completed',
        notes: Math.random() > 0.7 ? 'All materials received in good condition' : undefined,
      });
      receivingRecords.push(receiving);

      // Update inventory based on receiving
      for (const lineItem of receivingLineItems) {
        if (lineItem.productId && lineItem.condition === 'good') {
          const inventory = await Inventory.findOne({
            productId: lineItem.productId,
            locationId: receiving.locationPlaced?.includes('Warehouse') ? LOCATIONS[0].id : LOCATIONS.find(l => l.jobId === job.id)?.id || LOCATIONS[0].id,
          });

          if (inventory) {
            inventory.onHand += lineItem.receivedQuantity;
            inventory.onOrder = Math.max(0, inventory.onOrder - lineItem.receivedQuantity);
            await inventory.save();
          } else {
            // Create new inventory record if doesn't exist
            const location = receiving.locationPlaced?.includes('Warehouse') 
              ? LOCATIONS[0] 
              : LOCATIONS.find(l => l.jobId === job.id) || LOCATIONS[0];
            
            const product = products.find(p => p._id.toString() === lineItem.productId);
            await Inventory.create({
              productId: lineItem.productId,
              productName: lineItem.productName,
              locationId: location.id,
              locationName: location.name,
              locationType: location.type,
              jobId: location.jobId,
              onHand: lineItem.receivedQuantity,
              allocated: 0,
              onOrder: 0,
              averageCost: product?.standardCost || product?.lastPrice || 10.00,
            });
          }
        }
      }
    }
    console.log(`✅ Created ${receivingRecords.length} receiving records\n`);

    // Summary
    console.log('📊 SEED SUMMARY');
    console.log('================');
    console.log(`Products: ${products.length}`);
    console.log(`Inventory Records: ${inventoryRecords.length}`);
    console.log(`Material Orders: ${materialOrders.length}`);
    console.log(`Purchase Orders: ${purchaseOrders.length}`);
    console.log(`Receiving Records: ${receivingRecords.length}`);
    console.log('\n✅ Seed completed successfully!');
    console.log('\n💡 All data is interconnected:');
    console.log('   - Products → Inventory (by location)');
    console.log('   - Material Orders → Purchase Orders');
    console.log('   - Purchase Orders → Receiving');
    console.log('   - Receiving → Inventory updates');
    console.log('   - All linked to Jobs and Suppliers');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedInventorySystem();

