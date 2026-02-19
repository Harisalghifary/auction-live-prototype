-- ANTI-GRAVITY AUCTION — Seed Data (Development)
-- 5 sample antique lots from different categories

INSERT INTO public.lots (title, description, category, starting_price, current_price, reserve_price, status, image_urls)
VALUES
  (
    'Victorian Sterling Silver Candelabra, c.1885',
    'A magnificent pair of Victorian sterling silver candelabra bearing the Lion Passant hallmark. Standing 48cm tall with elaborate foliate decoration. Provenance traced to the estate of a Shropshire merchant family.',
    'Silver',
    1200.00,
    1200.00,
    800.00,
    'PRE_BID',
    NULL
  ),
  (
    'Patek Philippe Calatrava Ref. 96, c.1942',
    'An exceptionally preserved Patek Philippe Calatrava reference 96 in 18k yellow gold. Manual-wind calibre 12-400, silvered dial with applied Arabic numerals. One of the finest examples of mid-century Swiss horology.',
    'Horology',
    18000.00,
    24500.00,
    15000.00,
    'LIVE',
    NULL
  ),
  (
    '1804 Silver Dollar — Class I Specimen',
    'Considered the "King of American Coins," this 1804 Silver Dollar is among only 15 known specimens. Graded MS-62 by PCGS. A once-in-a-generation opportunity for the serious numismatist.',
    'Numismatics',
    2500000.00,
    3100000.00,
    2000000.00,
    'LIVE',
    NULL
  ),
  (
    'Louis Comfort Tiffany Dragonfly Table Lamp, c.1902',
    'A spectacular Tiffany Studios dragonfly table lamp. The blown glass globe base supports a 51cm leaded glass shade in jewel-tone greens and blues. Signed on the base and shade rim.',
    'Fine Art',
    85000.00,
    85000.00,
    70000.00,
    'PRE_BID',
    NULL
  ),
  (
    'Chippendale Mahogany Gadroon-Carved Commode, c.1765',
    'A superb George III Chippendale mahogany commode of serpentine form. Exceptional gadroon-carved edge, original brass handles, and quarter-veneered top. A masterwork of Georgian cabinet making.',
    'Furniture',
    22000.00,
    28750.00,
    18000.00,
    'SOLD',
    NULL
  );

-- Set the LIVE lots' end times
UPDATE public.lots
SET live_end_at = NOW() + INTERVAL '2 hours'
WHERE category = 'Horology' AND title LIKE '%Patek Philippe%';

UPDATE public.lots
SET live_end_at = NOW() + INTERVAL '45 minutes'
WHERE category = 'Numismatics' AND title LIKE '%1804 Silver Dollar%';
