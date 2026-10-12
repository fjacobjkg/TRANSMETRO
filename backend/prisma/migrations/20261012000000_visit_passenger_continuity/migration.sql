-- NULL identifies historical visits whose passenger movements were not recorded.
-- Existing occupancy, demand, identifiers and visits remain unchanged.
ALTER TABLE visitas
  ADD COLUMN personas_bajan INT UNSIGNED NULL,
  ADD COLUMN personas_abordan INT UNSIGNED NULL;
