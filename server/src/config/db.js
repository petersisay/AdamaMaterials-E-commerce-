const mongoose = require('mongoose');
const seedData = require('../jobs/seed');
const ensureApprovedProductsExist = require('../jobs/seedProducts');

const cleanseProductImagesInDatabase = async () => {
  try {
    const Product = require('../models/Product');

    // 1. Permanently heal legacy title misspellings and standardize generic titles
    const titleRenames = {
      'Shirt': 'Everyday Pre-Shrunk Cotton Casual Shirt',
      'T-Shirt': 'Premium Apostolic Typography Graphic T-Shirt',
      'Jacket': 'Weather-Resistant Insulated Winter Jacket',
      'Tea Mug': 'High-Gloss Ceramic Tea Mug',
      'Bible Verse Coffee Cup': 'Inspirational Scripture Ceramic Coffee Cup',
      'Bible Cover': 'Protective Handcrafted Leather Bible Cover Case',
      'Biblical Books': 'Kalu Ynager Biblical Doctrine Study Books',
      'Bible Verse Tote Bag': 'Eco-Friendly Canvas Scripture Tote Bag',
      'Cap': 'Embroidered Apostolic Monogram Baseball Cap',
      'Hoddie': 'Classic Heavyweight Cotton Hoodie',
      'Hoodie': 'Classic Heavyweight Cotton Hoodie',
      'Bible Verse Hoddie': 'Bible Verse Hoodie'
    };

    for (const [oldName, newName] of Object.entries(titleRenames)) {
      await Product.updateMany({ name: oldName }, { $set: { name: newName } });
    }

    const products = await Product.find({});
    if (!products || products.length === 0) return;

    const uniqueImagesByProduct = {
      'Usable Pine Wood Pallets': 'https://images.unsplash.com/photo-1742203900461-d822f8e7fd30?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fFVzYWJsZSUyMFBpbmUlMjBXb29kJTIwUGFsbGV0c3xlbnwwfHwwfHx8MA%3D%3D',
      'Heavy Duty Metal Filing Cabinet': 'https://images.unsplash.com/photo-1613043547213-cf19e438093c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fEhlYXZ5JTIwRHV0eSUyME1ldGFsJTIwRmlsaW5nJTIwQ2FiaW5ldHxlbnwwfHwwfHx8MA%3D%3D',
      'Used Solid Wood Office Desk': 'https://images.unsplash.com/photo-1646705193406-8083b661ee9d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fFVzZWQlMjBTb2xpZCUyMFdvb2QlMjBPZmZpY2UlMjBEZXNrfGVufDB8fDB8fHww',
      'Used Ergonomic Mesh Swivel Chair': 'https://plus.unsplash.com/premium_photo-1734029815108-169d085ca9aa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VXNlZCUyMEVyZ29ub21pYyUyME1lc2glMjBTd2l2ZWwlMjBDaGFpcnxlbnwwfHwwfHx8MA%3D%3D',
      'Used Wooden Dining Table with 4 Chairs': 'https://media.istockphoto.com/id/181890184/photo/old-chairs-and-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=8hIQdK-0fikqqo2jXy6mtpqQVDNxOpLJipt81L64YWc=',
      'Used Dell Latitude 14\" Laptop (Core i5 / 8GB RAM / 256GB SSD)': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      'Used Samsung Galaxy A32 (128GB - Black)': 'https://images.unsplash.com/photo-1767116188130-6077d5c4e990?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VXNlZCUyMFNhbXN1bmclMjBHYWxheHklMjBBMzIlMjAoMTI4R0IlMjAtJTIwQmxhY2spfGVufDB8fDB8fHww',
      'Used Sony Bravia 40\" LED Smart TV': 'https://plus.unsplash.com/premium_photo-1683121217848-44dde7d393e6?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      'Second-hand Electric Drill (Bosch 650W)': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      'Clean Recycled PET Bottle Bales (50kg)': 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
      'Heavy-Duty Used Plastic Water Barrels (200L - Blue)': 'https://media.istockphoto.com/id/808824306/photo/blue-barrels-storage-drums.jpg?s=612x612&w=0&k=20&c=5JVi-CYiBdDz5fLc75QXIdIj3xqcDOi-XyyIBiv9br8=',
      'Used Industrial Plastic Crates (Pack of 6)': 'https://images.unsplash.com/photo-1588595422102-da26a1cb48c6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8VXNlZCUyMEluZHVzdHJpYWwlMjBQbGFzdGljJTIwQ3JhdGVzJTIwKFBhY2slMjBvZiUyMDYpfGVufDB8fDB8fHww',
      'Scrap Cast Iron Pipes & Structural Angles (Approx. 45kg)': 'https://images.unsplash.com/photo-1763950865631-4ca11bebe017?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fFNjcmFwJTIwQ2FzdCUyMElyb24lMjBQaXBlcyUyMCUyNiUyMFN0cnVjdHVyYWwlMjBBbmdsZXMlMjAoQXBwcm94LiUyMDQ1a2cpfGVufDB8fDB8fHww',
      'Scrap Iron Rebar & Steel Rod Cutoffs (Bundle of 25)': 'https://images.unsplash.com/photo-1763771420746-c75fefab51b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8U2NyYXAlMjBJcm9uJTIwUmViYXIlMjAlMjYlMjBTdGVlbCUyMFJvZCUyMEN1dG9mZnMlMjAoQnVuZGxlJTIwb2YlMjAyNSl8ZW58MHx8MHx8fDA%3D',
      'Scrap Copper Wires (12kg Stripped Bright Copper)': 'https://media.istockphoto.com/id/1835566623/photo/a-bunch-of-old-copper-cables-in-a-plastic-sheath-front-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=IKkR2TYv-Sx9yTY9Nl0yv8dIJz95GfuN517_3NcDgqc=',
      'Used Corrugated Galvanized Iron Sheets (8 Pcs)': 'https://media.istockphoto.com/id/2288771591/photo/roofing-material-for-houses-building-material.jpg?s=612x612&w=0&k=20&c=glEHkYk621Xs-31oKdIURDlQWBvNO5TzUFLwMNBTnJM=',
      'Used 3-Piece Living Room Sofa Set (Grey Fabric)': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      'Used 5-Tier Solid Wood Bookshelf': 'https://images.unsplash.com/photo-1675241816662-faab5f4c3f88?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fFVzZWQlMjA1LVRpZXIlMjBTb2xpZCUyMFdvb2QlMjBCb29rc2hlbGZ8ZW58MHx8MHx8fDA%3D',
      'Used Glass-Top Coffee Table with Steel Legs': 'https://media.istockphoto.com/id/1034892940/photo/modern-glass-table-in-the-loft-interior.webp?a=1&b=1&s=612x612&w=0&k=20&c=S9VhLxdmRxgOoN04RzjwFkgB4-sl8vwAv5CvNWdimO8=',
      // Verified authentic industrial electric induction motor (replacing previous water pipe photo)
      'Used 3-Phase Industrial Electric Motor (5.5kW)': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      'Used HP Pavilion 15\" Laptop (Core i7 / 16GB RAM / 512GB SSD)': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
      'Used Apple iPhone 11 (64GB - White)': 'https://images.unsplash.com/photo-1726574778294-adfb9ee2e5ca?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVzZWQlMjBBcHBsZSUyMGlQaG9uZSUyMDExJTIwKDY0R0IlMjAtJTIwV2hpdGUpfGVufDB8fDB8fHww',
      'Used Samsung 24\" Borderless IPS Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
      'Used Heavy-Duty Plastic Pallets (120x100cm - Stack of 3)': 'https://images.unsplash.com/photo-1734510722516-5a558dc910d2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8VXNlZCUyMEhlYXZ5LUR1dHklMjBQbGFzdGljJTIwUGFsbGV0cyUyMCgxMjB4MTAwY20lMjAtJTIwU3RhY2slMjBvZiUyMDMpfGVufDB8fDB8fHww',
      'Scrap Structural Steel I-Beam Cutoffs (Total ~55kg)': 'https://media.istockphoto.com/id/2240733264/photo/steel-piled-together.webp?a=1&b=1&s=612x612&w=0&k=20&c=bd4EG8mXS43efd3lhXqi7b8fV3IWIR_HbKUSQsgtI9s=',
      'Used Solid Iron Security Window Grilles (Set of 3)': 'https://plus.unsplash.com/premium_photo-1676033369759-7d4b854c0512?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VXNlZCUyMFNvbGlkJTIwSXJvbiUyMFNlY3VyaXR5JTIwV2luZG93JTIwR3JpbGxlc3xlbnwwfHwwfHx8MA%3D%3D',
      'Used 12V 75Ah Heavy Duty Automotive Battery': 'https://images.unsplash.com/photo-1676337167385-fa7a8d1eac07?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVzZWQlMjAxMlYlMjA3NUFoJTIwSGVhdnklMjBEdXR5JTIwQXV0b21vdGl2ZSUyMEJhdHRlcnl8ZW58MHx8MHx8fDA%3D',
      'Used 12V 100Ah Heavy Duty Automotive Battery': 'https://images.unsplash.com/photo-1676337167385-fa7a8d1eac07?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fFVzZWQlMjAxMlYlMjA3NUFoJTIwSGVhdnklMjBEdXR5JTIwQXV0b21vdGl2ZSUyMEJhdHRlcnl8ZW58MHx8MHx8fDA%3D',
      'Used Commercial Microwave Oven (LG 30L Stainless Steel)': 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8VXNlZCUyMENvbW1lcmNpYWwlMjBNaWNyb3dhdmUlMjBPdmVufGVufDB8fDB8fHww',
      'Reclaimed Construction Hardwood Timber Beams & Joists': 'https://media.istockphoto.com/id/2167285206/photo/edged-boards-building-material-the-material-is-made-of-wood.webp?a=1&b=1&s=612x612&w=0&k=20&c=CtC8QZWzjv4oEgBvayYP22bZj_GR5KMVUJ__v5FMkbQ=',
      'Cleaned Demolition Red Clay Bricks (Pack of 150 Pcs)': 'https://images.unsplash.com/photo-1559322575-2f4e66131d55?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Q2xlYW5lZCUyMERlbW9saXRpb24lMjBSZWQlMjBDbGF5JTIwQnJpY2tzJTIwKFBhY2slMjBvZiUyMDE1MCUyMFBjcyl8ZW58MHx8MHx8fDA%3D',
      'Salvaged Heavy Duty Aluminum Window Frames & Profiles': 'https://images.unsplash.com/photo-1719067720887-b55ecfdd21b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDEzfHx8ZW58MHx8fHx8',
      'Heavy Scrap Vehicle Leaf Springs & Axles (Approx 70kg)': 'https://images.unsplash.com/photo-1712045412870-e486f0bf93b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEhlYXZ5JTIwU2NyYXAlMjBWZWhpY2xlJTIwTGVhZiUyMFNwcmluZ3MlMjAlMjYlMjBBeGxlcyUyMChBcHByb3glMjA3MGtnKXxlbnwwfHwwfHx8MA%3D%3D',
      'Used High School Mathematics & Physics Textbooks': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTT5O62YE3VZJLL6IEpEaxm60ajvi-BtKqeDgaeMeyAWQ&s',
      // Standardized and descriptive product titles with verified authentic imagery
      'High-Gloss Ceramic Tea Mug': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      'Tea Mug': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      'Inspirational Scripture Ceramic Coffee Cup': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
      'Bible Verse Coffee Cup': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
      'Everyday Pre-Shrunk Cotton Casual Shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      'Shirt': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      'Premium Apostolic Typography Graphic T-Shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      'T-Shirt': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
      'Weather-Resistant Insulated Winter Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
      'Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80',
      'Eco-Friendly Canvas Scripture Tote Bag': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
      'Bible Verse Tote Bag': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
      'Bible Verse Hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
      'Bible Verse Hoddie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80',
      'Classic Heavyweight Cotton Hoodie': 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80',
      'Hoodie': 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80',
      'Hoddie': 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80',
      'Kalu Ynager Biblical Doctrine Study Books': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      'Biblical Books': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      'Protective Handcrafted Leather Bible Cover Case': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
      'Bible Cover': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&auto=format&fit=crop&q=80',
      'Embroidered Apostolic Monogram Baseball Cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
      'Cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80'
    };

    // 2. Realistic market prices in Ethiopian Birr (ETB) based on Adama market conditions
    const realisticProductPrices = {
      'Used 3-Phase Industrial Electric Motor (5.5kW)': 18500,
      'Used Corrugated Galvanized Iron Sheets (8 Pcs)': 3800,
      'Heavy-Duty Used Plastic Water Barrels (200L - Blue)': 2100,
      'Scrap Copper Wires (12kg Stripped Bright Copper)': 9600,
      'Scrap Iron Rebar & Steel Rod Cutoffs (Bundle of 25)': 3200,
      'Second-hand Electric Drill (Bosch 650W)': 3800,
      'Heavy Duty Metal Filing Cabinet': 8500,
      'Usable Pine Wood Pallets': 400,
      'Everyday Pre-Shrunk Cotton Casual Shirt': 650,
      'Premium Apostolic Typography Graphic T-Shirt': 850,
      'Bible Verse Hoodie': 1850,
      'Weather-Resistant Insulated Winter Jacket': 2600,
      'High-Gloss Ceramic Tea Mug': 300,
      'Inspirational Scripture Ceramic Coffee Cup': 380,
      'Protective Handcrafted Leather Bible Cover Case': 1200,
      'Kalu Ynager Biblical Doctrine Study Books': 450,
      'Eco-Friendly Canvas Scripture Tote Bag': 420,
      'Embroidered Apostolic Monogram Baseball Cap': 500,
      'Classic Heavyweight Cotton Hoodie': 1950,
      // Legacy aliases
      'Shirt': 650,
      'T-Shirt': 850,
      'Jacket': 2600,
      'Tea Mug': 300,
      'Bible Verse Coffee Cup': 380,
      'Bible Cover': 1200,
      'Biblical Books': 450,
      'Bible Verse Tote Bag': 420,
      'Cap': 500,
      'Hoodie': 1950,
      'Hoddie': 1950,
      'Bible Verse Hoddie': 1850
    };

    const refreshedProducts = await Product.find({});
    for (const p of refreshedProducts) {
      let changed = false;
      if (uniqueImagesByProduct[p.name]) {
        p.images = [uniqueImagesByProduct[p.name]];
        changed = true;
      } else if (!p.images || p.images.length === 0 || !p.images[0]) {
        // Fallback to existing image field or default material photo only if completely empty
        p.images = [p.image || 'https://images.unsplash.com/photo-1742203900461-d822f8e7fd30?w=600&auto=format&fit=crop&q=80'];
        changed = true;
      }

      if (realisticProductPrices[p.name] !== undefined && p.price !== realisticProductPrices[p.name]) {
        p.price = realisticProductPrices[p.name];
        changed = true;
      }

      if (changed) {
        await p.save({ validateBeforeSave: false });
      }
    }
    console.log(`✅ Applied verified material imagery and realistic ETB pricing to ${refreshedProducts.length} products in DB.`);
  } catch (err) {
    console.warn('Product image cleanse note:', err.message);
  }
};

const connectDB = async () => {
  const dbUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/managed-marketplace';

  try {
    console.log(`Connecting to primary MongoDB URI: ${dbUri}... 💾`);
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to primary MongoDB server successfully! 🚀');

    // Run auto image sanitation on primary DB
    await cleanseProductImagesInDatabase();

    // Guarantee verified approved materials exist in primary DB
    try {
      await ensureApprovedProductsExist();
    } catch (prodErr) {
      console.warn('Auto-product seed note:', prodErr.message);
    }

    // If primary DB lacks map places or initial data, safely seed
    try {
      const MapPlace = require('../models/MapPlace');
      const count = await MapPlace.countDocuments();
      if (count < 8) {
        console.log('🌱 Primary database has fewer than 8 map places. Running safe idempotent places seed...');
        const seedDemoPlaces = require('../jobs/seedPlaces');
        await seedDemoPlaces();
      }
    } catch (seedErr) {
      console.warn('Auto-seed check note:', seedErr.message);
    }
  } catch (error) {
    console.warn('⚠️ Primary MongoDB connection failed. Reason:', error.message);
    console.log('🔄 Fallback: Initializing development-only in-memory MongoDB database... 🔌');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();

      console.log(`Memory MongoDB Server started at: ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log('Connected to in-memory MongoDB server successfully! 🚀');

      // Programmatically seed data
      console.log('🌱 Programmatically seeding mock database with demo accounts & materials...');
      await seedData(true);
      await cleanseProductImagesInDatabase();
      console.log('🎉 Seeding completed in memory database! System is ready to test.');
    } catch (memError) {
      console.error('💥 Failed to start in-memory MongoDB server:', memError);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
