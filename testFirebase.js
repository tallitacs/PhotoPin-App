// backend/src/testFirebase.js
const { testConnection, db, auth, bucket } = require('./services/firebaseAdmin');

async function runComprehensiveTest() {
  console.log('🧪 Starting Comprehensive Firebase Admin Test...\n');
  
  try {
    // Test 1: Basic Connection
    console.log('1. Testing basic Firebase connection...');
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      console.log('❌ Basic connection test failed');
      return;
    }
    console.log('✅ Basic connection test passed');

    // Test 2: Firestore Operations
    console.log('2. Testing Firestore read/write operations...');
    const testCollection = db.collection('_admin_tests');
    const testDocRef = testCollection.doc('firestore_test');
    
    // Write test
    await testDocRef.set({
      message: 'Firestore is working!',
      timestamp: new Date(),
      testId: Math.random().toString(36).substring(7)
    });
    console.log('✅ Firestore write operation successful');

    // Read test
    const docSnapshot = await testDocRef.get();
    if (docSnapshot.exists) {
      console.log('✅ Firestore read operation successful');
      console.log('   Document data:', docSnapshot.data());
    } else {
      throw new Error('Document not found after write');
    }

    // Cleanup
    await testDocRef.delete();
    console.log('✅ Firestore cleanup successful');

    // Test 3: Auth Service
    console.log('3. Testing Authentication service...');
    const testUsers = await auth.listUsers(1);
    console.log('✅ Auth service is accessible');
    console.log('   Can list users:', testUsers.users.length >= 0);

    // Test 4: Storage Service
    console.log('4. Testing Storage service...');
    const storageFiles = await bucket.getFiles({ maxResults: 1 });
    console.log('✅ Storage service is accessible');
    console.log('   Bucket name:', bucket.name);

    console.log('\n🎉 ALL FIREBASE TESTS PASSED! 🎉');
    console.log('===================================');
    console.log('✅ Firebase Admin SDK is working correctly');
    console.log('✅ Firestore database is accessible');
    console.log('✅ Authentication service is working');
    console.log('✅ Cloud Storage is accessible');
    console.log('✅ Your .env configuration is correct');
    console.log('\n🚀 You can now proceed with building PhotoPin!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check your .env file values');
    console.log('   2. Verify service account has proper permissions');
    console.log('   3. Ensure Firebase project is properly set up');
    console.log('   4. Check internet connection');
    
    if (error.message.includes('private key')) {
      console.log('\n💡 Private Key Tip:');
      console.log('   Make sure FIREBASE_PRIVATE_KEY in .env has \\n instead of actual newlines');
    }
    
    if (error.message.includes('permission')) {
      console.log('\n💡 Permission Tip:');
      console.log('   Check if service account has proper Firestore/Storage permissions');
    }
  }
}

// Run the test
runComprehensiveTest();