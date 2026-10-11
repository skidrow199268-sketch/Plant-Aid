import {deriveBotanicalSpecs, sunlightLabel,} from '../services/PlantDetailService';

export default function BotanicalSpecsView({ masterPlant }) {
  const specs = deriveBotanicalSpecs(masterPlant);

  const sections = [
    {
      title: 'Botanical Classification',
      rows: [
        { label: 'Family',   value: specs.family   },
        { label: 'Genus',    value: specs.genus     },
        { label: 'Origin',   value: specs.origin    },
        { label: 'Toxicity', value: specs.toxicity  },
      ],
    },
    {
      title: 'Care Requirements',
      rows: masterPlant ? [
        { label: 'Sunlight',    value: sunlightLabel(masterPlant.sunlight ?? '') },
        { label: 'Water Every', value: masterPlant.wateringFrequency   ? `${masterPlant.wateringFrequency} days`   : '—' },
        { label: 'Fertilize',   value: masterPlant.fertilizerFrequency ? `${masterPlant.fertilizerFrequency} days` : '—' },
        { label: 'Growth Days', value: masterPlant.growthDays          ? `${masterPlant.growthDays} days`          : '—' },
      ] : [],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-xl font-semibold text-[#1a1b22] tracking-tight">Botanical Specs</h3>
        <p className="text-xs text-[#47464a] mt-0.5">Classification and care reference data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-[#c8c5ca] rounded-md p-6 hover:border-[#1b6b51] transition-colors duration-150">
            <p className="text-xs font-bold text-[#47464a] uppercase tracking-widest mb-4">{section.title}</p>
            <dl className="space-y-0">
              {section.rows.map(({ label, value }, i) => (
                <div key={label}
                  className={`flex items-center justify-between py-3 ${
                    i < section.rows.length - 1 ? 'border-b border-[#c8c5ca]' : ''
                  }`}>
                  <dt className="text-sm text-[#47464a]">{label}</dt>
                  <dd className="text-sm font-bold text-[#1a1b22]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {masterPlant && (
        <div className="bg-white border border-[#c8c5ca] rounded-md p-6 hover:border-[#1b6b51] transition-colors duration-150">
          <p className="text-xs font-bold text-[#47464a] uppercase tracking-widest mb-4">Health Threats</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Common Pests',    value: masterPlant.pests    },
              { label: 'Common Diseases', value: masterPlant.diseases  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#fef2f2] border border-[#ef4444]/25 rounded-sm p-4">
                <p className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest mb-2">{label}</p>
                <p className="text-sm font-bold text-[#ef4444]">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}