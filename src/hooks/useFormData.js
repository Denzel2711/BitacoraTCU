import { useState, useEffect } from 'react';
import { INITIAL_FORM_DATA } from '../constants/formConstants';

/**
 * Hook personalizado para manejar el estado del formulario TCU
 */
export const useFormData = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    setFormData,
    resetForm,
    updateFormData
  };
};
