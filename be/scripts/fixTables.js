const mongoose = require('mongoose');
const Table = require('../models/Table');
const connectDB = require('../config/database');

const fixTables = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Find and delete Table 21
    const table21 = await Table.findOne({ tableNumber: '21', floor: 2 });
    if (table21) {
      await Table.findByIdAndDelete(table21._id);
      console.log('✅ Deleted Table 21');
    } else {
      console.log('⚠️  Table 21 not found');
    }

    // Find and delete TA 6 (try different formats)
    let ta6 = await Table.findOne({ tableNumber: 'TA 6', type: 'takeaway' });
    if (!ta6) {
      ta6 = await Table.findOne({ tableNumber: '6', type: 'takeaway' });
    }
    if (ta6) {
      await Table.findByIdAndDelete(ta6._id);
      console.log('✅ Deleted TA 6');
    } else {
      console.log('⚠️  TA 6 not found');
    }

    // Create Table 21 again
    const newTable21 = new Table({
      tableNumber: '21',
      floor: 2,
      type: 'table',
      status: 'available',
      currentOrderId: null
    });
    await newTable21.save();
    console.log('✅ Created Table 21 with status: available');

    // Create TA 6 again (check existing format first)
    const existingTA = await Table.findOne({ type: 'takeaway' });
    const ta6Format = existingTA ? existingTA.tableNumber.includes('TA ') ? 'TA 6' : '6' : 'TA 6';
    
    const newTA6 = new Table({
      tableNumber: ta6Format,
      floor: null,
      type: 'takeaway',
      status: 'available',
      currentOrderId: null
    });
    await newTA6.save();
    console.log(`✅ Created TA 6 (${ta6Format}) with status: available`);

    console.log('\n✨ Fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing tables:', error);
    process.exit(1);
  }
};

fixTables();

