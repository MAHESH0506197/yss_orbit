# YSS Orbit: Branding & Custom Domains User Manual

Welcome to the **YSS Orbit Branding & Custom Domains Engine** guide. This manual explains how visual identity, custom web domains, and multi-tenant branding work across the platform.

---

## 1. Architectural Overview

YSS Orbit manages branding through a strict hierarchy to ensure that every organization and tenant maintains its proper identity:

> [!NOTE]
> **The Hierarchy Rules:**
> 1. **Business Domain** (Classification layer - e.g., Healthcare, FinTech)
> 2. **Organization** (The actual client company - e.g., PayNex)
> 3. **Business Unit / Tenant** (Operational branches - e.g., PayNex US, PayNex UK)

---

## 2. Understanding Domains & Login Routing

YSS Orbit is a Multi-Tenant SaaS platform. This means it can host hundreds of different companies (Organizations) on the exact same software. When users want to log in, there are three distinct ways they can access your platform.

### Method A: The Main Portal (`www.yssorbit.com`)
* **What it is:** The shared, global entry point.
* **How it works:** Users navigate to `www.yssorbit.com` and enter their email address.
* **The Experience:** The login screen uses your master YSS Orbit branding. Once the user enters their email, the system identifies their Organization, logs them in, and *then* switches the dashboard to their Organization's specific colors and logo.

### Method B: Default Platform Domain (`[slug].yssorbit.com`)
* **What it is:** An automatically generated subdomain for each Organization.
* **Cost / Setup:** Completely **free** and requires **zero setup**. When you own `yssorbit.com`, a "Wildcard DNS" record routes all subdomains to the platform automatically.
* **How it works:** If an Organization is named "Adani Green", they get `adani-green.yssorbit.com`.
* **The Experience:** When an employee navigates to `adani-green.yssorbit.com`, the platform instantly detects the URL. **Before they even log in**, the login page is fully styled with Adani Green's logo and Primary Brand Color. However, it is still clear they are using the YSS Orbit product because of the `.yssorbit.com` address.

### Method C: Custom Domain (`portal.adanigreen.com`)
* **What it is:** The ultimate "White-Label" feature allowing clients to use their own web address.
* **Cost / Setup:** The client uses a domain they already own (no extra cost to you). They must add a DNS record on their end (e.g., CNAME `portal.adanigreen.com` -> `yssorbit.com`). You use a service like Cloudflare to automatically issue SSL/HTTPS certificates for them.
* **How it works:** The client's IT team sets up the routing. In the YSS Orbit Organization Settings, they register `portal.adanigreen.com` as their Custom Domain.
* **The Experience:** When an employee navigates to `portal.adanigreen.com`, there is absolutely no mention of "YSS Orbit". The URL, logo, colors, and login screen are 100% Adani Green. It looks like their own proprietary in-house software.

---

## 3. Configuring an Organization's Brand

When an Organization is created, it operates under the standard "Platform Brand" by default. 

### Setting Up the Global Organization Brand
1. Create a new Organization or edit an existing one.
2. In the **Branding & Identity** section, you will configure:
   * **Organization Logo:** Upload their company logo.
   * **Primary Brand Color:** Choose their hex color (e.g., `#6366F1`).
3. In the **Domain Configuration** section, you will configure:
   * **Default Platform Domain:** This is a read-only field showing their auto-generated URL (e.g., `adani-green.yssorbit.com`).
   * **Custom Domain (Optional):** Enter their custom URL here if they wish to white-label the software (e.g., `portal.adanigreen.com`).
4. Save the changes. The Branding Engine stores this in the `BrandConfiguration` database and applies it instantly across the platform.

### Custom Domain Verification Lifecycle
If a Custom Domain is requested, it follows a security lifecycle:
1. When saved, the status becomes **Pending Verification**.
2. The Platform Super Admin must navigate to **Platform Settings > Domains**.
3. Once the Platform Admin verifies that the client has correctly configured their DNS and SSL certificates, they click **Verify & Activate**.
4. The domain status changes to **Verified & Active**. The platform will now instantly recognize incoming traffic from that URL.

---

## 4. Business Unit Overrides (Tenant Branding)

Sometimes, a massive enterprise has multiple Business Units, and some of those units require their own distinct visual identity (e.g., a recently acquired subsidiary with a different brand).

You can override the global Organization brand at the Business Unit level.

### Step-by-step Configuration:
1. Navigate to the **Business Units** management module.
2. Click to **Add** or **Edit** a Business Unit.
3. In the configuration modal, locate the **Platform Identity & Branding** section.

You have three choices:

| Branding Mode | Description | How it Behaves |
|---|---|---|
| **Platform Brand** | The standard behavior. | The BU inherits the global Organization Logo and Colors. No override inputs are shown. |
| **Co-Brand** | Combines identities. | Reveals inputs for a BU-specific Logo and Color. Used when you want to show "Powered by [Parent Org]" alongside the subsidiary brand. |
| **White Label** | Completely isolated identity. | Reveals inputs for a BU-specific Logo and Color. Completely hides the parent Organization's visual identity. |

> [!TIP]
> **Dynamic Frontend UI:** If you select "Platform Brand", the color picker and logo uploader are hidden to keep the interface clean and prevent accidental configuration mistakes. They only appear when you select "Co-Brand" or "White Label".

### How It Looks to the End User
When a user logs into YSS Orbit, they select their Business Unit from the Tenant Dropdown. 
If they select a Business Unit that is configured as **White Label**, the application will instantaneously reload the CSS variables and display the custom Logo and Primary Colors specific to that Business Unit!

---

## 5. Security & Isolation

- **Middleware Resolution:** Brand detection happens in the middleware layer purely based on the URL. It is strictly separated from Permissions, RBAC, and Security Contexts to ensure blazing-fast load times.
- **Single Source of Truth:** All custom domains and visual overrides are stored centrally in the `BrandConfiguration` database, meaning changes take effect globally and instantly across the platform.
