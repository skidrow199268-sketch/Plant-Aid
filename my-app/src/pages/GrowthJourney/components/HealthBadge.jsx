
import {
  MdFavorite,
} from 'react-icons/md';


import { HEALTH_STYLES} from '../constant/growth'

export default function HealthBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${HEALTH_STYLES[status] ?? HEALTH_STYLES['On Track']}`}>
      <MdFavorite className="text-[13px]" />
      {status}
    </span>
  );
}