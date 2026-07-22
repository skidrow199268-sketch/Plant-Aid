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
        <h3 className="text-xl font-serif font-semibold text-[#212B22] tracking-tight">Botanical Specs</h3>
        <p className="text-xs text-[#6E7568] font-mono mt-0.5">Classification and care reference data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.title} className="bg-white border border-[#E4E1D3] rounded-md p-6 hover:border-[#3F6B4A] transition-colors duration-150">
            <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono mb-4">{section.title}</p>
            <dl className="space-y-0">
              {section.rows.map(({ label, value }, i) => (
                <div key={label}
                  className={`flex items-center justify-between py-3 ${
                    i < section.rows.length - 1 ? 'border-b border-[#E4E1D3]' : ''
                  }`}>
                  <dt className="text-sm text-[#6E7568]">{label}</dt>
                  <dd className="text-sm font-bold text-[#212B22]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {masterPlant && (
        <div className="bg-white border border-[#E4E1D3] rounded-md p-6 hover:border-[#3F6B4A] transition-colors duration-150">
          <p className="text-xs font-bold text-[#6E7568] uppercase tracking-widest font-mono mb-4">Health Threats</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Common Pests',    value: masterPlant.pests    },
              { label: 'Common Diseases', value: masterPlant.diseases  },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#F7E9E5] border border-[#A14B36]/25 rounded-sm p-4">
                <p className="text-[10px] font-bold text-[#A14B36] uppercase tracking-widest font-mono mb-2">{label}</p>
                <p className="text-sm font-bold text-[#A14B36]">{value || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}