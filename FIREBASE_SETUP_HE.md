# הגדרת Firebase לסנכרון — מדריך מלא למתחילים

המדריך מחבר את English Adventure לכניסה עם Google ול־Cloud Firestore. אין להוסיף למאגר מפתח של Service Account, קובץ Admin SDK או סוד פרטי. הגדרות אפליקציית Web של Firebase הן ציבוריות מטבען; האבטחה נשענת על Firebase Authentication ועל `firestore.rules`.

## 1. יצירת פרויקט Firebase

1. היכנסו אל [Firebase Console](https://console.firebase.google.com/) בחשבון Google שישמש כבעל הפרויקט.
2. לחצו **Create a project** / **יצירת פרויקט**.
3. הזינו שם, לדוגמה `english-adventure`.
4. אפשר להשבית Google Analytics — האפליקציה אינה משתמשת בו.
5. לחצו **Create project** והמתינו לסיום.

## 2. רישום אפליקציית Web

1. במסך Overview לחצו על סמל Web (`</>`).
2. הזינו כינוי, למשל `English Adventure Web`.
3. אין צורך לסמן Firebase Hosting, מפני שהאתר נשאר ב־GitHub Pages.
4. לחצו **Register app**.
5. העתיקו את אובייקט `firebaseConfig` שמוצג. לא מעתיקים פקודות npm ולא מוסיפים Service Account.

## 3. מילוי `firebase-config.js`

פתחו את `firebase-config.js` והחליפו את ערכי `REPLACE_WITH_...` בערכים שקיבלתם. לבסוף שנו:

```js
enabled: true
```

דוגמה למבנה בלבד — יש להשתמש בערכים שלכם:

```js
export const firebaseConfig = {
  enabled: true,
  apiKey: "...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

ה־API key הזה אינו סיסמה. אין להוסיף אף פעם `private_key`, קובץ JSON של Service Account או הרשאות Admin.

## 4. הפעלת כניסה עם Google

1. בתפריט Firebase פתחו **Build → Authentication**.
2. לחצו **Get started**.
3. בלשונית **Sign-in method** בחרו **Google**.
4. הפעילו את המתג **Enable**.
5. בחרו כתובת אימייל לתמיכה בפרויקט ולחצו **Save**.
6. פתחו **Authentication → Settings → Authorized domains**.
7. לחצו **Add domain** והוסיפו בדיוק:

   `yinonha-rgb.github.io`

אין להוסיף `https://`, לוכסן או את נתיב המאגר.

## 5. יצירת Cloud Firestore

1. פתחו **Build → Firestore Database**.
2. לחצו **Create database**.
3. בחרו **Production mode**.
4. בחרו אזור קרוב למשתמשים. אי אפשר לשנות את האזור לאחר היצירה.
5. לחצו **Enable**.

## 6. פרסום כללי האבטחה

1. ב־Firestore פתחו את לשונית **Rules**.
2. מחקו את הטקסט הקיים.
3. העתיקו את כל תוכן הקובץ `firestore.rules` מהמאגר.
4. לחצו **Publish**.

הכללים מאפשרים לכל משתמש מחובר לקרוא ולכתוב רק תחת `users/{ה-UID-שלו}`. כל נתיב אחר חסום. מסמכי state נבדקים לגרסת סכימה, revision ו־payload; גיבויים אינם ניתנים לשינוי לאחר יצירתם.

## 7. פרסום ב־GitHub Pages

1. העלו את `firebase-config.js` המעודכן לענף `main`.
2. המתינו לסיום פעולת Pages בלשונית **Actions** של GitHub.
3. פתחו [https://yinonha-rgb.github.io/english-adventure/](https://yinonha-rgb.github.io/english-adventure/).
4. אם מופיעה הודעת גרסה חדשה, לחצו **עדכון** ורעננו פעם אחת.

## 8. בדיקת כניסה והעברת מידע מקומי

1. במכשיר הראשון צרו התקדמות מקומית קטנה לפני הכניסה.
2. לחצו **☁️ חשבון → כניסה עם Google**.
3. בכניסה הראשונה תופיע הצעה להעלות את ההתקדמות המקומית. אשרו אותה.
4. אם כבר קיים מידע בענן וגם במכשיר, יופיע מסך מיזוג בעברית. בחרו **מיזוג ושמירה בענן**. האפליקציה אינה דורסת מידע בשקט.
5. ודאו שמופיע **מסונכרן** ושמוצג זמן הסנכרון האחרון.

## 9. בדיקה בשני מכשירים

1. פתחו את האתר בטלפון ובמחשב או בשני פרופילי דפדפן שונים.
2. היכנסו בשניהם לאותו חשבון Google.
3. הוסיפו פרופיל ילד במכשיר הראשון והשלימו משפט או שיעור.
4. בתוך זמן קצר ודאו שהפרופיל, ה־XP וההתקדמות מופיעים במכשיר השני.
5. בצעו פעילויות שונות בשני המכשירים כמעט בו־זמנית. ודאו ששיעורים שהושלמו מתאחדים ושפעילות ו־XP אינם מוכפלים.

## 10. בדיקת עבודה ללא אינטרנט

1. לאחר ביקור מקוון ראשון, הפעילו מצב טיסה או Offline בכלי המפתחים.
2. רעננו את האתר וודאו שהשיעורים עדיין נטענים.
3. השלימו פעילות. המצב צריך להציג **עובד במצב לא מקוון** או **יש שינויים הממתינים לסנכרון**.
4. החזירו את החיבור. ודאו שהמצב עובר דרך **מסנכרן…** אל **מסונכרן** ושגם המכשיר השני מתעדכן.

## 11. בדיקת אבטחה והרשאות

ב־Firestore Rules פתחו **Rules playground**:

- ללא Authentication, נסו לקרוא `users/ANY_UID/state/main` — הפעולה חייבת להידחות.
- עם UID לדוגמה `user-a`, קריאת `users/user-b/state/main` חייבת להידחות.
- עם UID `user-a`, קריאת `users/user-a/state/main` אמורה להיות מותרת.

אם בדיקה לא מורשית מצליחה, אל תפרסמו את האתר עד ש־`firestore.rules` פורסם במלואו.

## 12. מחיקה ושחזור מגיבוי

1. באזור החשבון לחצו **ייצוא גיבוי** ושמרו את קובץ ה־JSON.
2. לחצו **מחיקת נתוני ענן** והקלידו `מחיקה` בדיוק.
3. לפני המחיקה האפליקציה יוצרת מסמך גיבוי בלתי ניתן לעריכה תחת `users/{uid}/backups`.
4. לייבוא הגיבוי המקומי פתחו את אזור ההורים, בחרו **ייבוא JSON**, ואז לחצו **סנכרון עכשיו**.

## פתרון תקלות קצר

- `auth/unauthorized-domain`: ודאו שהוספתם `yinonha-rgb.github.io` ל־Authorized domains.
- `permission-denied`: ודאו שפרסמתם את `firestore.rules` ושנכנסתם לחשבון הנכון.
- חלון כניסה נחסם: אפשרו חלונות קופצים עבור אתר GitHub Pages.
- נשאר מצב לא מקוון: בדקו חיבור, לחצו **סנכרון עכשיו**, ופתחו את Console לאיתור הודעה.
- שינויי הגדרה לא מופיעים: המתינו ל־Pages, לחצו על הודעת **עדכון**, ורעננו.
