const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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

const User = require('../models/User');
const Category = require('../models/Category');
const MaterialType = require('../models/MaterialType');
const Product = require('../models/Product');

/**
 * Idempotent seeder that guarantees approved materials exist in the catalog.
 * Runs safely in production, staging, and development.
 */
async function ensureApprovedProductsExist() {
  try {
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

    // 2. Apply realistic ETB market prices
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
    };

    for (const [prodName, realPrice] of Object.entries(realisticProductPrices)) {
      await Product.updateMany({ name: prodName, price: { $ne: realPrice } }, { $set: { price: realPrice } });
    }

    // If we already have 5 or more approved products, check and return
    const approvedCount = await Product.countDocuments({ approvalStatus: 'APPROVED' });
    if (approvedCount >= 5) {
      return { success: true, count: approvedCount, seeded: false };
    }

    console.log(`[seedProducts] Approved products count is low (${approvedCount}). Checking existing products...`);

    // 2. If products exist in DB with non-approved status, approve them
    const totalExisting = await Product.countDocuments({});
    if (totalExisting > 0) {
      const updateResult = await Product.updateMany(
        { approvalStatus: { $ne: 'APPROVED' } },
        { $set: { approvalStatus: 'APPROVED' } }
      );
      console.log(`[seedProducts] Updated ${updateResult.modifiedCount} existing products to APPROVED.`);

      const newApprovedCount = await Product.countDocuments({ approvalStatus: 'APPROVED' });
      if (newApprovedCount >= 5) {
        return { success: true, count: newApprovedCount, seeded: false };
      }
    }

    console.log('[seedProducts] Seeding verified materials catalog for Adama City...');

    // 3. Ensure Categories exist
    const defaultCategories = [
      { name: 'Furniture', slug: 'furniture', description: 'Desks, chairs, tables, and cabinets made of wood, metal, or plastic' },
      { name: 'Used Construction Materials', slug: 'used-construction-materials', description: 'Timber, corrugated iron, bricks, stone, and demolition scrap' },
      { name: 'Industrial Scrap & Heavy Materials', slug: 'industrial-scrap-heavy-materials', description: 'Heavy structural beams, motors, pumps, and metal cutoffs' },
      { name: 'Electronics & Appliances', slug: 'electronics-appliances', description: 'Refurbished laptops, monitors, smartphones, and wiring' },
      { name: 'Household Items', slug: 'household-items', description: 'Plastic drums, containers, storage crates, and utensils' },
      { name: 'Clothing & Fashion', slug: 'clothing-fashion', description: 'Usable textiles, cotton bales, and fabric remnants' },
      { name: 'Books & Education', slug: 'books-education', description: 'Used textbooks, reference guides, and paper bales' },
      { name: 'Tools & Equipment', slug: 'tools-equipment', description: 'Power drills, welding gear, and mechanical shop tools' },
      { name: 'Baby & Kids', slug: 'baby-kids', description: 'Toys, cribs, clothing for children' },
      { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Bicycles, weights, outdoor usable gear' },
      { name: 'Other', slug: 'other', description: 'Miscellaneous usable scrap materials' },
    ];

    const categoryDocs = {};
    for (const cat of defaultCategories) {
      let doc = await Category.findOne({ $or: [{ slug: cat.slug }, { name: cat.name }] });
      if (!doc) {
        doc = await Category.create(cat);
      }
      categoryDocs[cat.slug] = doc;
    }

    // 4. Ensure Material Types exist
    const defaultMaterials = [
      { name: 'Wood', slug: 'wood', description: 'Pallets, logs, lumber, broken furniture parts' },
      { name: 'Metal', slug: 'metal', description: 'Scrap iron, steel bars, copper wire, aluminum' },
      { name: 'Plastic', slug: 'plastic', description: 'PET bottles, containers, structural plastic' },
      { name: 'Electronic', slug: 'electronic', description: 'Circuits, components, scrap appliances' },
      { name: 'Glass', slug: 'glass', description: 'Bottles, jars, glass sheet remnants' },
      { name: 'Fabric', slug: 'fabric', description: 'Textiles, canvas, cotton scrap' },
      { name: 'Leather', slug: 'leather', description: 'Belts, bags, shoes, remnants' },
      { name: 'Paper', slug: 'paper', description: 'Cardboard, books, newspaper bales' },
      { name: 'Mixed Material', slug: 'mixed-material', description: 'Items with multiple combined materials' },
    ];

    const materialDocs = {};
    for (const mat of defaultMaterials) {
      let doc = await MaterialType.findOne({ $or: [{ slug: mat.slug }, { name: mat.name }] });
      if (!doc) {
        doc = await MaterialType.create(mat);
      }
      materialDocs[mat.slug] = doc;
    }

    // 5. Ensure a verified Seller exists in Adama
    let demoSeller = await User.findOne({ role: 'SELLER', 'sellerProfile.approvalStatus': 'APPROVED' });
    if (!demoSeller) {
      demoSeller = await User.findOne({ email: 'seller1@marketplace.com' });
      if (!demoSeller) {
        demoSeller = await User.create({
          name: 'Abebe Kebede',
          username: 'abebe_materials',
          email: 'seller1@marketplace.com',
          password: 'sellerpass123',
          role: 'SELLER',
          roles: ['SELLER'],
          isActive: true,
          isSellerApproved: true,
          sellerProfile: {
            shopName: 'Abebe Salvage & Materials Depot [Demo]',
            shopDescription: 'Reclaimed timber, steel, and electrical equipment in Adama.',
            shopAddress: 'Kebele 01, Bole Subcity, Adama',
            shopLocation: {
              type: 'Point',
              coordinates: [39.2580, 8.5440],
              address: 'Kebele 01, Bole Subcity, Adama',
            },
            approvalStatus: 'APPROVED',
          },
        });
      } else {
        demoSeller.role = 'SELLER';
        demoSeller.isSellerApproved = true;
        if (!demoSeller.sellerProfile) demoSeller.sellerProfile = {};
        demoSeller.sellerProfile.approvalStatus = 'APPROVED';
        await demoSeller.save({ validateBeforeSave: false });
      }
    }

    const furnitureCat = categoryDocs['furniture'] || Object.values(categoryDocs)[0];
    const constCat = categoryDocs['used-construction-materials'] || furnitureCat;
    const heavyCat = categoryDocs['industrial-scrap-heavy-materials'] || constCat;
    const elecCat = categoryDocs['electronics-appliances'] || furnitureCat;
    const houseCat = categoryDocs['household-items'] || furnitureCat;
    const toolsCat = categoryDocs['tools-equipment'] || constCat;

    const woodMat = materialDocs['wood'] || Object.values(materialDocs)[0];
    const metalMat = materialDocs['metal'] || woodMat;
    const plasticMat = materialDocs['plastic'] || woodMat;
    const elecMat = materialDocs['electronic'] || metalMat;

    // 6. Curated approved materials
    const materialsCatalog = [
      {
        name: 'Usable Pine Wood Pallets',
        description: 'Batch of 10 clean pine wood pallets. Great for building scrap wood furniture or storage shelving.',
        price: 400,
        quantity: 8,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1742203900461-d822f8e7fd30?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fFVzYWJsZSUyMFBpbmUlMjBXb29kJTIwUGFsbGV0c3xlbnwwfHwwfHx8MA%3D%3D'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Bole', city: 'Adama' },
      },
      {
        name: 'Heavy Duty Metal Filing Cabinet',
        description: 'Solid steel 4-drawer filing cabinet in Excellent condition. Keys are included.',
        price: 8500,
        quantity: 2,
        category: furnitureCat._id,
        materialType: metalMat._id,
        condition: 'Like New',
        images: ['https://images.unsplash.com/photo-1613043547213-cf19e438093c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fEhlYXZ5JTIwRHV0eSUyME1ldGFsJTIwRmlsaW5nJTIwQ2FiaW5ldHxlbnwwfHwwfHx8MA%3D%3D'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 04', city: 'Adama' },
      },
      {
        name: 'Used Solid Wood Office Desk',
        description: 'Sturdy hardwood office desk with 3 lockable side drawers. Minor surface scratches but structurally very solid.',
        price: 4200,
        quantity: 1,
        category: furnitureCat._id,
        materialType: woodMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1646705193406-8083b661ee9d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fFVzZWQlMjBTb2xpZCUyMFdvb2QlMjBPZmZpY2UlMjBEZXNrfGVufDB8fDB8fHww'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 02', city: 'Adama' },
      },
      {
        name: 'Used Ergonomic Mesh Swivel Chair',
        description: 'Adjustable height office chair with breathable mesh back and lumbar support. All hydraulics functioning well.',
        price: 2400,
        quantity: 3,
        category: furnitureCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: ['https://plus.unsplash.com/premium_photo-1734029815108-169d085ca9aa?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8VXNlZCUyMEVyZ29ub21pYyUyME1lc2glMjBTd2l2ZWwlMjBDaGFpcnxlbnwwfHwwfHx8MA%3D%3D'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Bole', city: 'Adama' },
      },
      {
        name: 'Second-hand Electric Drill (Bosch 650W)',
        description: 'Tested and working Bosch impact drill with chuck key. Ideal for woodworking and home maintenance.',
        price: 3800,
        quantity: 2,
        category: toolsCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 01', city: 'Adama' },
      },
      {
        name: 'Scrap Iron Rebar & Steel Rod Cutoffs (Bundle of 25)',
        description: 'Assorted steel rebar offcuts from 10mm to 16mm diameter. Lengths range from 1m to 2.5m.',
        price: 3200,
        quantity: 4,
        category: constCat._id,
        materialType: metalMat._id,
        condition: 'Salvaged',
        images: ['https://images.unsplash.com/photo-1763771420746-c75fefab51b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8U2NyYXAlMjBJcm9uJTIwUmViYXIlMjAlMjYlMjBTdGVlbCUyMFJvZCUyMEN1dG9mZnMlMjAoQnVuZGxlJTIwb2YlMjAyNSl8ZW58MHx8MHx8fDA%3D'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 01', city: 'Adama' },
      },
      {
        name: 'Scrap Copper Wires (12kg Stripped Bright Copper)',
        description: 'Clean stripped scrap copper electrical wire suitable for recycling or custom wiring work.',
        price: 9600,
        quantity: 1,
        category: heavyCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: ['https://media.istockphoto.com/id/1835566623/photo/a-bunch-of-old-copper-cables-in-a-plastic-sheath-front-view.webp?a=1&b=1&s=612x612&w=0&k=20&c=IKkR2TYv-Sx9yTY9Nl0yv8dIJz95GfuN517_3NcDgqc='],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Boku', city: 'Adama' },
      },
      {
        name: 'Heavy-Duty Used Plastic Water Barrels (200L - Blue)',
        description: 'Food-grade HDPE blue barrels with clamp lids. Cleaned and rinsed, ready for water or liquid storage.',
        price: 2100,
        quantity: 6,
        category: houseCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: ['https://media.istockphoto.com/id/808824306/photo/blue-barrels-storage-drums.jpg?s=612x612&w=0&k=20&c=5JVi-CYiBdDz5fLc75QXIdIj3xqcDOi-XyyIBiv9br8='],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 06', city: 'Adama' },
      },
      {
        name: 'Used Corrugated Galvanized Iron Sheets (8 Pcs)',
        description: 'Reclaimed G-32 roofing zinc sheets with minimal nail holes. Length: 2.5m each.',
        price: 3800,
        quantity: 2,
        category: constCat._id,
        materialType: metalMat._id,
        condition: 'Fair',
        images: ['https://media.istockphoto.com/id/2288771591/photo/roofing-material-for-houses-building-material.jpg?s=612x612&w=0&k=20&c=glEHkYk621Xs-31oKdIURDlQWBvNO5TzUFLwMNBTnJM='],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 03', city: 'Adama' },
      },
      {
        name: 'Used Dell Latitude 14" Laptop (Core i5 / 8GB RAM / 256GB SSD)',
        description: 'Tested and cleaned office laptop. Battery holds 3+ hours charge, includes original charger.',
        price: 16500,
        quantity: 2,
        category: elecCat._id,
        materialType: elecMat._id,
        condition: 'Like New',
        images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Kebele 04', city: 'Adama' },
      },
      {
        name: 'Clean Recycled PET Bottle Bales (50kg)',
        description: 'Sorted, crushed and baled clear PET beverage bottles. Dry and uncontaminated.',
        price: 1500,
        quantity: 5,
        category: houseCat._id,
        materialType: plasticMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Aba Geda', city: 'Adama' },
      },
      {
        name: 'Used 3-Phase Industrial Electric Motor (5.5kW)',
        description: 'Reliable Siemens industrial induction motor. Tested coils and bearings, ready for pump or milling use.',
        price: 18500,
        quantity: 1,
        category: heavyCat._id,
        materialType: metalMat._id,
        condition: 'Good',
        images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'],
        seller: demoSeller._id,
        approvalStatus: 'APPROVED',
        location: { subCity: 'Boku', city: 'Adama' },
      },
    ];

    for (const p of materialsCatalog) {
      const existing = await Product.findOne({ name: p.name });
      if (!existing) {
        await Product.create(p);
      } else if (existing.approvalStatus !== 'APPROVED') {
        existing.approvalStatus = 'APPROVED';
        await existing.save();
      }
    }

    const finalApproved = await Product.countDocuments({ approvalStatus: 'APPROVED' });
    console.log(`[seedProducts] Successfully guaranteed ${finalApproved} approved materials in Adama catalog! 🎉`);
    return { success: true, count: finalApproved, seeded: true };
  } catch (err) {
    console.error('[seedProducts] Error ensuring approved products:', err);
    return { success: false, error: err.message };
  }
}

module.exports = ensureApprovedProductsExist;
