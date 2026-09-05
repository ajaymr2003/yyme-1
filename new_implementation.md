yymee Platform — End-to-End Operational Working Flow

1. Executive Summary & Core Architectural Model

yymee is an Indian multi-vendor marketplace connecting buyers directly with
home-based sellers, small-scale manufacturers, artisans, and commercial stores.

The WhatsApp-Direct Order Engine (Phase 1 Release)

BUYER DISCOVERY ──► OTP LOGIN ──► SINGLE-SELLER CART ──► LOG CLICK EVENT ──► WHATSAPP DEEP-LINK
 (Guest Mode)        (SMS OTP)     (1 Merchant Limit)   (public.whatsapp_click_logs)   (wa.me Chat)

1.  WhatsApp Order Handoff: Instead of an in-app payment gateway, buyers select
    product variants, enter their delivery address, and click "Order via
    WhatsApp". This generates a structured, pre-filled WhatsApp message sent
    directly to the seller's registered WhatsApp number.
2.  Single-Seller Cart Policy: To ensure clean, single-merchant order messages,
    the shopping cart restricts purchases to one seller per cart session.
3.  Monetization & Click Conversion Tracking: Every time a buyer clicks "Order
    via WhatsApp", the platform logs an event to public.whatsapp_click_logs. The
    Admin uses these lead metrics for seller monetization (pay-per-lead or
    subscription tiers).
4.  Phase 2 Roadmap ("Coming Soon"): Complex payment gateways, escrow
    holds, 7-day bank payouts, native returns, and intra-state GST/Non-GST
    geo-fencing are deferred to Phase 2. All published products are visible
    nationally during Phase 1.

2. Complete System Sequence Diagram

sequenceDiagram
    autonumber
    actor Seller as Seller
    actor Admin as Admin
    actor Buyer as Buyer
    participant DB as yymee Database

    %% Stage 1: Admin Setup & Category Creation
    Note over Admin, DB: Stage 1: Admin Platform Setup
    Admin->>DB: INSERT into 'categories' (3-Level Taxonomy: L1 -> L2 -> L3)

    %% Stage 2: Seller Onboarding & Verification
    Note over Seller, Admin: Stage 2: Merchant Registration & Verification
    Seller->>DB: Register via Phone OTP (auth.users + public.users)
    Seller->>DB: Submit Store Name, WhatsApp #, Location & Identity Proof
    Seller->>DB: INSERT into 'seller_verifications' & 'addresses'
    Seller->>DB: INSERT into 'sellers' (account_status: 'pending_verification')
    Admin->>DB: SELECT * FROM 'sellers' WHERE account_status == 'pending_verification'
    Admin->>Admin: Review identity proof, WhatsApp #, warehouse address
    alt Verification Approved
        Admin->>DB: UPDATE 'sellers' SET account_status = 'active'
        Admin->>DB: UPDATE 'seller_verifications' SET status = 'verified'
        Admin->>DB: INSERT into 'audit_logs' (action: 'SELLER_APPROVE')
    else Verification Rejected
        Admin->>DB: UPDATE 'sellers' SET account_status = 'rejected'
        Admin->>DB: INSERT into 'audit_logs' (action: 'SELLER_REJECT')
    end

    %% Stage 3: Catalog Listing
    Note over Seller, DB: Stage 3: Product & Variant Publishing
    Seller->>DB: Select L3 Category, Enter Product Details, Material, Weight & Images
    Seller->>Seller: Define Option Tags (Color, Size) & Generate Cartesian Matrix
    Seller->>DB: INSERT into 'products' & 'product_variants'

    %% Stage 4: Guest Browsing & Discovery
    Note over Buyer, DB: Stage 4: Buyer Discovery (Guest Mode)
    Buyer->>DB: SELECT * FROM 'categories', 'products', 'product_variants'
    Buyer->>Buyer: Browse catalog & select variant options (Live Price/Photo update)

    %% Stage 5: OTP Login & Single-Seller Cart
    Note over Buyer, DB: Stage 5: Buyer Login & Cart Management
    Buyer->>Buyer: Click 'Add to Cart' or 'Order via WhatsApp'
    Buyer->>DB: Verify Mobile Number via SMS OTP (auth.users + public.users)
    Buyer->>Buyer: Single-Seller Cart Check (Validates all items belong to 1 Seller)
    Buyer->>DB: INSERT / UPDATE 'cart' and 'cart_items'

    %% Stage 6: Checkout, Click Logging & WhatsApp Handoff
    Note over Buyer, Seller: Stage 6: WhatsApp Handoff & Monetization Logging
    Buyer->>DB: Input / Confirm Delivery Address in 'addresses'
    Buyer->>DB: INSERT into 'whatsapp_click_logs' (seller_id, product_id, variant_id, price)
    Buyer->>Buyer: System generates wa.me/ deep link with pre-filled order text
    Buyer->>Seller: Buyer redirected to WhatsApp chat with Seller

    %% Stage 7: Order Completion & Analytics
    Note over Seller, Admin: Stage 7: Direct Completion & Admin Analytics
    Seller->>Buyer: Confirm availability, accept payment (UPI/COD), and dispatch item
    Admin->>DB: SELECT * FROM 'whatsapp_click_logs' for Lead Analytics & Monetization

3. Stage-by-Stage Operational Workflow

Stage 1: Admin Platform Setup & Category Taxonomy

1.  Category Hierarchy Creation: Admin logs into the Admin Console and creates
    the master 3-level taxonomy in public.categories:
      - Level 1 (Department): parent_category_id = NULL (e.g., Fashion &
        Handlooms).
      - Level 2 (Sub-category): parent_category_id = L1_ID (e.g., Women's
        Clothing).
      - Level 3 (Product Type): parent_category_id = L2_ID (e.g., Sarees &
        Ethnic Wear).
2.  Promotional Banner Configuration: Admin uploads and configures homepage
    slider banners in public.banners.

Stage 2: Merchant Registration, Document Verification & Activation

1.  Phone & OTP Signup:
      - Merchant enters a 10-digit mobile number.
      - System queries public.users. If phone number exists, merchant is
        redirected to Login.
      - If new, system verifies SMS OTP, creates identity in auth.users, and
        inserts row into public.users (user_type = 'seller', is_active = true).
2.  Tax & Identity Proof Submission:
      - Path A (GST Merchants): Enter 15-digit GSTIN \rightarrow System verifies
        via GST API \rightarrow Inserts row into public.seller_verifications
        (verification_type = 'GST') \rightarrow Sets sellers.is_gst_registered =
        true.
      - Path B (Non-GST Micro-Sellers): Enter PAN, Name as per PAN, Address, and
        Captcha \rightarrow System generates a 15-digit GST Enrollment ID in-app
        \rightarrow Inserts row into public.seller_verifications
        (verification_type = 'ENROLLMENT_ID') \rightarrow Sets
        sellers.is_gst_registered = false.
3.  Store Profile & Location Setup:
      - Merchant inputs Store Name, Owner Name, Business Type, WhatsApp Business
        Number, Email ID, Warehouse Address, and Bank Account Details.
      - Inserts address record into public.addresses (owner_type = 'seller').
      - Inserts initial row into public.sellers with account_status =
        'pending_verification'.
4.  Admin Identity Audit & Approval:
      - Application appears in the Admin Verification Queue.
      - Admin inspects the submitted identity proof, store location, WhatsApp
        contact, and bank details.
      - On Approve: Admin updates public.sellers.account_status = 'active',
        bank_verified = true, updates seller_verifications.status = 'verified',
        and logs action to public.audit_logs (action = 'SELLER_APPROVE').
      - On Reject: Admin inputs rejection reason text, updates
        sellers.account_status = 'rejected', and logs action to
        public.audit_logs.
      - Upon approval, full dashboard access is unlocked for the merchant.

Stage 3: Product Catalog & Cartesian Variant Matrix Publishing

1.  Category Mapping: Merchant selects an Admin-created Level 3 Category (e.g.,
    Sarees & Ethnic Wear).
2.  Basic Information & Media:
      - Input Product Title, Description, Material/Fabric, Weight (kg), MOQ,
        Base Price, and Stock.
      - Enter Image Address URLs (image_urls TEXT[]) with main cover photo
        designation.
3.  Cartesian Option-Tag Variant Matrix Generator:
      - If product has options (have_variants = true), merchant defines option
        types (Color, Size, Volume, Pack Size, Material).
      - Merchant types value tags (Red, Blue, S, M, 100ml).
      - Cartesian Generator builds all unique combinations (N \times M).
      - Merchant uses the Bulk Edit Bar to set default MRP, Selling Price, and
        Stock, or edits specific rows individually (setting custom MRP, Price,
        Stock, Weight Override, SKU, and variant image URLs).
4.  Database Publication:
      - Creates 1 record in public.products (have_variants = true,
        stock_quantity = total_matrix_stock).
      - Creates N records in public.product_variants storing variant attributes,
        prices, SKUs, and photo URL arrays.

Stage 4: Buyer Discovery (Guest Mode)

1.  Unrestricted Marketplace Browsing: Buyers explore the entire platform in
    Guest Mode without signing in.
2.  National Catalog Visibility: All published products across all categories
    are visible nationwide.
3.  Interactive Variant Selection:
      - Buyer views product details, gallery carousel, and clickable attribute
        pills grouped by type (Color swatches, Size pills).
      - Selecting an option combination (e.g., Color: Blue / Size: M)
        dynamically updates the image carousel, price, MRP, discount percentage
        badge, and stock status in real time.

Stage 5: Buyer OTP Authentication & Single-Seller Cart Policy

1.  Triggered Mobile OTP Login:
      - When a guest buyer attempts to "Add to Cart" or "Order on WhatsApp", the
        platform prompts for authentication.
      - Buyer inputs 10-digit mobile number \rightarrow Receives SMS OTP
        \rightarrow Verifies and logs in.
      - System inserts/verifies buyer record in public.users (user_type =
        'buyer') and public.buyers.
2.  Single-Seller Cart Policy Enforcement:
      - The shopping cart enforces a Single Seller per Cart rule to ensure a
        clean, single-merchant order message on WhatsApp.
      - When a buyer adds a product, the cart checks seller_id.
      - If the buyer attempts to add an item from a different seller, the app
        prompts:
        "Your cart contains items from [Store A]. Would you like to clear your
        cart and add this item from [Store B]?"
      - Buyer can confirm to clear and add, or cancel.

Stage 6: Checkout, WhatsApp Order Handoff & Monetization Click Logging

1.  Delivery Address Confirmation: Buyer enters or confirms their delivery
    address (address_line1, city, state, pincode).
2.  WhatsApp Order Action: Buyer clicks "Order via WhatsApp".
3.  Pre-Redirect Click Logging: Before redirecting, the application executes a
    database mutation to public.whatsapp_click_logs:
      - Captures seller_id, product_id, variant_id, buyer_id, buyer_pincode,
        item_price, and clicked_at.
4.  WhatsApp Deep-Link Launch: App constructs and launches a pre-formatted
    WhatsApp deep link directed at the seller's registered WhatsApp phone
    number:
    https://wa.me/91SELLER_WHATSAPP_NUMBER?text=PRE_FILLED_MESSAGE

Stage 7: External Order Completion & Admin Operations Monitoring

1.  Direct Chat Finalization: Buyer and Seller communicate directly in WhatsApp
    chat to confirm product availability, finalize payment (UPI / Cash / Bank
    Transfer), and arrange direct shipping or hand-delivery.
2.  Admin Lead Analytics & Monetization:
      - Admin monitors public.whatsapp_click_logs in
        apps/admin/src/pages/dashboard/DashboardPage.tsx.
      - Metrics Displayed: Total WhatsApp order leads generated, top-performing
        sellers by lead volume, most popular products/variants, and high-demand
        geographic PIN codes.
      - Monetization Engine: Admin uses lead volume data to charge sellers per
        lead, assign subscription tiers, or offer featured placement slots on
        the homepage.

4. Pre-Filled WhatsApp Message Payload Specification

When the buyer clicks "Order via WhatsApp", the deep-link generates the
following structured text payload:

Hi [Store Name]! I want to place an order on yymee:

🛍️ *Product:* Printed Short Kurta Shirt
🎨 *Variant:* Color: Blue / Size: M
💰 *Price:* ₹699 (MRP: ₹899)
📦 *Quantity:* 1
📍 *Delivery Address:* Flat 402, Orchard Road, Bengaluru, Karnataka - 560001

Please confirm availability and payment details.

5. Summary of Database Reads & Writes

| Workflow Stage          | DB Read Operations                                                            | DB Write Operations                                                                                                       |
| :---------------------- | :---------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| **Merchant Onboarding** | Check `public.users` by phone number                                          | Insert `auth.users`, `public.users`, `public.sellers`, `public.addresses`, `public.seller_verifications`                  |
| **Admin Verification**  | Fetch pending sellers from `sellers` JOIN `users` JOIN `seller_verifications` | Update `sellers.account_status = 'active'`, Update `seller_verifications.status = 'verified'`, Insert `public.audit_logs` |
| **Catalog Listing**     | Fetch categories from `public.categories`                                     | Insert `public.products`, Insert `public.product_variants`                                                                |
| **Buyer Browsing**      | Read `products`, `product_variants`, `categories`, `banners`                  | None (Guest Mode)                                                                                                         |
| **Buyer Auth & Cart**   | Read `public.users`, `public.buyers`, `public.cart`                           | Insert/Update `public.cart`, `public.cart_items`                                                                          |
| **WhatsApp Order**      | Read selected variant, product, seller WhatsApp \#, and address               | Insert `public.whatsapp_click_logs`                                                                                       |
| **Admin Monetization**  | Aggregate lead metrics from `public.whatsapp_click_logs`                      | None (Read-only analytics)                                                                                                |

6. Phase 2 Roadmap ("Coming Soon" Features)

The following features are Out of Scope for Phase 1 and flagged as "Coming
Soon":

1.  Intra-State Non-GST Geo-Fencing: Restricting products from Non-GST sellers
    to buyers located in the same state (shipping_state == buyer_state).
2.  In-App Payment Gateway Integration: Native online checkout (UPI,
    Credit/Debit Cards, NetBanking) bypassing WhatsApp.
3.  Escrow Hold & Automated Bank Settlement: Holding buyer payments in escrow
    for a 7-day protection window, with automated net payouts credited to seller
    bank accounts.
4.  Native Courier API Integration: Automated waybill generation, parcel pickup
    scheduling, and live AWB tracking.
5.  In-App Return Logistics & Refund Tracking: Native return requests, photo
    evidence inspection, and seller return fee deductions.
