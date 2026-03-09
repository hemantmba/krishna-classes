# 🎓 Krishna Classes - Complete Deployment Guide
## FREE Deployment: MongoDB Atlas + Render.com

---

## 📁 PROJECT STRUCTURE
```
krishna-classes/
├── backend/          ← Node.js + Express API
│   ├── models/       ← MongoDB schemas
│   ├── routes/       ← API endpoints
│   ├── middleware/   ← Auth middleware
│   └── server.js     ← Entry point
└── frontend/         ← React PWA
    ├── src/
    │   ├── pages/    ← All pages
    │   ├── components/
    │   └── context/
    └── public/
```

---

## STEP 1: MongoDB Atlas (Free Database)

1. Go to **https://mongodb.com/atlas** → Sign Up (FREE)
2. Create a **FREE M0 cluster** (500MB)
3. Go to **Database Access** → Add User:
   - Username: `krishna_admin`
   - Password: Generate a strong password
   - Role: `Atlas Admin`
4. Go to **Network Access** → Add IP: `0.0.0.0/0` (allow all - needed for Render)
5. Go to **Clusters** → **Connect** → **Drivers** → Copy the connection string
   - It looks like: `mongodb+srv://krishna_admin:PASSWORD@cluster0.xxxxx.mongodb.net/`
   - Add database name: `mongodb+srv://krishna_admin:PASSWORD@cluster0.xxxxx.mongodb.net/krishna_classes`

---

## STEP 2: Google Apps Script (Free Email for Password Reset)

1. Go to **https://script.google.com** → New Project
2. Paste this code:

```javascript
function doGet(e) {
  const to = e.parameter.to;
  const name = e.parameter.name;
  const resetLink = e.parameter.resetLink;

  const subject = "Krishna Classes - Password Reset";
  const body = `
    <div style="font-family: Arial; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #b8860b;">🎓 Krishna Classes</h2>
      <p>Dear ${name},</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetLink}" style="background:#b8860b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Reset Password</a>
      <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      <p>— Krishna Classes Team</p>
    </div>
  `;

  GmailApp.sendEmail(to, subject, "", { htmlBody: body });
  return ContentService.createTextOutput("OK");
}
```

3. **Deploy** → **New Deployment** → Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the deployment URL (looks like `https://script.google.com/macros/s/XXXXX/exec`)

---

## STEP 3: Upload Your Logo

1. In `frontend/public/` folder:
   - Place your logo as `logo192.png` (192x192 px) 
   - Place your logo as `logo512.png` (512x512 px)
   - Place your logo as `favicon.ico`
2. The logo from your uploaded image should be resized and saved in these sizes

---

## STEP 4: Deploy Backend on Render (FREE)

1. Push your `backend/` folder to a **GitHub repository**
2. Go to **https://render.com** → Sign Up FREE
3. **New** → **Web Service** → Connect GitHub repo
4. Settings:
   - **Name**: `krishna-classes-api`
   - **Root Directory**: `backend` (if in monorepo)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: FREE
5. Add **Environment Variables**:
   ```
   MONGODB_URI = mongodb+srv://your_connection_string/krishna_classes
   JWT_SECRET = your_very_long_random_secret_key_here_make_it_32_chars_or_more
   FRONTEND_URL = https://krishna-classes.onrender.com
   GOOGLE_SCRIPT_URL = https://script.google.com/macros/s/YOUR_ID/exec
   NODE_ENV = production
   ```
6. Click **Deploy** → Wait 3-5 minutes
7. Note your API URL: `https://krishna-classes-api.onrender.com`

---

## STEP 5: Deploy Frontend on Render (FREE)

1. Push your `frontend/` folder to GitHub
2. **New** → **Static Site** → Connect GitHub repo  
3. Settings:
   - **Name**: `krishna-classes`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add **Environment Variable**:
   ```
   REACT_APP_API_URL = https://krishna-classes-api.onrender.com/api
   REACT_APP_ADSENSE_ID = ca-pub-YOUR_ADSENSE_ID
   ```
5. Add **Redirect Rule** (for React Router):
   - Source: `/*`
   - Destination: `/index.html`
   - HTTP Status: `200`
6. Deploy!

---

## STEP 6: Create First Admin User

1. Register normally at your app as a student
2. Go to MongoDB Atlas → Browse Collections → `users`
3. Find your user → Edit → Change `role` from `"student"` to `"admin"`
4. Now login → You'll have access to `/admin`

---

## STEP 7: Setup Google AdSense

1. Go to **https://adsense.google.com** → Sign Up
2. Add your Render website URL
3. Get your **Publisher ID** (ca-pub-XXXXXXXXXX)
4. Update `frontend/.env`:
   ```
   REACT_APP_ADSENSE_ID=ca-pub-XXXXXXXXXX
   ```
5. In `frontend/public/index.html`, replace `ca-pub-XXXXXXXXXXXXXXXX` with your ID
6. In `frontend/src/components/AdBanner.js`, replace slot IDs with your actual AdSense ad unit IDs
7. Create ad units in AdSense dashboard for:
   - Top Banner (728x90 or Responsive)
   - Sidebar (300x250)
   - Result Page (Responsive)

---

## STEP 8: Test the App

1. Open your frontend URL
2. Register a student account
3. Make yourself admin (Step 6)
4. Go to Admin → Upload a few test questions
5. Login as student → Take a test
6. Check results, leaderboard, sharing

---

## 📊 PERFORMANCE TIPS FOR 1000+ CONCURRENT USERS

The app is already optimized for high load:
- **MongoDB indexes** on all frequently queried fields
- **Connection pooling** (maxPoolSize: 50)
- **Rate limiting** (100 req/15 min per IP)
- **Aggregation pipelines** for leaderboard (fast)
- **Random question sampling** using $sample (MongoDB handles this efficiently)
- **JWT stateless auth** (no session storage needed)
- **React code splitting** (each page loads independently)

Render Free tier handles ~100 concurrent users. For 1000+:
- Upgrade to Render Starter ($7/month)
- Or use Railway.app (better free tier)

---

## 📱 PWA Installation

Students can install the app on their phone:
- Android: Chrome → "Add to Home Screen"
- iOS: Safari → Share → "Add to Home Screen"

---

## 🔧 SAMPLE QUESTION CSV FORMAT

Download this template and fill it:

```csv
question,optionA,optionB,optionC,optionD,answer,explanation,difficulty,isLatex
What is 2+2?,3,4,5,6,B,Basic addition,easy,false
"Find x if $x^2=9$","x=3","x=4","x=9","x=2",A,Square root of 9 is 3,medium,true
```

---

## 🎓 Krishna Classes - Keep You Step Ahead!
