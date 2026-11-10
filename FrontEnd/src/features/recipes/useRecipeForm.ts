import { useCallback, useMemo, useRef, useState } from 'react';

import type { PickedPhoto } from '../../services/photoPicker';
import type { Recipe, RecipeInput } from '../../types/recipe';
import { parseQuantity, quantityToText } from './quantity';

export interface IngredientDraft {
  key: string;
  name: string;
  quantity: string; // text, so "1/2" can be typed
  unit: string | null;
}
export interface StepDraft {
  key: string;
  text: string;
}
// The picture: nothing, the one already saved on the server, or a newly chosen one.
export type PhotoState =
  | { kind: 'none' }
  | { kind: 'saved'; url: string }
  | { kind: 'new'; photo: PickedPhoto };

export const MAX_INGREDIENTS = 60;
export const MAX_STEPS = 60;
export const MAX_STEP_LENGTH = 1000;

// "1. Chop the onion" / "- Chop the onion" -> "Chop the onion"
function cleanStep(line: string): string {
  return line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim();
}

// All the state of the Create recipe form, shared by "new" and "edit" screens.
export function useRecipeForm(initial?: Recipe) {
  const counter = useRef(0);
  const nextKey = () => `k${counter.current++}`;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(() =>
    (initial?.ingredients ?? []).map((i) => ({
      key: nextKey(),
      name: i.name,
      quantity: quantityToText(i.quantity),
      unit: i.unit,
    })),
  );
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    (initial?.steps ?? []).map((text) => ({ key: nextKey(), text })),
  );
  const [stepInput, setStepInput] = useState('');
  const [photo, setPhoto] = useState<PhotoState>(
    initial?.imageUrl ? { kind: 'saved', url: initial.imageUrl } : { kind: 'none' },
  );

  // ---- ingredients ----
  const addIngredient = useCallback((name: string, unit: string | null = null, quantity = '1') => {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (!clean) return;
    setIngredients((list) =>
      list.length >= MAX_INGREDIENTS ? list : [...list, { key: nextKey(), name: clean.slice(0, 100), quantity, unit }],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const updateIngredient = useCallback((key: string, patch: Partial<IngredientDraft>) => {
    setIngredients((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }, []);
  const removeIngredient = useCallback((key: string) => {
    setIngredients((list) => list.filter((i) => i.key !== key));
  }, []);

  // ---- steps ----
  // Pasting several lines adds several steps ("one step per line").
  const addStepsFromInput = useCallback(() => {
    const lines = stepInput.split('\n').map(cleanStep).filter(Boolean);
    if (lines.length === 0) return;
    setSteps((list) =>
      [...list, ...lines.map((text) => ({ key: nextKey(), text: text.slice(0, MAX_STEP_LENGTH) }))].slice(0, MAX_STEPS),
    );
    setStepInput('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepInput]);
  const updateStep = useCallback((key: string, text: string) => {
    setSteps((list) => list.map((s) => (s.key === key ? { ...s, text } : s)));
  }, []);
  const removeStep = useCallback((key: string) => {
    setSteps((list) => list.filter((s) => s.key !== key));
  }, []);

  // ---- what is still missing ----
  const pendingSteps = stepInput.split('\n').map(cleanStep).filter(Boolean);
  const finalSteps = [...steps.map((s) => cleanStep(s.text)), ...pendingSteps].filter(Boolean);
  const badAmounts = ingredients.filter((i) => parseQuantity(i.quantity) === null).length;

  const missing = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push('a title');
    if (ingredients.length === 0) list.push('at least one ingredient');
    if (finalSteps.length === 0) list.push('at least one step');
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, ingredients.length, finalSteps.length]);

  const canSubmit = missing.length === 0 && badAmounts === 0;

  // What to send to the backend. A step typed but not added with the + button still counts.
  const toInput = useCallback((): RecipeInput | null => {
    if (!canSubmit) return null;
    return {
      title: title.trim().replace(/\s+/g, ' '),
      ingredients: ingredients.map((i) => ({
        name: i.name.trim(),
        quantity: parseQuantity(i.quantity) as number,
        unit: i.unit,
      })),
      steps: finalSteps.map((s) => s.slice(0, MAX_STEP_LENGTH)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSubmit, title, ingredients, steps, stepInput]);

  return {
    title, setTitle,
    ingredients, addIngredient, updateIngredient, removeIngredient,
    steps, stepInput, setStepInput, addStepsFromInput, updateStep, removeStep,
    photo, setPhoto,
    missing, badAmounts, canSubmit, toInput,
  };
}

export type RecipeForm = ReturnType<typeof useRecipeForm>;
