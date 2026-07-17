# Zoho OAuth Setup — Refresh + Access Token

Redirect URI **Zoho se nahi milta** — aap khud define karte ho aur Zoho API Console mein register karte ho.

---

## Redirect URI kya hai?

Jab aap Zoho se permission approve karte ho, Zoho browser ko ek URL par redirect karta hai. Wahi **Redirect URI** hai.

Hamare project ke liye ye use karo:

```
http://localhost:4000/oauth/callback
```

---

## Step-by-step (5 minutes)

### Step 1 — Zoho API Console mein Redirect URI add karo

1. Open: [https://api-console.zoho.com/](https://api-console.zoho.com/)
2. Apna client select karo (Server-based Application)
3. **Client Secret** tab ya **Settings** → **Authorized Redirect URIs**
4. Add karo:
   ```
   http://localhost:4000/oauth/callback
   ```
5. **Update** / **Save** click karo

> Agar India account hai to `ZOHO_ACCOUNTS_URL=https://accounts.zoho.in` use karo `.env` mein.

---

### Step 2 — Backend start karo

```bash
cd Hackthone/backend
npm run dev
```

---

### Step 3 — Browser mein OAuth start karo

Open:

```
http://localhost:4000/oauth/start
```

Ya pehle redirect URI confirm karo:

```
http://localhost:4000/oauth/info
```

---

### Step 4 — Zoho login + Accept

- Login as `gaurav.khurana468`
- **Accept** permissions
- Browser automatically `/oauth/callback` par jayega
- Page par **dono tokens** dikhenge:
  - **Refresh Token** → `.env` mein permanent save karo
  - **Access Token** → temporary (~1 hour), backend khud refresh karega

---

### Step 5 — `.env` update karo

Page se copy karke paste karo:

```env
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxx
```

Backend restart karo, phir verify:

```bash
npm run zoho:refresh
```

---

## Token types

| Token | Lifetime | Kahan save |
|-------|----------|------------|
| **Refresh Token** | Permanent (jab tak revoke na ho) | `.env` → `ZOHO_REFRESH_TOKEN` |
| **Access Token** | ~1 hour | Backend memory — auto-generated from refresh token |

Aapko sirf **refresh token ek baar** save karna hai. Access token backend har request se pehle khud banata hai.

---

## Alternative: Self Client (bina redirect URI)

Agar redirect URI register nahi karna chahte:

1. [API Console](https://api-console.zoho.com/) → **Self Client**
2. Scopes paste karo:
   ```
   ZohoCreator.report.READ,ZohoCreator.report.UPDATE,ZohoCreator.report.CREATE
   ```
3. **Generate Code** → code copy karo (2 min valid)
4. Run:
   ```bash
   node scripts/zoho-oauth.js exchange YOUR_CODE
   ```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `invalid_redirect_uri` | Console mein exact URI add karo: `http://localhost:4000/oauth/callback` |
| `invalid_code` | Code expire ho gaya — `/oauth/start` se dubara try karo |
| `invalid_client` | Client ID / Secret check karo |
| India account | `ZOHO_ACCOUNTS_URL=https://accounts.zoho.in` |

---

## Quick links (backend running hone par)

- Redirect URI info: http://localhost:4000/oauth/info
- Generate tokens: http://localhost:4000/oauth/start
