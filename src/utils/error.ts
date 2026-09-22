/**
 * Safe error message extraction utility.
 * Prevents React Error #31 (Objects are not valid as a React child: {code, message})
 * by ensuring all error values extracted for UI rendering or toasts are strings.
 */

export function getErrorMessage(err: any, fallback = 'An unexpected error occurred'): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;

  // Handle Axios or Fetch API response payloads
  const resData = err.response?.data ?? err.data;
  if (resData) {
    if (typeof resData === 'string') return resData;
    if (typeof resData.error === 'string') return resData.error;
    if (resData.error && typeof resData.error === 'object') {
      if (typeof resData.error.message === 'string') return resData.error.message;
      if (typeof resData.error.code === 'string') return `${resData.error.code}: ${resData.error.message || 'Error'}`;
    }
    if (typeof resData.message === 'string') return resData.message;
    if (resData.message && typeof resData.message === 'object' && typeof resData.message.message === 'string') {
      return resData.message.message;
    }
  }

  // Handle standard JavaScript Error or Supabase PostgREST error
  if (typeof err.message === 'string') return err.message;
  if (typeof err.error === 'string') return err.error;
  if (err.error && typeof err.error === 'object' && typeof err.error.message === 'string') {
    return err.error.message;
  }

  // Fallback to serialization if possible
  try {
    const str = JSON.stringify(err);
    return str !== '{}' ? str : fallback;
  } catch {
    return fallback;
  }
}
