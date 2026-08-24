const mongooseLib = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '../../../.env');
const envExamplePath = path.join(__dirname, '../../../.env.example');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(envExamplePath)) {
  dotenv.config({ path: envExamplePath });
} else {
  dotenv.config();
}

// Models
const User = require('../models/User');
const Address = require('../models/Address');
const Category = require('../models/Category');
const MaterialType = require('../models/MaterialType');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');
const Payout = require('../models/Payout');
const Dispute = require('../models/Dispute');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Cart = require('../models/Cart');
const MapPlace = require('../models/MapPlace');

const dbUri =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/managed-marketplace';

/**
 * Seed database.
 *
 * isImported = false:
 *   Production-safe mode.
 *   - NEVER clears existing production data.
 *   - Seeds only when the database is empty.
 *
 * isImported = true:
 *   Development/reset mode.
 *   - Clears existing collections.
 *   - Seeds fresh demo data.
 */
const seedData = async (isImported = false) => {
  try {
    // Connect if not already connected
    if (mongooseLib.connection.readyState === 0) {
      console.log('Connecting to database...');
      await mongooseLib.connect(dbUri);
    }

    console.log('Database connected.');

    // ============================================================
    // PRODUCTION MODE
    // ============================================================
    if (!isImported) {
      const existingUsers = await User.countDocuments();

      if (existingUsers > 0) {
        console.log(
          '✅ Database already contains data. Skipping initial seed.'
        );
        return;
      }

      console.log(
        '🌱 Production database is empty. Starting initial seed...'
      );
    }

    // ============================================================
    // DEVELOPMENT / RESET MODE
    // ============================================================
    if (isImported) {
      console.log('🧹 Development reset requested.');
      console.log('Clearing existing collections...');

      await User.deleteMany({});
      await Address.deleteMany({});
      await Category.deleteMany({});
      await MaterialType.deleteMany({});
      await Product.deleteMany({});
      await Order.deleteMany({});
      await Payment.deleteMany({});
      await Delivery.deleteMany({});
      await Payout.deleteMany({});
      await Dispute.deleteMany({});
      await Review.deleteMany({});
      await Notification.deleteMany({});
      await AuditLog.deleteMany({});
      await Cart.deleteMany({});
      await MapPlace.deleteMany({});

      console.log('✅ Development database cleared.');
    }

    // ============================================================
    // SEED CATEGORIES
    // ============================================================
    console.log('Seeding Categories...');

    const categoriesData = [
      {
        name: 'Electronics & Appliances',
        description:
          'Usable electronic waste, scrap, and second-hand appliances',
      },
      {
        name: 'Furniture',
        description:
          'Desks, chairs, tables, and cabinets made of wood, metal, or plastic',
      },
      {
        name: 'Clothing & Fashion',
        description:
          'Usable second-hand clothes, textiles, and fabrics',
      },
      {
        name: 'Household Items',
        description:
          'General household scrap, usable items, decorations',
      },
      {
        name: 'Kitchen Items',
        description:
          'Pots, pans, containers, and kitchen utensils',
      },
      {
        name: 'Books & Education',
        description:
          'Used textbooks, novels, paper scrap',
      },
      {
        name: 'Tools & Equipment',
        description:
          'Construction and repair tools, motors, wires',
      },
      {
        name: 'Baby & Kids',
        description:
          'Toys, cribs, clothing for children',
      },
      {
        name: 'Sports & Fitness',
        description:
          'Bicycles, weights, outdoor usable gear',
      },
      {
        name: 'Other',
        description:
          'Miscellaneous usable scrap materials',
      },
    ];

    const seededCategories =
      await Category.insertMany(categoriesData);

    console.log(
      `Seeded ${seededCategories.length} categories.`
    );

    // ============================================================
    // SEED MATERIAL TYPES
    // ============================================================
    console.log('Seeding Material Types...');

    const materialsData = [
      {
        name: 'Plastic',
        description:
          'PET bottles, containers, structural plastic',
      },
      {
        name: 'Metal',
        description:
          'Scrap iron, steel bars, copper wire, aluminum',
      },
      {
        name: 'Wood',
        description:
          'Pallets, logs, lumber, broken furniture parts',
      },
      {
        name: 'Glass',
        description:
          'Bottles, jars, glass sheet remnants',
      },
      {
        name: 'Fabric',
        description:
          'Textiles, canvas, cotton scrap',
      },
      {
        name: 'Leather',
        description:
          'Belts, bags, shoes, remnants',
      },
      {
        name: 'Paper',
        description:
          'Cardboard, books, newspaper bales',
      },
      {
        name: 'Electronic',
        description:
          'Circuits, components, scrap appliances',
      },
      {
        name: 'Mixed Material',
        description:
          'Complex products with multiple materials combined',
      },
      {
        name: 'Other',
        description:
          'Other unclassified materials',
      },
    ];

    const seededMaterials =
      await MaterialType.insertMany(materialsData);

    console.log(
      `Seeded ${seededMaterials.length} material types.`
    );

    // ============================================================
    // SEED USERS
    // ============================================================
    console.log('Seeding Users...');

    // Admin
    const adminUser = await User.create({
      name: 'Adama Admin',
      email: 'admin@marketplace.com',
      password: 'AdminPass123',
      role: 'ADMIN',
      isActive: true,
    });

    // Finance Staff
    const staffFinance = await User.create({
      name: 'Selam Finance',
      email: 'staff.finance@marketplace.com',
      password: 'StaffPass123',
      role: 'STAFF',
      staffPermissions: [
        'VIEW_ORDERS',
        'VERIFY_PAYMENTS',
        'VIEW_SELLER_PAYOUTS',
        'PROCESS_PAYOUTS',
      ],
      isActive: true,
    });

    // Logistics Staff
    const staffLogistics = await User.create({
      name: 'Bekele Logistics',
      email: 'staff.logistics@marketplace.com',
      password: 'StaffPass123',
      role: 'STAFF',
      staffPermissions: [
        'VIEW_ORDERS',
        'MANAGE_DELIVERIES',
        'SET_DELIVERY_FEES',
        'UPDATE_ORDER_STATUS',
      ],
      isActive: true,
    });

    // Seller 1 (Approved demo seller with shop location inside Adama)
    const seller1 = await User.create({
      name: 'Abebe Seller One',
      email: 'seller1@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251922334455',
      sellerProfile: {
        shopName: 'Abebe Salvage & Materials Depot [Demo]',
        shopDescription: 'Specialized in reclaimed structural steel pipes, timber, roof sheets, and heavy doors.',
        shopAddress: 'Bole Subcity, Industry Zone, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2780, 8.5420],
          address: 'Bole Subcity, Industry Zone, Adama',
        },
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        bankAccountHolder: 'Abebe Kebede Materials',
        bankAccountNumber: '1000234567890',
        approvalStatus: 'APPROVED',
      },
    });

    // Seller 2 (Approved demo seller in Central Adama)
    const seller2 = await User.create({
      name: 'Kebede Seller Two',
      email: 'seller2@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251933445566',
      sellerProfile: {
        shopName: 'Kebede Used Fixtures & Tools [Demo]',
        shopDescription: 'Quality second-hand tools, copper cables, circuit breakers, and electrical supplies.',
        shopAddress: 'Kebele 04, Central Commercial District, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2650, 8.5480],
          address: 'Kebele 04, Central Commercial District, Adama',
        },
        bankName: 'Awash Bank',
        bankAccountHolder: 'Kebede Tadesse',
        bankAccountNumber: '01320894567100',
        approvalStatus: 'APPROVED',
      },
    });

    // Seller 3 (Approved demo seller in Post Office Area)
    const seller3 = await User.create({
      name: 'Oromia Scrap Steel Works',
      email: 'seller3@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251944556677',
      sellerProfile: {
        shopName: 'Oromia Scrap Steel & Metal Yard [Demo]',
        shopDescription: 'Bulk heavy H-beams, structural channel iron, steel plates, and angle iron salvage.',
        shopAddress: 'Kebele 02, Post Office Area, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2710, 8.5530],
          address: 'Kebele 02, Post Office Area, Adama',
        },
        bankName: 'Dashen Bank',
        bankAccountHolder: 'Oromia Metal Works',
        bankAccountNumber: '5012398471001',
        approvalStatus: 'APPROVED',
      },
    });

    // Seller 4 (Approved demo seller in Aba Geda Subcity)
    const seller4 = await User.create({
      name: 'Adama Circular Plastics',
      email: 'seller4@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251955667788',
      sellerProfile: {
        shopName: 'Adama Circular Plastics & Recyclables [Demo]',
        shopDescription: 'High-density HDPE barrels, industrial plastic crates, PVC pipes, and polymer scrap.',
        shopAddress: 'Aba Geda Subcity, Wonji Road, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2840, 8.5260],
          address: 'Aba Geda Subcity, Wonji Road, Adama',
        },
        bankName: 'Cooperative Bank of Oromia',
        bankAccountHolder: 'Circular Plastics Adama',
        bankAccountNumber: '1004928374100',
        approvalStatus: 'APPROVED',
      },
    });

    // Seller 5 (Approved demo seller in Melka Hida)
    const seller5 = await User.create({
      name: 'Rift Valley Timber Supply',
      email: 'seller5@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251966778899',
      sellerProfile: {
        shopName: 'Rift Valley Timber & Pallet Depot [Demo]',
        shopDescription: 'Treated eucalyptus poles, reclaimed wood pallets, framing timber, and surplus plywood.',
        shopAddress: 'Melka Hida Area, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2560, 8.5320],
          address: 'Melka Hida Area, Adama',
        },
        bankName: 'Bank of Abyssinia',
        bankAccountHolder: 'Rift Valley Timber LLC',
        bankAccountNumber: '8910237461900',
        approvalStatus: 'APPROVED',
      },
    });

    // Seller 6 (Approved demo seller in Boku Subcity)
    const seller6 = await User.create({
      name: 'Boku Machinery Surplus',
      email: 'seller6@marketplace.com',
      password: 'SellerPass123',
      role: 'SELLER',
      roles: ['SELLER'],
      isSellerApproved: true,
      isActive: true,
      phoneNumber: '+251977889900',
      sellerProfile: {
        shopName: 'Boku Industrial Surplus & Motors [Demo]',
        shopDescription: 'Decommissioned electric motors, industrial water pumps, gearboxes, and transformers.',
        shopAddress: 'Boku Subcity, Mojo Road Corridor, Adama',
        shopLocation: {
          type: 'Point',
          coordinates: [39.2480, 8.5620],
          address: 'Boku Subcity, Mojo Road Corridor, Adama',
        },
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        bankAccountHolder: 'Boku Surplus Traders',
        bankAccountNumber: '1000987654321',
        approvalStatus: 'APPROVED',
      },
    });

    // Buyer 1
    const buyer1 = await User.create({
      name: 'Tariku Buyer One',
      email: 'buyer1@marketplace.com',
      password: 'BuyerPass123',
      role: 'BUYER',
      roles: ['BUYER'],
      isActive: true,
      phoneNumber: '+251911223344',
    });

    // Buyer 2
    const buyer2 = await User.create({
      name: 'Chala Buyer Two',
      email: 'buyer2@marketplace.com',
      password: 'BuyerPass123',
      role: 'BUYER',
      roles: ['BUYER'],
      isActive: true,
      phoneNumber: '+251944556677',
    });

    console.log(
      'Seeded Users. Seeding default addresses & Map Places...'
    );

    // ============================================================
    // SEED ADDRESSES
    // ============================================================

    await Address.create({
      user: buyer1._id,
      title: 'Home Address',
      streetAddress:
        'Kebele 02, Block 12, House 405',
      subCity: 'Kebele 02',
      city: 'Adama',
      phoneNumber: '+251911223344',
      location: {
        type: 'Point',
        coordinates: [39.2710, 8.5460],
      },
      isDefault: true,
    });

    await Address.create({
      user: seller1._id,
      title: 'Shop Depot',
      streetAddress:
        'Bole Subcity, Industry Zone',
      subCity: 'Bole',
      city: 'Adama',
      phoneNumber: '+251922334455',
      location: {
        type: 'Point',
        coordinates: [39.2780, 8.5420],
      },
      isDefault: true,
    });

    // ============================================================
    // SEED ADMIN-MANAGED MAP PLACES (Demo / Test Data — 8 Verified Depots)
    // ============================================================
    await MapPlace.create([
      {
        name: 'Adama Central Scrap Metal Hub [Demo]',
        category: 'Scrap Metals & Machinery',
        materials: ['Structural Steel', 'Cast Iron', 'Copper Wire', 'Sheet Metal'],
        description: 'Demo verified local recycling yard accepting bulk scrap and industrial equipment.',
        address: 'Kebele 03, Ring Road, Adama',
        phone: '+251221112233',
        location: {
          type: 'Point',
          coordinates: [39.2910, 8.5520],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Nazret Timber & Salvage Yard [Demo]',
        category: 'Reclaimed Timber & Wood',
        materials: ['Hardwood Beams', 'Planks', 'Plywood', 'Reclaimed Doors'],
        description: 'Demo verified reclaimed construction timber, beams, and second-hand roofing wood.',
        address: 'Wonji Road Junction, Adama',
        phone: '+251221114455',
        location: {
          type: 'Point',
          coordinates: [39.2820, 8.5180],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Bole Industrial Scrap Collection Center [Demo]',
        category: 'Industrial Scrap & Refuse',
        materials: ['Aluminum Shavings', 'Steel Trimmings', 'Industrial Pallets'],
        description: 'Demo collection point for manufacturing offcuts and industrial metal trimmings.',
        address: 'Bole Subcity, Industry Zone East, Adama',
        phone: '+251221116677',
        location: {
          type: 'Point',
          coordinates: [39.2880, 8.5380],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Adama Municipal Plastics Recycling Depot [Demo]',
        category: 'Plastics & Polymers',
        materials: ['PET Flakes', 'HDPE Crates', 'Polymer Scrap', 'Nylon Sacks'],
        description: 'Demo facility processing sorted municipal plastics and bulk polymer scrap.',
        address: 'Kebele 06, Near Stadium, Adama',
        phone: '+251221118899',
        location: {
          type: 'Point',
          coordinates: [39.2680, 8.5410],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Goro Salvage & Demolition Materials Yard [Demo]',
        category: 'Construction & Demolition Salvage',
        materials: ['Rebar Offcuts', 'Used Bricks', 'Roofing Tiles', 'Stone Slabs'],
        description: 'Demo depot for recovered building materials from regional demolition and remodels.',
        address: 'Goro Subcity, North Gate, Adama',
        phone: '+251221119900',
        location: {
          type: 'Point',
          coordinates: [39.2750, 8.5720],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Adama University Corridor E-Waste Dropoff [Demo]',
        category: 'Electronic Waste & Components',
        materials: ['Motherboards', 'Copper Coils', 'Computer Chassis', 'Lithium Batteries'],
        description: 'Demo safe drop-off station for obsolete electronics, wiring, and computer hardware.',
        address: 'ASTU University Road, Adama',
        phone: '+251221113322',
        location: {
          type: 'Point',
          coordinates: [39.2950, 8.5580],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Wonji Sugar By-product & Scrap Depot [Demo]',
        category: 'Agricultural & Industrial Salvage',
        materials: ['Heavy Machinery Parts', 'Steel Conveyor Belts', 'Scrap Boiler Tubes'],
        description: 'Demo rural fringe depot trading heavy agro-industrial metal components.',
        address: 'South Wonji Gate, Adama Fringe',
        phone: '+251221117766',
        location: {
          type: 'Point',
          coordinates: [39.2760, 8.4980],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
      {
        name: 'Expressway Interchange Material Hub [Demo]',
        category: 'Bulk Aggregates & Freight Surplus',
        materials: ['Freight Pallets', 'Steel Strapping', 'Industrial Crates', 'Gravel Overs'],
        description: 'Demo logistics staging point with shipping pallets and transport surplus.',
        address: 'Addis-Adama Toll Road Exit, Adama',
        phone: '+251221115544',
        location: {
          type: 'Point',
          coordinates: [39.2420, 8.5780],
        },
        source: 'ADMIN_MANAGED',
        isVerified: true,
        isActive: true,
        addedBy: adminUser._id,
      },
    ]);

    console.log(
      'Seeded addresses. Seeding default Products...'
    );

    // ============================================================
    // CATEGORY REFERENCES
    // ============================================================

    const electronicsCat = seededCategories.find(
      (c) => c.name === 'Electronics & Appliances'
    );

    const furnitureCat = seededCategories.find(
      (c) => c.name === 'Furniture'
    );

    const toolsCat = seededCategories.find(
      (c) => c.name === 'Tools & Equipment'
    );

    const booksCat = seededCategories.find(
      (c) => c.name === 'Books & Education'
    );

    const kitchenCat = seededCategories.find(
      (c) => c.name === 'Kitchen Items'
    );

    const householdCat = seededCategories.find(
      (c) => c.name === 'Household Items'
    );

    const otherCat = seededCategories.find(
      (c) => c.name === 'Other'
    );

    // ============================================================
    // MATERIAL REFERENCES
    // ============================================================

    const plasticMat = seededMaterials.find(
      (m) => m.name === 'Plastic'
    );

    const woodMat = seededMaterials.find(
      (m) => m.name === 'Wood'
    );

    const metalMat = seededMaterials.find(
      (m) => m.name === 'Metal'
    );

    const paperMat = seededMaterials.find(
      (m) => m.name === 'Paper'
    );

    const electroMat = seededMaterials.find(
      (m) => m.name === 'Electronic'
    );

    const mixedMat = seededMaterials.find(
      (m) => m.name === 'Mixed Material'
    );

    // ============================================================
    // SEED PRODUCTS
    // ============================================================

    const productsData = [
      // ── Used Furniture ──
      {
        name: 'Usable Pine Wood Pallets',
        description:
          'Batch of 10 clean pine wood pallets. Great for building scrap wood furniture or storage shelving.',
        price: 450,
        quantity: 8,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1742203900461-d822f8e7fd30?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fFVzYWJsZSUyMFBpbmUlMjBXb29kJTIwUGFsbGV0c3xlbnwwfHwwfHx8MA%3D%3D',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Bole',
          city: 'Adama',
        },
      },
      {
        name: 'Heavy Duty Metal Filing Cabinet',
        description:
          'Solid steel 4-drawer filing cabinet in Excellent condition. Keys are included.',
        price: 2500,
        quantity: 2,
        category: furnitureCat._id,
        materialType: metalMat._id,
        condition: 'Like New',
        images: [
          'https://images.unsplash.com/photo-1613043547213-cf19e438093c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fEhlYXZ5JTIwRHV0eSUyME1ldGFsJTIwRmlsaW5nJTIwQ2FiaW5ldHxlbnwwfHwwfHx8MA%3D%3D',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 04',
          city: 'Adama',
        },
      },
      {
        name: 'Used Solid Wood Office Desk',
        description:
          'Sturdy hardwood office desk with 3 lockable side drawers. Minor surface scratches but structurally very solid.',
        price: 3200,
        quantity: 1,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1646705193406-8083b661ee9d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fFVzZWQlMjBTb2xpZCUyMFdvb2QlMjBPZmZpY2UlMjBEZXNrfGVufDB8fDB8fHww',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },
      {
        name: 'Used Ergonomic Mesh Swivel Chair',
        description:
          'High-back adjustable mesh office chair with lumbar support. Hydraulics and wheels work smoothly.',
        price: 2100,
        quantity: 3,
        category: furnitureCat._id,
        materialType: mixedMat._id,
        condition: 'Good',
        images: [
          'https://plus.unsplash.com/premium_photo-1734029815108-169d085ca9aa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VXNlZCUyMEVyZ29ub21pYyUyME1lc2glMjBTd2l2ZWwlMjBDaGFpcnxlbnwwfHwwfHx8MA%3D%3D',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Bole',
          city: 'Adama',
        },
      },
      {
        name: 'Used Wooden Dining Table with 4 Chairs',
        description:
          'Complete 4-seater dining set made of polished eucalyptus wood. Clean and ready for home or cafe use.',
        price: 4800,
        quantity: 1,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: [
          'https://media.istockphoto.com/id/181890184/photo/old-chairs-and-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=8hIQdK-0fikqqo2jXy6mtpqQVDNxOpLJipt81L64YWc=',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 05',
          city: 'Adama',
        },
      },

      // ── Used Electronics & Devices ──
      {
        name: 'Used Dell Latitude 14" Laptop (Core i5 / 8GB RAM / 256GB SSD)',
        description:
          'Second-hand business laptop in tested working condition. Battery holds 3+ hours charge. Includes original charger.',
        price: 14500,
        quantity: 2,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Bole',
          city: 'Adama',
        },
      },
      {
        name: 'Used Samsung Galaxy A32 (128GB - Black)',
        description:
          'Original smartphone with dual SIM support. Screen is clean with tempered glass installed. No box, includes charging cable.',
        price: 8200,
        quantity: 1,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1767116188130-6077d5c4e990?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VXNlZCUyMFNhbXN1bmclMjBHYWxheHklMjBBMzIlMjAoMTI4R0IlMjAtJTIwQmxhY2spfGVufDB8fDB8fHww',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 03',
          city: 'Adama',
        },
      },
      {
        name: 'Used Sony Bravia 40" LED Smart TV',
        description:
          '40-inch Full HD television with remote control and HDMI ports. Vibrant display, works with DSTV/Canal+ decoders.',
        price: 9800,
        quantity: 1,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://plus.unsplash.com/premium_photo-1683121217848-44dde7d393e6?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        ],
        seller: seller2._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 04',
          city: 'Adama',
        },
      },
      {
        name: 'Second-hand Electric Drill (Bosch 650W)',
        description:
          'Authentic Bosch electric impact drill, corded. Missing extra bits, but the motor and chuck run strong.',
        price: 1800,
        quantity: 1,
        category: toolsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller2._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 04',
          city: 'Adama',
        },
      },

      // ── Used Plastics & Containers (Seller 4) ──
      {
        name: 'Clean Recycled PET Bottle Bales (50kg)',
        description:
          'Large bale of sorted, washed, and compressed transparent PET plastic bottles. Ready for shredding or recycling extrusion.',
        price: 1500,
        quantity: 5,
        category: otherCat._id,
        materialType: plasticMat._id,
        condition: 'Used',
        images: [
          'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller4._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Aba Geda',
          city: 'Adama',
        },
      },
      {
        name: 'Heavy-Duty Used Plastic Water Barrels (200L - Blue)',
        description:
          'Food-grade high-density polyethylene (HDPE) barrels with tight-seal screw tops. Thoroughly cleaned and leak-free.',
        price: 1600,
        quantity: 4,
        category: householdCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: [
          'https://media.istockphoto.com/id/808824306/photo/blue-barrels-storage-drums.jpg?s=612x612&w=0&k=20&c=5JVi-CYiBdDz5fLc75QXIdIj3xqcDOi-XyyIBiv9br8=',
        ],
        seller: seller4._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Aba Geda',
          city: 'Adama',
        },
      },
      {
        name: 'Used Industrial Plastic Crates (Pack of 6)',
        description:
          'Heavy stackable storage crates suitable for vegetables, bottles, mechanical parts, or warehouse inventory.',
        price: 1100,
        quantity: 6,
        category: otherCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1588595422102-da26a1cb48c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8VXNlZCUyMEluZHVzdHJpYWwlMjBQbGFzdGljJTIwQ3JhdGVzJTIwKFBhY2slMjBvZiUyMDYpfGVufDB8fDB8fHww',
        ],
        seller: seller4._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Aba Geda',
          city: 'Adama',
        },
      },

      // ── Used Irons & Scrap Metals (Seller 3) ──
      {
        name: 'Scrap Cast Iron Pipes & Structural Angles (Approx. 45kg)',
        description:
          'Heavy gauge cast iron scrap pieces, structural angles, and solid flanges. Ideal for foundry melting or metal fabrication.',
        price: 2900,
        quantity: 1,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: [
          'https://images.unsplash.com/photo-1763950865631-4ca11bebe017?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fFNjcmFwJTIwQ2FzdCUyMElyb24lMjBQaXBlcyUyMCUyNiUyMFN0cnVjdHVyYWwlMjBBbmdsZXMlMjAoQXBwcm94LiUyMDQ1a2cpfGVufDB8fDB8fHww',
        ],
        seller: seller3._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },
      {
        name: 'Scrap Iron Rebar & Steel Rod Cutoffs (Bundle of 25)',
        description:
          'Usable construction scrap rebars (12mm and 14mm), lengths from 1.5m to 2.5m. Great for reinforced concrete foundations.',
        price: 3500,
        quantity: 2,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: [
          'https://images.unsplash.com/photo-1763771420746-c75fefab51b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8U2NyYXAlMjBJcm9uJTIwUmViYXIlMjAlMjYlMjBTdGVlbCUyMFJvZCUyMEN1dG9mZnMlMjAoQnVuZGxlJTIwb2YlMjAyNSl8ZW58MHx8MHx8fDA%3D',
        ],
        seller: seller3._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },
      {
        name: 'Scrap Copper Wires (12kg Stripped Bright Copper)',
        description:
          'Stripped high-purity electrical copper cables and motor windings. Weighs approximately 12kg.',
        price: 3200,
        quantity: 1,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: [
          'https://media.istockphoto.com/id/1835566623/photo/a-bunch-of-old-copper-cables-in-a-plastic-sheath-front-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=IKkR2TYv-Sx9yTY9Nl0yv8dIJz95GfuN517_3NcDgqc=',
        ],
        seller: seller3._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },
      {
        name: 'Used Corrugated Galvanized Iron Sheets (8 Pcs)',
        description:
          'Pre-used 28-gauge zinc roofing sheets. Minor nail holes but free of heavy rust. Usable for fencing or outbuilding roofs.',
        price: 2400,
        quantity: 3,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Fair',
        images: [
          'https://media.istockphoto.com/id/2288771591/photo/roofing-material-for-houses-building-material.jpg?s=612x612&w=0&k=20&c=glEHkYk621Xs-31oKdIURDlQWBvNO5TzUFLwMNBTnJM=',
        ],
        seller: seller3._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },

      // ── Additional Used Furniture (Seller 5) ──
      {
        name: 'Used 3-Piece Living Room Sofa Set (Grey Fabric)',
        description:
          'Comfortable 3-piece fabric sofa set. Cushions are firm, smoke-free home, clean and ready for living room.',
        price: 9500,
        quantity: 1,
        category: furnitureCat._id,
        materialType: mixedMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller5._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Melka Hida',
          city: 'Adama',
        },
      },
      {
        name: 'Used 5-Tier Solid Wood Bookshelf',
        description:
          'Tall 5-shelf wooden bookcase in mahogany finish. Great for books, binders, and home office display.',
        price: 2600,
        quantity: 2,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1675241816662-faab5f4c3f88?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fFVzZWQlMjA1LVRpZXIlMjBTb2xpZCUyMFdvb2QlMjBCb29rc2hlbGZ8ZW58MHx8MHx8fDA%3D',
        ],
        seller: seller5._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Melka Hida',
          city: 'Adama',
        },
      },
      {
        name: 'Used Glass-Top Coffee Table with Steel Legs',
        description:
          'Modern coffee table with 8mm thick tempered glass top and polished steel base. Scratch-resistant.',
        price: 1750,
        quantity: 1,
        category: furnitureCat._id,
        materialType: mixedMat._id,
        condition: 'Like New',
        images: [
          'https://media.istockphoto.com/id/1034892940/photo/modern-glass-table-in-the-loft-interior.webp?a=1&b=1&s=612x612&w=0&k=20&c=S9VhLxdmRxgOoN04RzjwFkgB4-sl8vwAv5CvNWdimO8=',
        ],
        seller: seller5._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Melka Hida',
          city: 'Adama',
        },
      },

      // ── Additional Used Machinery (Seller 6) ──
      {
        name: 'Used 3-Phase Industrial Electric Motor (5.5kW)',
        description:
          'High torque 5.5kW asynchronous 3-phase induction motor with cast iron housing. Tested and runs smooth.',
        price: 12500,
        quantity: 1,
        category: toolsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://media.istockphoto.com/id/939597574/photo/the-group-pumps-at-the-water-pipe.webp?a=1&b=1&s=612x612&w=0&k=20&c=JS8bOn5XufjQMuwIZbShp6_ceWz09ZK2UoShiYmZtO4=',
        ],
        seller: seller6._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Boku',
          city: 'Adama',
        },
      },
      {
        name: 'Used HP Pavilion 15" Laptop (Core i7 / 16GB RAM / 512GB SSD)',
        description:
          'Fast high-performance used laptop with full HD screen and backlit keyboard. Battery holds 4 hours.',
        price: 21500,
        quantity: 1,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller2._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 04',
          city: 'Adama',
        },
      },
      {
        name: 'Used Apple iPhone 11 (64GB - White)',
        description:
          'Factory unlocked iPhone 11. Battery health at 84%. Camera and FaceID work perfectly. Comes with silicone case.',
        price: 16800,
        quantity: 1,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1726574778294-adfb9ee2e5ca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVzZWQlMjBBcHBsZSUyMGlQaG9uZSUyMDExJTIwKDY0R0IlMjAtJTIwV2hpdGUpfGVufDB8fDB8fHww',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 04',
          city: 'Adama',
        },
      },
      {
        name: 'Used Samsung 24" Borderless IPS Monitor',
        description:
          '75Hz full HD computer monitor with HDMI and VGA ports. Clean screen with no dead pixels. Includes power adapter.',
        price: 4900,
        quantity: 2,
        category: electronicsCat._id,
        materialType: electroMat._id,
        condition: 'Like New',
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },

      // ── Additional Used Plastics & Containers ──
      {
        name: 'Used Heavy-Duty Plastic Pallets (120x100cm - Stack of 3)',
        description:
          'Durable stackable HDPE industrial plastic pallets. Chemical-resistant and weather-proof for warehouse storage.',
        price: 2800,
        quantity: 4,
        category: otherCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1734510722516-5a558dc910d2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8VXNlZCUyMEhlYXZ5LUR1dHklMjBQbGFzdGljJTIwUGFsbGV0cyUyMCgxMjB4MTAwY20lMjAtJTIwU3RhY2slMjBvZiUyMDMpfGVufDB8fDB8fHww',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Industry Zone',
          city: 'Adama',
        },
      },

      // ── Additional Used Irons & Scrap Metals ──
      {
        name: 'Scrap Structural Steel I-Beam Cutoffs (Total ~55kg)',
        description:
          'Heavy construction steel I-beam pieces and channel steel. High tensile strength, ideal for building lintels or welding.',
        price: 3900,
        quantity: 1,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: [
          'https://media.istockphoto.com/id/2240733264/photo/steel-piled-together.webp?a=1&b=1&s=612x612&w=0&k=20&c=bd4EG8mXS43efd3lhXqi7b8fV3IWIR_HbKUSQsgtI9s=',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Industry Zone',
          city: 'Adama',
        },
      },
      {
        name: 'Used Solid Iron Security Window Grilles (Set of 3)',
        description:
          'Welded 16mm square bar window security grilles (120x100cm each). Coated with anti-rust red primer paint.',
        price: 3600,
        quantity: 2,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: [
          'https://plus.unsplash.com/premium_photo-1676033369759-7d4b854c0512?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VXNlZCUyMFNvbGlkJTIwSXJvbiUyMFNlY3VyaXR5JTIwV2luZG93JTIwR3JpbGxlc3xlbnwwfHwwfHx8MA%3D%3D',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 07',
          city: 'Adama',
        },
      },
      {
        name: 'Used 12V 75Ah Heavy Duty Automotive Battery',
        description:
          'Tested lead-acid car battery with 12.6V resting charge. Also suitable for solar inverter backup or core recycling.',
        price: 2700,
        quantity: 2,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1676337167385-fa7a8d1eac07?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVzZWQlMjAxMlYlMjA3NUFoJTIwSGVhdnklMjBEdXR5JTIwQXV0b21vdGl2ZSUyMEJhdHRlcnl8ZW58MHx8MHx8fDA%3D',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Bole',
          city: 'Adama',
        },
      },

      // ── Other Usable Secondary Materials & Construction Salvage ──
      {
        name: 'Used Commercial Microwave Oven (LG 30L Stainless Steel)',
        description:
          'Heavy-duty microwave oven with digital keypad. Clean stainless cavity, tested and heats quickly.',
        price: 3400,
        quantity: 1,
        category: kitchenCat._id,
        materialType: electroMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8VXNlZCUyMENvbW1lcmNpYWwlMjBNaWNyb3dhdmUlMjBPdmVufGVufDB8fDB8fHww',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Bole',
          city: 'Adama',
        },
      },
      {
        name: 'Reclaimed Construction Hardwood Timber Beams & Joists',
        description:
          'Dry seasoned eucalyptus and cypress construction lumber (4x4 and 2x4 beams). Stored dry, perfect for structural formwork or framing.',
        price: 3100,
        quantity: 6,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: [
          'https://media.istockphoto.com/id/2167285206/photo/edged-boards-building-material-the-material-is-made-of-wood.webp?a=1&b=1&s=612x612&w=0&k=20&c=CtC8QZWzjv4oEgBvayYP22bZj_GR5KMVUJ__v5FMkbQ=',
        ],
        seller: seller5._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Melka Hida',
          city: 'Adama',
        },
      },
      {
        name: 'Cleaned Demolition Red Clay Bricks (Pack of 150 Pcs)',
        description:
          'Solid kiln-fired red clay bricks salvaged from building renovation. Cleaned of old mortar, stacked on wooden pallets in Adama.',
        price: 1800,
        quantity: 8,
        category: toolsCat._id,
        materialType: mixedMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1559322575-2f4e66131d55?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Q2xlYW5lZCUyMERlbW9saXRpb24lMjBSZWQlMjBDbGF5JTIwQnJpY2tzJTIwKFBhY2slMjBvZiUyMDE1MCUyMFBjcyl8ZW58MHx8MHx8fDA%3D',
        ],
        seller: seller3._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Kebele 02',
          city: 'Adama',
        },
      },
      {
        name: 'Salvaged Heavy Duty Aluminum Window Frames & Profiles',
        description:
          'Extruded bronze-anodized aluminum frame sections with intact rubber gaskets. Great for scrap recycling or workshop partitions.',
        price: 2600,
        quantity: 4,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: [
          'https://images.unsplash.com/photo-1719067720887-b55ecfdd21b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDEzfHx8ZW58MHx8fHx8',
        ],
        seller: seller1._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Industry Zone',
          city: 'Adama',
        },
      },
      {
        name: 'Heavy Scrap Vehicle Leaf Springs & Axles (Approx 70kg)',
        description:
          'High carbon spring steel leaf springs and solid forged axle shafts from heavy trucks. Ideal for blacksmithing and fabrication.',
        price: 4600,
        quantity: 2,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Used',
        images: [
          'https://images.unsplash.com/photo-1712045412870-e486f0bf93b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEhlYXZ5JTIwU2NyYXAlMjBWZWhpY2xlJTIwTGVhZiUyMFNwcmluZ3MlMjAlMjYlMjBBeGxlcyUyMChBcHByb3glMjA3MGtnKXxlbnwwfHwwfHx8MA%3D%3D',
        ],
        seller: seller6._id,
        approvalStatus: 'APPROVED',
        location: {
          subCity: 'Boku',
          city: 'Adama',
        },
      },
      {
        name: 'Used High School Mathematics & Physics Textbooks',
        description:
          'Bundle of Grade 11 and 12 Maths & Physics textbooks. Minor wear on covers, but complete and intact pages.',
        price: 450,
        quantity: 10,
        category: booksCat._id,
        materialType: paperMat._id,
        condition: 'Fair',
        images: [
          'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTT5O62YE3VZJLL6IEpEaxm60ajvi-BtKqeDgaeMeyAWQ&s',
        ],
        seller: seller2._id,
        approvalStatus: 'PENDING_APPROVAL',
        location: {
          subCity: 'Kebele 08',
          city: 'Adama',
        },
      },
    ];

    await Product.insertMany(productsData);

    console.log('Seeded default products.');

    // ============================================================
    // COMPLETE
    // ============================================================

    console.log('Database Seeding Complete! 🎉');

    console.log(
      'Demo Credentials for local testing:'
    );

    console.log(
      '----------------------------------------------------'
    );

    console.log(
      'Admin      | admin@marketplace.com        | AdminPass123'
    );

    console.log(
      'Staff (Fin)| staff.finance@marketplace.com | StaffPass123'
    );

    console.log(
      'Staff (Log)| staff.logistics@marketplace.com| StaffPass123'
    );

    console.log(
      'Seller 1   | seller1@marketplace.com      | SellerPass123'
    );

    console.log(
      'Seller 2   | seller2@marketplace.com      | SellerPass123'
    );

    console.log(
      'Buyer 1    | buyer1@marketplace.com       | BuyerPass123'
    );

    console.log(
      'Buyer 2    | buyer2@marketplace.com       | BuyerPass123'
    );

    console.log(
      '----------------------------------------------------'
    );

    // IMPORTANT:
    // Never call process.exit(0) here.
    // The server must continue running in production.

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

// Allow this file to be run directly for development/manual seeding
if (require.main === module) {
  seedData(true)
    .then(() => {
      console.log('✅ Manual database seed completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Manual database seed failed.');
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedData;