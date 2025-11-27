import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { EventData, Participant } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBXUDPowJ4maRPegAY8Bf2nwHXeeKgLI9w",
  authDomain: "datefinder-f7aba.firebaseapp.com",
  projectId: "datefinder-f7aba",
  storageBucket: "datefinder-f7aba.firebasestorage.app",
  messagingSenderId: "973631975360",
  appId: "1:973631975360:web:37571b34b42a85b836e225",
  measurementId: "G-FVLT7STTPV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Helpers ---
export const generateId = () => Math.random().toString(36).substring(2, 9);

// --- API ---

/**
 * Creates a new event in Firestore
 */
export const createEvent = async (
  eventName: string, 
  month: number, 
  year: number, 
  creatorName: string,
  creatorId: string
): Promise<string> => {
  const eventId = generateId();
  const eventRef = doc(db, 'events', eventId);
  
  const initialData: EventData = {
    id: eventId,
    name: eventName,
    month,
    year,
    participants: {
      [creatorId]: {
        name: creatorName,
        dates: []
      }
    },
    createdAt: Date.now()
  };

  await setDoc(eventRef, initialData);
  return eventId;
};

/**
 * Updates a user's selected dates for a specific event
 */
export const updateParticipantDates = async (
  eventId: string,
  userId: string,
  userName: string,
  dates: string[]
) => {
  const eventRef = doc(db, 'events', eventId);
  // We use dot notation to update a specific key in the participants map
  await updateDoc(eventRef, {
    [`participants.${userId}`]: {
      name: userName,
      dates: dates
    }
  });
};

/**
 * Subscribes to an event document
 */
export const subscribeToEvent = (
  eventId: string, 
  onUpdate: (data: EventData | null) => void
) => {
  const eventRef = doc(db, 'events', eventId);
  
  const unsubscribe = onSnapshot(eventRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as EventData);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.error("Error fetching event:", error);
    onUpdate(null);
  });

  return unsubscribe;
};