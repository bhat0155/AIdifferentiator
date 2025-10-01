// frontend/store/usePlayground.ts
import { create } from 'zustand';

type Status = 'idle' | 'streaming' | 'complete' | 'error';
type ModelId = 'openai' | 'gemini';

type ModelState = {
  text: string;
  status: Status;
  metrics?: {
    responseTimeMs: number;
    tokenCount: number;
    costUSD: number;
  } | null;
};

type Store = {
  // top-level
  prompt: string;
  isStreaming: boolean;

  // model buckets
  models: Record<ModelId, ModelState>;

  // actions
  setPrompt: (p: string) => void;
  reset: () => void;

  appendChunk: (modelId: ModelId, chunk: string) => void;
  setStatus: (modelId: ModelId, status: Status) => void;
  setMetrics: (
    modelId: ModelId,
    metrics: { responseTimeMs: number; tokenCount: number; costUSD: number }
  ) => void;
};

const emptyModel = (): ModelState => ({
  text: '',
  status: 'idle',
  metrics: null,
});

export const usePlayground = create<Store>((set) => ({
  prompt: '',
  isStreaming: false,

  models: {
    openai: emptyModel(),
    gemini: emptyModel(),
  },

  setPrompt: (p) => set({ prompt: p }),

  // Clear previous texts/status/metrics before a new run
  reset: () =>
    set({
      isStreaming: false,
      models: {
        openai: emptyModel(),
        gemini: emptyModel(),
      },
    }),

  // Append only to the targeted modelId
  // this function coppies the existing model state and only modifies the changes
  appendChunk: (modelId, chunk) =>
    set((state) => ({
      models: {
        ...state.models,
        [modelId]: {
          ...state.models[modelId],
          text: state.models[modelId].text + chunk,
        },
      },
    })),

setStatus: (modelId, status) =>
  set((state) => {
    const nextModels = {
      ...state.models,
      [modelId]: {
        ...state.models[modelId],
        status,
      },
    };

    // Check both models' statuses after update
    const isCurrentlyStreaming =
      nextModels.openai.status === 'streaming' ||
      nextModels.gemini.status === 'streaming';

    return {
      isStreaming: isCurrentlyStreaming,
      models: nextModels,
    };
  }),

  setMetrics: (modelId, metrics) =>
    set((state) => ({
      models: {
        ...state.models,
        [modelId]: {
          ...state.models[modelId],
          metrics,
        },
      },
    })),
}));