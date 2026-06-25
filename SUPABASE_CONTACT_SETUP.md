# Nasya Cargo Supabase Contact Setup

This website sends contact form submissions to a Supabase Edge Function, then stores them in `public.contact_messages`.

## 1. Create the table

Open Supabase SQL Editor and run:

```sql
-- File: supabase/migrations/20260625_create_contact_messages.sql
```

Use the SQL in that migration file. It creates `contact_messages`, enables RLS, and prevents direct public table access.

## 2. Deploy the Edge Function

Create a Supabase Edge Function named:

```text
contact-message
```

Use the code in:

```text
supabase/functions/contact-message/index.ts
```

Deploy it with JWT verification disabled, because this endpoint is called by public website visitors:

```bash
supabase functions deploy contact-message --no-verify-jwt
```

Supabase provides `SUPABASE_URL` automatically. Add this secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Never place the service role key in website JavaScript.

## 3. Connect the website

Edit:

```text
js/config.js
```

Set:

```js
window.NASYA_CONTACT_API_URL = "https://YOUR_PROJECT_REF.functions.supabase.co/contact-message";
```

After that, publish the website again.

## 4. Test

Submit the contact form on `contact.html`, then check Supabase:

```sql
select id, name, email, phone, subject, message, status, created_at
from public.contact_messages
order by created_at desc
limit 10;
```
