import { apiGet, apiPost } from './httpClient';
import {
  AuthRole,
  AuthSuccessResponse,
  LoginPayload,
  RegisterPayload,
} from '../../types/auth';

const rolePath = {
  driver: 'drivers',
  mechanic: 'mechanics',
} as const;

export async function login(payload: LoginPayload): Promise<AuthSuccessResponse> {
  return apiPost<AuthSuccessResponse, { email: string; password: string }>(
    `/api/auth/${rolePath[payload.role]}/login`,
    { email: payload.email, password: payload.password },
  );
}

export async function register(payload: RegisterPayload): Promise<AuthSuccessResponse> {
  const { role, ...body } = payload;
  return apiPost<AuthSuccessResponse, Omit<RegisterPayload, 'role'>>(
    `/api/auth/${rolePath[payload.role]}/register`,
    body,
  );
}

export async function getCurrentUser(role: AuthRole): Promise<void> {
  await apiGet(`/api/auth/${rolePath[role]}/me`);
}
