export function evaluateVisit(capacity: number, occupancy: number, demand: number) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("La capacidad debe ser un entero positivo.");
  if (!Number.isInteger(occupancy) || occupancy < 0 || !Number.isInteger(demand) || demand < 0) {
    throw new RangeError("La ocupación y la demanda deben ser enteros no negativos.");
  }
  return {
    extraUnit: demand * 2 >= capacity * 3,
    extraWaitMinutes: occupancy * 4 < capacity ? 5 : 0,
  };
}

export function calculateDepartureOccupancy(capacity: number, arriving: number, peopleOff: number, peopleBoarding: number, demand: number) {
  if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError("La capacidad debe ser un entero positivo.");
  if (![arriving, peopleOff, peopleBoarding, demand].every(value => Number.isSafeInteger(value) && value >= 0)) {
    throw new RangeError("Las cantidades de personas deben ser enteros no negativos.");
  }
  if (peopleOff > arriving) throw new RangeError("No pueden bajar más personas de las que llegan en el bus.");
  if (peopleBoarding > demand) throw new RangeError("No pueden abordar más personas de las que están esperando.");
  const occupancy = arriving - peopleOff + peopleBoarding;
  if (occupancy > capacity) throw new RangeError("La ocupación resultante supera la capacidad máxima del bus.");
  return occupancy;
}
