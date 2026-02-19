# KNOWLEDGE.md: Antique & Auction Domain

## 1. Antique Categories & Taxonomy
- **Fine Art:** Paintings, sculptures, and original prints.
- **Horology:** Vintage watches and clocks (focus on movement types).
- **Numismatics:** Rare coins and currency.
- **Philately:** Rare stamps and postal history.
- **Furniture:** Victorian, Edwardian, and Mid-Century Modern.

## 2. Authenticity Markers (Vision AI Focus)
- **Silver:** Look for hallmarks (e.g., Lion Passant for Sterling).
- **Ceramics:** Inspect backstamps and kiln marks.
- **Jewelry:** Check for maker's marks and purity stamps (e.g., 750 for 18k).

## 3. Auction Legal Logic
- **The "Hammer" Finality:** Once the `SOLD` status is committed to the DB, no bids can be retracted or added.
- **Reserve Price:** If the `current_price` < `reserve_price` at the end of the timer, the lot is "Passed" (unsold).
- **Buyer's Premium:** A standard 20% fee is added to the final hammer price (calculate this in the checkout service).

## 4. Compliance
- **KYC:** All bidders must have a verified `profile` and a payment method on file before entering a `LIVE` auction room.