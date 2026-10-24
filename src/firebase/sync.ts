import { db, auth } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

// Cada usuário logado tem seu próprio documento em users/{uid}.
// As regras do Firestore (firestore.rules) só deixam o dono ler e escrever.

export interface CloudTask {
  title: string;
  status: TaskStatus;
  created_at?: string;
}

export interface CloudBackup {
  note?: string;
  tasks?: CloudTask[];
  lastSync: string;
}

const userDoc = (user: User) => doc(db, 'users', user.uid);
const lastSyncKey = (user: User) => `orbit_lastCloudSync:${user.uid}`;

// Fica desligado até o app decidir se restaura o backup. Sem isso, a primeira
// gravação local poderia sobrescrever na nuvem dados mais novos de outro PC.
let syncEnabled = false;
export const setSyncEnabled = (enabled: boolean) => {
  syncEnabled = enabled;
};

export const watchUser = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);
export const signIn = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
export const signUp = (email: string, password: string) => createUserWithEmailAndPassword(auth, email, password);
export const logOut = () => signOut(auth);

async function push(data: Partial<CloudBackup>) {
  const user = auth.currentUser;
  if (!user || !syncEnabled) return;
  const lastSync = new Date().toISOString();
  try {
    await setDoc(userDoc(user), { ...data, lastSync }, { merge: true });
    localStorage.setItem(lastSyncKey(user), lastSync);
  } catch (error) {
    console.error('Erro ao sincronizar com a nuvem:', error);
  }
}

export const syncNoteToCloud = (note: string) => push({ note });

export const syncTasksToCloud = (tasks: CloudTask[]) =>
  push({ tasks: tasks.map(t => ({ title: t.title, status: t.status, created_at: t.created_at ?? '' })) });

/** Devolve o backup da nuvem se ele for mais novo que a última sincronização deste PC. */
export async function checkForNewerBackup(user: User): Promise<CloudBackup | null> {
  try {
    const snap = await getDoc(userDoc(user));
    if (!snap.exists()) return null;
    const data = snap.data() as CloudBackup;
    const local = localStorage.getItem(lastSyncKey(user));
    return !local || data.lastSync > local ? data : null;
  } catch (error) {
    console.error('Erro ao buscar backup da nuvem:', error);
    return null;
  }
}

export function markSynced(user: User, lastSync: string) {
  localStorage.setItem(lastSyncKey(user), lastSync);
}

export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com esse e-mail.';
    case 'auth/weak-password':
      return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'E-mail inválido.';
    case 'auth/operation-not-allowed':
      return 'Login por e-mail não está ativado no Firebase Console (Authentication > Sign-in method).';
    case 'auth/network-request-failed':
      return 'Sem conexão com a internet.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos.';
    default:
      return 'Não foi possível entrar. Tente novamente.';
  }
}
