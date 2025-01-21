app.factory('gameService', [function() {

    function openIndexedDB() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('memoryGame', 2);
        request.onerror = evt => reject(evt.target.error);
        request.onsuccess = evt => resolve(evt.target.result);
        request.onupgradeneeded = evt => {
          const db = evt.target.result;
          if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'username' });
            userStore.createIndex('by_email', 'email', { unique: true });
          }
          if (!db.objectStoreNames.contains('score')) {
            db.createObjectStore('score', { keyPath: 'username' });
          }
          resolve(db);
        };
      });
    }
  
    async function saveBestScoreToIDB(username, bestScoreObj) {
      const db = await openIndexedDB();
      const tx = db.transaction('users', 'readwrite');
      const store = tx.objectStore('users');
      const existingRecord = await new Promise((resolve, reject) => {
        const getReq = store.get(username);
        getReq.onsuccess = evt => resolve(evt.target.result || null);
        getReq.onerror = err => reject(err.target.error);
      });
      let updatedRecord;
      if (!existingRecord) {
        updatedRecord = { username, bestScore: bestScoreObj };
      } else {
        updatedRecord = { ...existingRecord, bestScore: bestScoreObj };
      }
      return new Promise((resolve, reject) => {
        const putReq = store.put(updatedRecord);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = err => reject(err.target.error);
      });
    }
  
    async function saveFinalScoreToIDB(username, finalScore) {
      const db = await openIndexedDB();
      const tx = db.transaction('score', 'readwrite');
      const store = tx.objectStore('score');
      const record = { username, finalScore };
      return new Promise((resolve, reject) => {
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = err => reject(err.target.error);
      });
    }
  
    return {
      openIndexedDB,
      saveBestScoreToIDB,
      saveFinalScoreToIDB
    };
  }]);
  