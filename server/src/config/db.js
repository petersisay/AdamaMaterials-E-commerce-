const mongoose = require('mongoose');
const seedData = require('../jobs/seed');

const cleanseProductImagesInDatabase = async () => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({});
    if (!products || products.length === 0) return;

    const uniqueImagesByProduct = {
      'Usable Pine Wood Pallets': 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop&q=80',
      'Heavy Duty Metal Filing Cabinet': 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&auto=format&fit=crop&q=80',
      'Used Solid Wood Office Desk': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
      'Used Ergonomic Mesh Swivel Chair': 'https://images.unsplash.com/photo-1580481077197-0245e998e3b1?w=600&auto=format&fit=crop&q=80',
      'Used Wooden Dining Table with 4 Chairs': 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=600&auto=format&fit=crop&q=80',
      'Used Dell Latitude 14" Laptop (Core i5 / 8GB RAM / 256GB SSD)': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      'Used Samsung Galaxy A32 (128GB - Black)': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      'Used Sony Bravia 40" LED Smart TV': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
      'Second-hand Electric Drill (Bosch 650W)': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      'Clean Recycled PET Bottle Bales (50kg)': 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
      'Heavy-Duty Used Plastic Water Barrels (200L - Blue)': 'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600&auto=format&fit=crop&q=80',
      'Used Industrial Plastic Crates (Pack of 6)': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      'Scrap Cast Iron Pipes & Structural Angles (Approx. 45kg)': 'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600&auto=format&fit=crop&q=80',
      'Scrap Iron Rebar & Steel Rod Cutoffs (Bundle of 25)': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'Scrap Copper Wires (12kg Stripped Bright Copper)': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      'Used Corrugated Galvanized Iron Sheets (8 Pcs)': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      'Used 3-Piece Living Room Sofa Set (Grey Fabric)': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
      'Used 5-Tier Solid Wood Bookshelf': 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80',
      'Used Glass-Top Coffee Table with Steel Legs': 'https://images.unsplash.com/photo-1533779283484-84e1d70a1a5b?w=600&auto=format&fit=crop&q=80',
      'Used 3-Phase Industrial Electric Motor (5.5kW)': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      'Used HP Pavilion 15" Laptop (Core i7 / 16GB RAM / 512GB SSD)': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80',
      'Used Apple iPhone 11 (64GB - White)': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&auto=format&fit=crop&q=80',
      'Used Samsung 24" Borderless IPS Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80',
      'Used Heavy-Duty Plastic Pallets (120x100cm - Stack of 3)': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80',
      'Scrap Structural Steel I-Beam Cutoffs (Total ~55kg)': 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
      'Used Solid Iron Security Window Grilles (Set of 3)': 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=600&auto=format&fit=crop&q=80',
      'Used 12V 75Ah Heavy Duty Automotive Battery': 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80',
      'Used Commercial Microwave Oven (LG 30L Stainless Steel)': 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
      'Reclaimed Construction Hardwood Timber Beams & Joists': 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=600&auto=format&fit=crop&q=80',
      'Cleaned Demolition Red Clay Bricks (Pack of 150 Pcs)': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
      'Salvaged Heavy Duty Aluminum Window Frames & Profiles': 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&auto=format&fit=crop&q=80',
      'Heavy Scrap Vehicle Leaf Springs & Axles (Approx 70kg)': 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
      'Used High School Mathematics & Physics Textbooks': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    };

    const materialFallbackPool = [
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584473457406-6240486418e9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
    ];

    const seenImages = new Set();
    let poolIndex = 0;

    for (const p of products) {
      let targetImg = uniqueImagesByProduct[p.name];
      const currentFirstImg = p.images && p.images[0] ? p.images[0] : '';
      const hasFoodImage = currentFirstImg.includes('1574944985070');
      const isRepeatedPhone = currentFirstImg.includes('1511707171634') && !p.name.toLowerCase().includes('samsung');
      const isRepeatedCrate = currentFirstImg.includes('1586528116311') && !p.name.toLowerCase().includes('crate');

      if (!targetImg || hasFoodImage || isRepeatedPhone || isRepeatedCrate || seenImages.has(currentFirstImg)) {
        if (targetImg && !seenImages.has(targetImg)) {
          p.images = [targetImg];
          seenImages.add(targetImg);
        } else {
          let chosen = materialFallbackPool[poolIndex % materialFallbackPool.length];
          poolIndex++;
          p.images = [chosen];
          seenImages.add(chosen);
        }
        await p.save();
      } else {
        seenImages.add(currentFirstImg);
      }
    }
    console.log(`✅ Cleaned and verified unique material imagery for ${products.length} products in DB.`);
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
