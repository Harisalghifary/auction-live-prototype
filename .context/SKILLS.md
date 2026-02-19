# Agent Capabilities (Skills)

### 1. Auctioneer Skill
- **ValidateBid:** Check if `new_bid > current_bid + increment`.
- **CloseLot:** Transition lot status from `LIVE` to `SOLD`.

### 2. Authenticator Skill (Vision)
- **AnalyzeHallmark:** Identify silver/gold purity marks from images.
- **IdentifyEra:** Cross-reference visual patterns with the Victorian/Georgian database.

### 3. Sentry Skill (Safety)
- **FlagBot:** Identify bidding patterns faster than 200ms.
- **VerifyFunds:** Check bidder's "Locked Deposit" before accepting a bid.