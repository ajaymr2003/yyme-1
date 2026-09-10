-- ============================================================================
-- YYME MARKETPLACE: KERALA FOOD, SPICES & STAPLES TAXONOMY
-- L1 Categories: 5
-- L2 Categories: 13
-- L3 Categories: 59
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LEVEL 1 (PRIMARY CATEGORIES)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (category_id, parent_category_id, level, name, display_order)
VALUES
  ('l1-kerala-snacks-and-savories', NULL, 1, 'Kerala Snacks & Savories', 1),
  ('l1-spices-and-condiments',       NULL, 1, 'Spices & Condiments',       2),
  ('l1-staples-and-grains',          NULL, 1, 'Staples & Grains',          3),
  ('l1-beverages',                   NULL, 1, 'Beverages',                 4),
  ('l1-organic-and-farm-fresh',      NULL, 1, 'Organic & Farm Fresh',      5)
ON CONFLICT (category_id) DO UPDATE 
SET name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    parent_category_id = EXCLUDED.parent_category_id, 
    display_order = EXCLUDED.display_order;

-- ----------------------------------------------------------------------------
-- 2. LEVEL 2 (SUB-CATEGORIES)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (category_id, parent_category_id, level, name, display_order)
VALUES
  -- Kerala Snacks & Savories
  ('l2-chips-and-crisps',        'l1-kerala-snacks-and-savories', 2, 'Chips & Crisps',          1),
  ('l2-traditional-sweets',      'l1-kerala-snacks-and-savories', 2, 'Traditional Sweets',      2),
  ('l2-tea-time-crunchy-snacks', 'l1-kerala-snacks-and-savories', 2, 'Tea-Time Crunchy Snacks', 3),

  -- Spices & Condiments
  ('l2-whole-spices',            'l1-spices-and-condiments',       2, 'Whole Spices',            1),
  ('l2-powders-and-blends',      'l1-spices-and-condiments',       2, 'Powders & Blends',        2),
  ('l2-pickles-and-chutneys',    'l1-spices-and-condiments',       2, 'Pickles & Chutneys',      3),

  -- Staples & Grains
  ('l2-rice-varieties',          'l1-staples-and-grains',          2, 'Rice Varieties',          1),
  ('l2-oils-and-ghee',           'l1-staples-and-grains',          2, 'Oils & Ghee',             2),
  ('l2-flours-and-pulses',       'l1-staples-and-grains',          2, 'Flours & Pulses',         3),

  -- Beverages
  ('l2-tea-and-coffee',          'l1-beverages',                   2, 'Tea & Coffee',            1),
  ('l2-traditional-drinks',      'l1-beverages',                   2, 'Traditional Drinks',      2),

  -- Organic & Farm Fresh
  ('l2-sweeteners',              'l1-organic-and-farm-fresh',      2, 'Sweeteners',              1),
  ('l2-dry-fruits-and-nuts',     'l1-organic-and-farm-fresh',      2, 'Dry Fruits & Nuts',       2)
ON CONFLICT (category_id) DO UPDATE 
SET name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    parent_category_id = EXCLUDED.parent_category_id, 
    display_order = EXCLUDED.display_order;

-- ----------------------------------------------------------------------------
-- 3. LEVEL 3 (LEAF CATEGORIES)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (category_id, parent_category_id, level, name, display_order)
VALUES
  -- 1. Chips & Crisps
  ('l3-chips-banana-chips',                  'l2-chips-and-crisps', 3, 'Banana Chips (Nenthraakaaya)',         1),
  ('l3-chips-jackfruit-chips',               'l2-chips-and-crisps', 3, 'Jackfruit Chips (Chakka Varuthathu)',  2),
  ('l3-chips-tapioca-chips',                 'l2-chips-and-crisps', 3, 'Tapioca Chips (Kappa Varuthathu)',     3),
  ('l3-chips-bitter-gourd-chips',            'l2-chips-and-crisps', 3, 'Bitter Gourd Chips',                   4),

  -- 2. Traditional Sweets
  ('l3-sweets-sharkara-varatti',             'l2-traditional-sweets', 3, 'Sharkara Varatti (Jaggery Coated Chips)', 1),
  ('l3-sweets-kozhikode-halwa',              'l2-traditional-sweets', 3, 'Kozhikode Halwa (Black/Wheat)',           2),
  ('l3-sweets-unniyappam',                   'l2-traditional-sweets', 3, 'Unniyappam',                              3),
  ('l3-sweets-neyyappam',                    'l2-traditional-sweets', 3, 'Neyyappam',                               4),
  ('l3-sweets-ada-pradhaman',                'l2-traditional-sweets', 3, 'Ada Pradhaman',                           5),

  -- 3. Tea-Time Crunchy Snacks
  ('l3-snacks-achappam',                     'l2-tea-time-crunchy-snacks', 3, 'Achappam (Rose Cookies)', 1),
  ('l3-snacks-kuzhalappam',                  'l2-tea-time-crunchy-snacks', 3, 'Kuzhalappam',             2),
  ('l3-snacks-avalose-podi',                 'l2-tea-time-crunchy-snacks', 3, 'Avalose Podi',            3),
  ('l3-snacks-murukku',                      'l2-tea-time-crunchy-snacks', 3, 'Murukku',                 4),
  ('l3-snacks-ribbon-pakoda',                'l2-tea-time-crunchy-snacks', 3, 'Ribbon Pakoda',           5),

  -- 4. Whole Spices
  ('l3-spices-wayanad-black-pepper',         'l2-whole-spices', 3, 'Wayanad Black Pepper', 1),
  ('l3-spices-green-cardamom',               'l2-whole-spices', 3, 'Green Cardamom',       2),
  ('l3-spices-cloves',                       'l2-whole-spices', 3, 'Cloves',               3),
  ('l3-spices-cinnamon',                     'l2-whole-spices', 3, 'Cinnamon',             4),
  ('l3-spices-mace',                         'l2-whole-spices', 3, 'Mace',                 5),
  ('l3-spices-nutmeg',                       'l2-whole-spices', 3, 'Nutmeg',               6),

  -- 5. Powders & Blends
  ('l3-powders-sambar-powder',               'l2-powders-and-blends', 3, 'Sambar Powder',          1),
  ('l3-powders-rasam-powder',                'l2-powders-and-blends', 3, 'Rasam Powder',           2),
  ('l3-powders-fish-curry-masala',           'l2-powders-and-blends', 3, 'Fish Curry Masala',      3),
  ('l3-powders-chicken-masala',              'l2-powders-and-blends', 3, 'Chicken Masala',         4),
  ('l3-powders-turmeric-powder',             'l2-powders-and-blends', 3, 'Turmeric Powder',        5),
  ('l3-powders-kashmiri-chili-powder',       'l2-powders-and-blends', 3, 'Kashmiri Chili Powder',  6),

  -- 6. Pickles & Chutneys
  ('l3-pickles-raw-mango-pickle',            'l2-pickles-and-chutneys', 3, 'Raw Mango Pickle (Manga Achar)', 1),
  ('l3-pickles-lemon-pickle',                'l2-pickles-and-chutneys', 3, 'Lemon Pickle',                  2),
  ('l3-pickles-garlic-pickle',               'l2-pickles-and-chutneys', 3, 'Garlic Pickle',                 3),
  ('l3-pickles-prawns-pickle',               'l2-pickles-and-chutneys', 3, 'Prawns Pickle (Chemmeen)',      4),
  ('l3-pickles-beef-pickle',                 'l2-pickles-and-chutneys', 3, 'Beef Pickle',                   5),
  ('l3-pickles-fish-pickle',                 'l2-pickles-and-chutneys', 3, 'Fish Pickle',                   6),

  -- 7. Rice Varieties
  ('l3-rice-palakkadan-matta-rice',          'l2-rice-varieties', 3, 'Palakkadan Matta Rice (Red Rice)',     1),
  ('l3-rice-jeerakasala-rice',               'l2-rice-varieties', 3, 'Jeerakasala Rice (Kaima for Biryani)', 2),
  ('l3-rice-navara-rice',                    'l2-rice-varieties', 3, 'Navara Rice',                          3),
  ('l3-rice-ponni-boiled-rice',              'l2-rice-varieties', 3, 'Ponni Boiled Rice',                    4),

  -- 8. Oils & Ghee
  ('l3-oils-pure-coconut-oil',               'l2-oils-and-ghee', 3, 'Pure Coconut Oil (Vellichenna)',     1),
  ('l3-oils-sesame-oil',                     'l2-oils-and-ghee', 3, 'Sesame Oil',                         2),
  ('l3-oils-cold-pressed-groundnut-oil',     'l2-oils-and-ghee', 3, 'Cold-Pressed Groundnut Oil',         3),
  ('l3-oils-traditional-cow-ghee',           'l2-oils-and-ghee', 3, 'Traditional Cow Ghee',              4),

  -- 9. Flours & Pulses
  ('l3-flours-puttu-podi',                   'l2-flours-and-pulses', 3, 'Puttu Podi (Rice/Wheat)',       1),
  ('l3-flours-appam-podi',                   'l2-flours-and-pulses', 3, 'Appam Podi',                    2),
  ('l3-flours-tapioca-flour',                'l2-flours-and-pulses', 3, 'Tapioca Flour (Kappa Podi)',    3),
  ('l3-flours-toor-dal',                     'l2-flours-and-pulses', 3, 'Toor Dal',                      4),
  ('l3-flours-urad-dal',                     'l2-flours-and-pulses', 3, 'Urad Dal',                      5),

  -- 10. Tea & Coffee
  ('l3-beverages-munnar-tea',                'l2-tea-and-coffee', 3, 'Munnar Tea / Nilgiri Tea',  1),
  ('l3-beverages-wayanad-robusta-coffee',    'l2-tea-and-coffee', 3, 'Wayanad Robusta Coffee',   2),
  ('l3-beverages-filter-coffee-decoction',   'l2-tea-and-coffee', 3, 'Filter Coffee Decoction',  3),
  ('l3-beverages-sulaimani-tea-kit',         'l2-tea-and-coffee', 3, 'Sulaimani Tea Kit',        4),

  -- 11. Traditional Drinks
  ('l3-drinks-tender-coconut-water',         'l2-traditional-drinks', 3, 'Tender Coconut Water (Packaged)', 1),
  ('l3-drinks-nannari-sarbath-syrup',        'l2-traditional-drinks', 3, 'Nannari Sarbath Syrup',          2),
  ('l3-drinks-ginger-squash',                'l2-traditional-drinks', 3, 'Ginger Squash',                  3),
  ('l3-drinks-palm-jaggery-drink-mix',       'l2-traditional-drinks', 3, 'Palm Jaggery Drink Mix',         4),

  -- 12. Sweeteners
  ('l3-sweeteners-organic-jaggery-blocks',   'l2-sweeteners', 3, 'Organic Jaggery Blocks (Sharkara)', 1),
  ('l3-sweeteners-palm-jaggery',             'l2-sweeteners', 3, 'Palm Jaggery (Karupatti)',          2),
  ('l3-sweeteners-forest-wild-honey',        'l2-sweeteners', 3, 'Honey (Forest Wild Honey)',         3),

  -- 13. Dry Fruits & Nuts
  ('l3-nuts-cashew-nuts',                    'l2-dry-fruits-and-nuts', 3, 'Cashew Nuts (Kollam Cashews)', 1),
  ('l3-nuts-dried-coconut-chunks',           'l2-dry-fruits-and-nuts', 3, 'Dried Coconut Chunks',         2),
  ('l3-nuts-jackfruit-seed-snacks',          'l2-dry-fruits-and-nuts', 3, 'Jackfruit Seed Snacks',        3)
ON CONFLICT (category_id) DO UPDATE 
SET name = EXCLUDED.name, 
    level = EXCLUDED.level, 
    parent_category_id = EXCLUDED.parent_category_id, 
    display_order = EXCLUDED.display_order;
