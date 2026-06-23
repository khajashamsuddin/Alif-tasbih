/**
 * Alif Tasbih — Background Reminder Delivery Script
 * 
 * This script is designed to run periodically (e.g. via GitHub Actions).
 * It connects to Firestore, finds scheduled pushes where the trigger time
 * is in the past, sends them via Firebase Admin SDK, and removes them.
 */

const admin = require('firebase-admin');

// Authenticate using the Service Account injected by GitHub Actions
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function run() {
  console.log('--- Starting Alif Tasbih Reminder Delivery ---');
  const now = new Date();
  console.log(`Current Time (UTC): ${now.toISOString()}`);

  try {
    const snapshot = await db.collection('reminders').get();
    
    if (snapshot.empty) {
      console.log('No registered users found.');
      return;
    }

    let pushesToSend = [];
    let docsToUpdate = new Map();

    snapshot.forEach(doc => {
      const token = doc.id;
      const data = doc.data();
      const scheduled = data.scheduled || [];
      
      const duePushes = scheduled.filter(push => {
        return new Date(push.triggerTimeUTC) <= now;
      });

      const remainingPushes = scheduled.filter(push => {
        return new Date(push.triggerTimeUTC) > now;
      });

      if (duePushes.length > 0) {
        duePushes.forEach(push => {
          pushesToSend.push({
            token: token,
            notification: {
              title: push.title,
              body: push.body
            },
            data: {
              click_action: '/Alif-tasbih/', // Adapt if deep linking needed
              tag: push.id,
              targetId: push.targetId || ''
            }
          });
        });
        
        // Stage the document for update (to remove sent pushes)
        docsToUpdate.set(token, remainingPushes);
      }
    });

    console.log(`Found ${pushesToSend.length} pushes due right now.`);

    if (pushesToSend.length > 0) {
      // Send all pushes concurrently using Promise.all
      // Note: for >500 messages, use messaging.sendEachForMulticast chunking.
      const sendPromises = pushesToSend.map(pushPayload => 
        messaging.send(pushPayload)
          .then(res => console.log(`✅ Sent push to token ...${pushPayload.token.slice(-10)}: ${res}`))
          .catch(err => {
            console.error(`❌ Failed to send to token ...${pushPayload.token.slice(-10)}`);
            console.error(err);
            // If the token is invalid/unregistered, we should ideally remove it from Firestore entirely.
            if (err.code === 'messaging/registration-token-not-registered') {
              console.log(`Token is unregistered, will delete document.`);
              docsToUpdate.set(pushPayload.token, 'DELETE');
            }
          })
      );

      await Promise.all(sendPromises);

      // Clean up Firestore
      console.log('Updating Firestore...');
      const batch = db.batch();
      docsToUpdate.forEach((remaining, token) => {
        const docRef = db.collection('reminders').doc(token);
        if (remaining === 'DELETE') {
          batch.delete(docRef);
        } else {
          batch.update(docRef, { scheduled: remaining });
        }
      });
      
      await batch.commit();
      console.log('Firestore updated successfully.');
    }

  } catch (error) {
    console.error("Error executing reminder script:", error);
    process.exit(1);
  }
}

run();
