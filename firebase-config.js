// Firebase web configuration is public by design. Security comes from Google
// Authentication and firestore.rules — never add service-account credentials here.
export const firebaseConfig = {
  enabled: true,
  apiKey: "AIzaSyC5XGriCLaBtbv8zlPT8i8fxrvk4Z7geGI",
  authDomain: "english-adventure-e4632.firebaseapp.com",
  projectId: "english-adventure-e4632",
  storageBucket: "english-adventure-e4632.firebasestorage.app",
  messagingSenderId: "664015801855",
  appId: "1:664015801855:web:c79489840897d556e92bca",
  measurementId: "G-J3G4H1BVEZ"
};

// Leave endpoint empty until the authenticated Cloud Function is deployed.
// Demo mode remains available without an OpenAI request or paid usage.
export const teacherAIConfig = {
  endpoint: "",
  demoMode: true,
  // Public reCAPTCHA Enterprise site key. It is safe to publish; App Check
  // enforcement and the allowed-domain restriction provide the protection.
  appCheckSiteKey: "6LeNjJstAAAAALiBigy8NA6bwYG6OkTNJCqK5VXw"
};
