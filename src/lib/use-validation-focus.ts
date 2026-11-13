import { useEffect, useRef } from 'react';

// Errors change on submit, so editing a field doesn't pull focus away from it.
export function useValidationFocus(errors: object) {
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      form.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    }
  }, [errors]);

  return form;
}
