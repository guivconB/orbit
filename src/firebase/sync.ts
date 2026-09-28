import { db } from './config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Como o Orbit é um app pessoal (single-user), usaremos um documento fixo 'my_orbit' na coleção 'users'.
// Futuramente, se você quiser múltiplos usuários, trocaríamos isso pelo ID do usuário logado.
const USER_DOC_ID = 'my_orbit';

export const syncNoteToCloud = async (content: string) => {
  try {
    const docRef = doc(db, 'users', USER_DOC_ID);
    // Usamos merge: true para não apagar outros dados (como tarefas) que estiverem no mesmo documento
    await setDoc(docRef, { note: content, lastSync: new Date().toISOString() }, { merge: true });
    console.log('☁️ Nota sincronizada com a nuvem!');
  } catch (error) {
    console.error('Erro ao sincronizar nota:', error);
  }
};

export const syncTasksToCloud = async (tasks: any[]) => {
  try {
    const docRef = doc(db, 'users', USER_DOC_ID);
    await setDoc(docRef, { tasks: tasks, lastSync: new Date().toISOString() }, { merge: true });
    console.log('☁️ Tarefas sincronizadas com a nuvem!');
  } catch (error) {
    console.error('Erro ao sincronizar tarefas:', error);
  }
};

export const fetchCloudBackup = async () => {
  try {
    const docRef = doc(db, 'users', USER_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar backup da nuvem:', error);
    return null;
  }
};
