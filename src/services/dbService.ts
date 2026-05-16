import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
export { db };

// Generic CRUD
export const streamCollection = (path: string, callback: (data: any[]) => void) => {
  return onSnapshot(collection(db, path), (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => handleFirestoreError(error, OperationType.LIST, path));
};

export const addItem = async (path: string, data: any) => {
  try {
    const docRef = await addDoc(collection(db, path), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateItem = async (path: string, id: string, data: any) => {
  try {
    const docRef = doc(db, path, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
  }
};

// Specific Logic for Factory Deliveries
export const receiveDelivery = async (delivery: { orderId: string, quantityReceived: number, notes?: string }) => {
  try {
    // 1. Get the order
    const orderRef = doc(db, 'orders', delivery.orderId);
    // 2. Add delivery record
    await addDoc(collection(db, 'deliveries'), {
      ...delivery,
      date: Timestamp.now(),
    });
    // 3. Update order receivedQty
    await updateDoc(orderRef, {
      receivedQty: increment(delivery.quantityReceived),
      updatedAt: Timestamp.now(),
    });
    // Note: We'd also need to update product stock here if we know the productId from the order
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'complex-delivery');
  }
};
