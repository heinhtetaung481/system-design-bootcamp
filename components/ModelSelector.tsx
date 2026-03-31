'use client';

import type { ModelProvider } from '@/modules/prompt-templates/types';
import { MODEL_OPTIONS } from '@/modules/generation';

interface ModelSelectorProps {
  provider: ModelProvider;
  onChange: (provider: ModelProvider) => void;
}

export default function ModelSelector({ provider, onChange }: ModelSelectorProps) {
  return (
    <div
      className="flex"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 8,
        padding: 2,
        gap: 2,
      }}
    >
      {MODEL_OPTIONS.map((opt) => {
        const active = opt.id === provider;
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
  );
}
