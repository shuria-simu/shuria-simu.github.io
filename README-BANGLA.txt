SHURIA SIMU PORTFOLIO
ONLY GITHUB + SUPABASE

কোনো Node.js নেই
কোনো Next.js নেই
কোনো Vercel নেই
কোনো npm নেই

Website Hosting = GitHub Pages
Database/Login = Supabase

FILES:
index.html   = Main website
style.css   = Design
script.js   = Website + Supabase
admin.html  = Admin panel
admin.js    = Admin panel logic
config.js   = Supabase URL + Key
supabase.sql = Database + RLS

------------------------------------
STEP 1
------------------------------------
Supabase-এ New Project বানাও।

------------------------------------
STEP 2
------------------------------------
Supabase → SQL Editor → New Query

supabase.sql file পুরো copy করে paste করো।
Run দাও।

------------------------------------
STEP 3
------------------------------------
Supabase Project Settings/API থেকে:
Project URL
Publishable/Anon Key

নাও।

config.js open করো।

এই দুইটা replace করো:

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";

Save.

------------------------------------
STEP 4 — ADMIN USER
------------------------------------
Admin Login-এ Gmail/email field থাকবে না।

Supabase:
Authentication → Users → Add User

Email হিসেবে internally দাও:

shuria@admin.shuriasimu.site

এটা Gmail না।
এটা শুধু Supabase Auth-এর internal login ID.

Password:
নিজের পছন্দমতো।

User Create করার পর UUID copy করো।

তারপর SQL Editor-এ:

insert into public.profiles(id,username,role)
values('PASTE_USER_UUID_HERE','shuria','admin');

Run.

এখন admin login:

User ID:
shuria

Password:
যেটা Supabase Auth user create করার সময় দিয়েছিলে

শুধু এই দুইটাই admin.html-এ দেখাবে।

------------------------------------
STEP 5 — GITHUB
------------------------------------
একটা GitHub repository বানাও।

এই files সব upload করো:
index.html
style.css
script.js
admin.html
admin.js
config.js

supabase.sql এবং README-BANGLA.txt-ও রাখতে পারো।

------------------------------------
STEP 6 — GITHUB PAGES
------------------------------------
GitHub Repo → Settings → Pages

Source:
Deploy from a branch

Branch:
main

Folder:
/ (root)

Save.

কিছুক্ষণ পর URL হবে প্রায়:

https://YOUR-USERNAME.github.io/REPO-NAME/

Admin:

https://YOUR-USERNAME.github.io/REPO-NAME/admin.html

------------------------------------
IMPORTANT
------------------------------------
Supabase Publishable/Anon key config.js-এ visible থাকা normal.
Security RLS দিয়ে control করা হয়েছে।

Service Role / Secret key কখনো config.js বা GitHub-এ দিবে না।

------------------------------------
ADMIN LOGIN
------------------------------------
Website admin login UI:

User ID
Password

No Gmail
No Email field

------------------------------------
FINAL SYSTEM
------------------------------------
GitHub Pages
    ↓
index.html / admin.html
    ↓
Supabase
    ├─ Database
    ├─ RLS
    └─ Auth

এই দুইটা ছাড়া আর কিছু লাগবে না।
