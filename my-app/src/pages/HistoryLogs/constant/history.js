import {MdCheckCircle,MdWarning,MdInfo} from 'react-icons/md'

export const FILTERS = ['All', 'Healthy', 'Disease Detected', 'Identified'];

export const STATUS_THEMES = {
  solved: {
    badge: 'bg-[#a6f2d1] text-[#237157] border-[#a6f2d1]',
    Icon:  MdCheckCircle,
  },
  danger: {
    badge: 'bg-red-100 text-red-600 border-red-100',
    Icon:  MdWarning,
  },
  neutral: {
    badge: 'bg-[#e8e7f1] text-[#47464a] border-[#e8e7f1]',
    Icon:  MdInfo,
  },
};