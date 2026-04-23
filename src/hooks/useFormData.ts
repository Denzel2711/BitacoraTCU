import { useCallback, useState } from 'react';
import { INITIAL_FORM_DATA } from '@/constants/form';
import type { FormData } from '@/types';

export const useFormData = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const resetForm = useCallback(() => setFormData(INITIAL_FORM_DATA), []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  return { formData, setFormData, resetForm, updateFormData };
};
