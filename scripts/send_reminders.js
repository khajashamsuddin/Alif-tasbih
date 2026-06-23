/**
 * Alif Tasbih — Background Reminder Delivery Script
 * Run via GitHub Actions every minute.
 * Finds due reminders in Firestore and sends FCM push notifications.
 */

const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db        = admin.firestore();
const messaging = admin.messaging();

async function run() {
  console.log('--- Alif Tasbih: Reminder Delivery ---');

  const now = new Date();
  console.log(`Current Time (UTC): ${now.toISOString()}`);

  // ─── KEY FIX: 5 minute window ────────────────────────────────────
  // Pehle sirf exact time match hota tha, agar GitHub Actions 2 min
  // late chali toh notification miss ho jaata tha.
  // Ab 0 se 5 minute ke andar jo bhi due hai sab bhej do.
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  // ─────────────────────────────────────────────────────────────────

  try {
    const snapshot = await db.collection('reminders').get();

    if (snapshot.empty) {
      console.log('No registered users found.');
      return;
    }

    let pushesToSend  = [];
    let docsToUpdate  = new Map();

    snapshot.forEach(docSnap => {
      const token     = docSnap.id;
      const data      = docSnap.data();
      const scheduled = data.scheduled || [];

      // Find reminders that are due (within the 5-min window)
      const duePushes = scheduled.filter(push => {
        const triggerTime = new Date(push.triggerTimeUTC);
        const diff        = now - triggerTime; // milliseconds past trigger
        return diff >= 0 && diff <= WINDOW_MS; // due lekin 5 min se zyada purana nahi
      });

      // Keep the rest for future delivery
      const remainingPushes = scheduled.filter(push => {
        const triggerTime = new Date(push.triggerTimeUTC);
        const diff        = now - triggerTime;
        return !(diff >= 0 && diff <= WINDOW_MS);
      });

      if (duePushes.length > 0) {
        duePushes.forEach(push => {
          pushesToSend.push({
            token,
            notification: {
              title: push.title,
              body:  push.body
            },
            data: {
              click_action: '/Alif-tasbih/',
              tag:          push.id,
              targetId:     push.targetId || ''
            }
          });
        });

        docsToUpdate.set(token, remainingPushes);
      }
    });

    console.log(`Sending ${pushesToSend.length} notifications...`);

    if (pushesToSend.length > 0) {
      const sendPromises = pushesToSend.map(pushPayload =>
        messaging.send(pushPayload)
          .then(res  => console.log(`✅ Sent to ...${pushPayload.token.slice(-8)}: ${res}`))
          .catch(err => {
            console.error(`❌ Failed for ...${pushPayload.token.slice(-8)}: ${err.message}`);
            // Invalid/unregistered token → delete from Firestore
            if (err.code === 'messaging/registration-token-not-registered') {
              docsToUpdate.set(pushPayload.token, 'DELETE');
            }
          })
      );

      await Promise.all(sendPromises);

      // Update Firestore — remove sent pushes
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
      console.log('Done ✓');
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();