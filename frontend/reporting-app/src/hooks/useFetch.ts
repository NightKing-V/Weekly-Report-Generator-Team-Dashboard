import { useState, useCallback } from 'react';
import { useAppDispatch } from '../store/store';
import { showSnackbar } from '../store/slices/notificationSlice';
import { ApiError } from '../services/api';

export interface UseFetchOptions {
  showSuccessSnackbar?: boolean;
  successMessage?: string;
  showErrorSnackbar?: boolean;
  defaultErrorMessage?: string;
}

export interface UseFetchResult<T> {
  data: T | null;
  error: Error | null;
  statusCode: number | null;
}

export function useFetch() {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const execute = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options?: UseFetchOptions
    ): Promise<UseFetchResult<T>> => {
      setLoading(true);
      setError(null);
      setStatusCode(null);

      try {
        const result = await apiCall();
        setStatusCode(200);

        if (options?.showSuccessSnackbar && options?.successMessage) {
          dispatch(
            showSnackbar({
              type: 'success',
              message: options.successMessage,
              statusCode: 200,
            })
          );
        }

        setLoading(false);
        return { data: result, error: null, statusCode: 200 };
      } catch (err: unknown) {
        let code = 500;
        let message = 'An unexpected error occurred';

        if (err instanceof ApiError) {
          code = err.statusCode;
          message = err.message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        // Format user-facing message with status code
        let userMessage = options?.defaultErrorMessage || message;
        if (code === 400) {
          userMessage = `[400 Bad Request] ${message}`;
        } else if (code === 401) {
          userMessage = `[401 Unauthorized] Session expired or invalid credentials.`;
        } else if (code === 403) {
          userMessage = `[403 Forbidden] You do not have permission for this action.`;
        } else if (code === 404) {
          userMessage = `[404 Not Found] ${message}`;
        } else if (code === 500) {
          userMessage = `[500 Server Error] ${message}`;
        } else if (code === 0) {
          userMessage = `[Network Error] Unable to connect to server at localhost:8000.`;
        }

        const resolvedError = err instanceof Error ? err : new Error(message);
        setError(resolvedError);
        setStatusCode(code);
        setLoading(false);

        if (options?.showErrorSnackbar !== false) {
          dispatch(
            showSnackbar({
              type: 'error',
              message: userMessage,
              statusCode: code,
            })
          );
        }

        return { data: null, error: resolvedError, statusCode: code };
      }
    },
    [dispatch]
  );

  return { execute, loading, error, statusCode };
}

