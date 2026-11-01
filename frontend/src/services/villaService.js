import { VILLA_PROPERTIES } from '../data/villas';

export function getAllVillas() {
  return [...VILLA_PROPERTIES];
}

export function getVillaById(id) {
  return VILLA_PROPERTIES.find((villa) => villa.id === id) || null;
}

export function getTrendingVillas() {
  return [...VILLA_PROPERTIES];
}
