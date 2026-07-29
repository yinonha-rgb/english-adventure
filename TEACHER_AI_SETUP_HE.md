# הגדרת מורה AI קולי — מדריך מלא

הממשק כולל מצב הדגמה מקומי שאינו שולח קול ל-OpenAI ואינו יוצר חיוב. שיחה אמיתית מחייבת Cloud Functions, תוכנית Blaze ומפתח OpenAI. לעולם אין להכניס את המפתח לקובץ JavaScript, ל-Firebase config, ל-Firestore או ל-GitHub.

## 1. יצירת מפתח OpenAI

1. היכנסו לחשבון OpenAI Platform של ההורה או הארגון.
2. פתחו API keys וצרו מפתח חדש עבור `English Adventure teacher`.
3. העתיקו אותו פעם אחת ושמרו במנהל סיסמאות. אל תדביקו אותו בקוד.
4. הגדירו בתקציב OpenAI מגבלת הוצאה חודשית והתראות. שימוש ב-Realtime API כרוך בחיוב חיצוני ואינו חלק מתוכנית Firebase.

## 2. הפעלת חיוב Firebase

Cloud Functions דורש בדרך כלל תוכנית Blaze, גם אם השימוש נשאר בתוך מכסות ללא עלות. ב-Firebase Console פתחו **Usage and billing → Modify plan**, בחרו Blaze וקשרו חשבון חיוב. הפעולה עשויה ליצור חיובים — בדקו תקציבים והתראות ב-Google Cloud Billing.

## 3. התקנת הכלים

נדרשים Node.js 20 ו-Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use english-adventure-e4632
cd functions
npm install
npm test
cd ..
```

## 4. שמירת הסוד

מהשורש הפעילו:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

הדביקו את המפתח רק בבקשת הקלט של Firebase CLI. הסוד נשמר ב-Google Secret Manager ואינו חוזר לדפדפן. הפונקציה מחזירה ללקוח רק credential קצר-חיים של Realtime.

## 5. פריסה

```bash
firebase deploy --only functions,firestore:rules
```

בסיום יוצג URL של `teacherApi` באזור `me-west1`. העתיקו אותו אל `teacherAIConfig.endpoint` בקובץ `firebase-config.js`, ושנו `demoMode` ל-`false`. פרסמו את קבצי ה-Frontend מחדש ל-GitHub Pages.

## 6. דומיינים והרשאות

- ודאו שב-Firebase Authentication הדומיין `yinonha-rgb.github.io` נמצא ב-Authorized domains.
- הפונקציה מאשרת רק את GitHub Pages ואת `localhost:8000`/`127.0.0.1:8000` לפיתוח.
- כל בקשה חייבת Firebase ID token תקף. האימות בשרת כולל בדיקת ביטול token.
- ההסכמה נשמרת תחת `payload.settings.teacherAI`; הפונקציה בודקת אותה מחדש לפני כל מפגש.

## 7. App Check (מומלץ)

1. ב-Firebase Console פתחו **App Check** ורשמו את אפליקציית ה-Web עם reCAPTCHA Enterprise.
2. הוסיפו את site key הציבורי אל `teacherAIConfig.appCheckSiteKey`.
3. לאחר שילוב ושליחת `X-Firebase-AppCheck`, הגדירו בסביבת הפונקציה `REQUIRE_APP_CHECK=true` ופרסו מחדש.
4. הפעילו Enforcement רק לאחר שבדיקות ייצור מצליחות. App Check הוא שכבה נוספת ואינו מחליף Authentication או כללי Firestore.

## 8. מגבלות ועלויות

באזור ההורים הגדירו:

- דקות מרביות ביום;
- מספר מפגשים ביום;
- מכסת דקות בחודש;
- עזרה בעברית ושמירת תמליל.

השרת אוכף את המגבלות בעסקאות Firestore. בנוסף הגדירו Budget Alerts ב-Google Cloud וב-OpenAI. המדידה היא משך מפגש מקורב לצורכי הגבלה, ולא חשבונית רשמית.

## 9. בדיקת מיקרופון ושיחה

1. התחילו במצב הדגמה וודאו שכל תשעת שלבי השיעור מופיעים.
2. התחברו כחשבון הורה, פתחו **מורה AI**, הפעילו את השירות ואשרו עיבוד קולי.
3. פתחו שיעור ולחצו **התחלת שיעור עם המורה**.
4. אשרו מיקרופון רק עבור `yinonha-rgb.github.io`.
5. ודאו שהמחוונים עוברים בין מדבר, מקשיב וחושב; בדקו השתקה, חזרה, דיבור איטי, עזרה בעברית, השהיה וסיום.
6. נתקו רשת בזמן מפגש ובדקו הודעת התחברות מחדש והתאוששות מכובדת.
7. שללו הרשאת מיקרופון ובדקו הסבר ברור ללא אובדן ההתקדמות המקומית.
8. בדקו שהסיכום מופיע באזור ההורה, ושאין קובץ אודיו ב-Firestore.

## 10. בדיקות אבטחה

- שלחו בקשה ללא `Authorization`: חייבת לחזור 401.
- השתמשו ב-token שפג או בוטל: חייבת לחזור 401.
- נסו להתחיל מעל המכסה: חייבת לחזור 429.
- בטלו הסכמת הורה: יצירת מפגש חייבת לחזור 403.
- התחברו כמשתמש אחר: כללי Firestore אינם מאפשרים קריאת סיכומים או שימוש של UID אחר.
- מחקו תמלילים מהגדרות ההורה וודאו שמערכי התמליל ריקים. הקלטת קול גולמית אינה נשמרת בשום מצב ברירת מחדל.

## 11. החזרה למצב הדגמה

במקרה של תקלה או כדי למנוע חיוב, הגדירו:

```js
export const teacherAIConfig = { endpoint: "", demoMode: true, appCheckSiteKey: "" };
```

ה-PWA והלמידה הרגילה ממשיכים לעבוד מקומית וללא אינטרנט; שיחת Realtime אמיתית דורשת חיבור.
