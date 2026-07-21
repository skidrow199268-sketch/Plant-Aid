// React Icons
import {
  MdLocalFlorist,
  MdGrass,
 
} from 'react-icons/md';

import { GiPlantSeed, GiFlowerPot, GiGrapes } from 'react-icons/gi';


export const STAGE_ICONS = [
  <GiPlantSeed   key="0" />,
  <MdGrass       key="1" />,
  <MdLocalFlorist key="2" />,
  <GiFlowerPot   key="3" />,
  <GiGrapes      key="4" />,
];

export const HEALTH_STYLES = {
  'Optimized Health': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'On Track':         'text-sky-600 bg-sky-50 border-sky-200',
  'Needs Attention':  'text-amber-600 bg-amber-50 border-amber-200',
};

export const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23ecfdf5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='bold' fill='%236ee7b7'%3EPlant%3C/text%3E%3C/svg%3E";
