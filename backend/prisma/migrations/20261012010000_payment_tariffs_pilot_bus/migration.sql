-- PREPARED ONLY. Do not run automatically. No fabricated pilot assignments.
ALTER TABLE medios_acceso
  ADD COLUMN tarifa DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  ADD CONSTRAINT chk_medios_tarifa_positiva CHECK (tarifa > 0);

ALTER TABLE estacion_medio_acceso
  ADD COLUMN es_principal TINYINT(1) NOT NULL DEFAULT 0,
  ADD INDEX idx_estacion_medio_principal (estacion_id, activo, es_principal),
  ADD CONSTRAINT chk_medio_principal_activo CHECK (es_principal = 0 OR activo = 1);

-- Only an unambiguous single enabled, active medium becomes principal.
-- Stations with several enabled media remain false and need manual configuration.
UPDATE estacion_medio_acceso AS em
JOIN (
  SELECT enabled.estacion_id, MIN(enabled.id) AS unico_id
  FROM (SELECT relation.id, relation.estacion_id
        FROM estacion_medio_acceso AS relation
        JOIN medios_acceso AS medium ON medium.id = relation.medio_acceso_id
        WHERE relation.activo = 1 AND medium.activo = 1) AS enabled
  GROUP BY enabled.estacion_id HAVING COUNT(*) = 1
) AS single_medium ON single_medium.unico_id = em.id
SET em.es_principal = 1;

CREATE TABLE asignacion_piloto_bus (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  piloto_id INT UNSIGNED NOT NULL,
  bus_id INT UNSIGNED NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_piloto_bus_piloto_vigencia (piloto_id, fecha_fin),
  INDEX idx_piloto_bus_bus_vigencia (bus_id, fecha_fin),
  CONSTRAINT fk_piloto_bus_piloto FOREIGN KEY (piloto_id) REFERENCES pilotos(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_piloto_bus_bus FOREIGN KEY (bus_id) REFERENCES buses(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_piloto_bus_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;
