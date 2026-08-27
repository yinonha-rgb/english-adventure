# הגדרת Google AI בצורה בטוחה

האפליקציה מוכנה להשתמש ב‑Gemini דרך **Firebase AI Logic**. אין להכניס מפתח Google AI Studio או סוד אחר לקוד של GitHub Pages. ההגנה מבוססת על Firebase App Check ועל הגבלת הדומיין.

## המצב הנוכחי

- Firebase AI Logic מופעל בפרויקט `english-adventure-e4632`.
- האפליקציה מוגנת באמצעות reCAPTCHA Enterprise עבור `yinonha-rgb.github.io`.
- האכיפה עבור Firebase AI Logic מוגדרת כ־`Basic – Enforced`.
- Gemini משמש רק ליצירת תשובות טקסט מותאמות. הדיבור וההנפשה ממשיכים לפעול בדפדפן.
- Gemini Live Audio כבוי מפני שהוא עדיין יכול להשתנות ואינו נדרש למורה החינמית.
- שם הילד ונתוני הפרופיל אינם נשלחים למודל.

## בדיקה ב‑Firebase

1. פתחו את Firebase Console ובחרו בפרויקט `english-adventure-e4632`.
2. עברו אל **App Check → Apps** וודאו שהיישום `English Adventure` מסומן `Registered`.
3. עברו אל **App Check → APIs** וודאו שליד Firebase AI Logic מופיע `Basic – Enforced`.
4. עברו אל Google Cloud reCAPTCHA ובדקו שהמפתח `english-adventure-github-pages` מוגבל לדומיין `yinonha-rgb.github.io`.
5. אין להפעיל חיוב, להוסיף service account או לשמור מפתח API פרטי במאגר.

## פרטיות ועלויות

המפתח הנמצא ב־`firebase-config.js` הוא מפתח אתר ציבורי של reCAPTCHA Enterprise ואינו סוד. ההגנה מגיעה מאימות הדומיין ומאכיפת App Check. המורה החינמית ממשיכה לעבוד גם ללא Gemini, וכל תקלה בענן חייבת לחזור אליה אוטומטית.

יש לבדוק מעת לעת את מכסות Firebase ו‑Gemini. אין לאפשר מעבר לשירות בתשלום ללא אישור מפורש של בעל הפרויקט.
