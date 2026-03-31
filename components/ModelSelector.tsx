'use client';

import type { ModelOption } from '@/modules/prompt-templates/types';

interface ModelSelectorProps {
  modelId: string;
  onChange: (modelId: string) => void;
  options: ModelOption[];
  hasOwnKey?: boolean;
}

export default function ModelSelector({ modelId, onChange, options, hasOwnKey }: ModelSelectorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 8,
          padding: 2,
        }}
      >
        {options.map((opt) => {
          const active = opt.id === modelId;
          return (
            <button
              key={opt.id}
              onClick={() => onChange(opt.id)}
              title={opt.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: active ? 500 : 400,
                color: active ? '#ffffff' : 'rgba(245,245,247,0.50)',
                background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                transition: 'all 0.15s',
                cursor: 'pointer',
                border: 'none',
                outline: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: active ? opt.color : 'rgba(245,245,247,0.25)',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              />
              <span>{opt.name}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {hasOwnKey ? (
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(34,197,94,0.15)',
              color: 'rgba(134,239,172,0.9)',
              border: '1px solid rgba(34,197,94,0.25)',
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            🔑 Your key
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(245,245,247,0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontWeight: 400,
            }}
          >
            Free tier
          </span>
        )}
      </div>
    </div>
  );
}
