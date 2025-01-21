app.factory('dbService', [function() {

  function openIndexedDB() {
      return new Promise((resolve, reject) => {
          const request = indexedDB.open('memoryGame', 3);
          request.onerror = evt => reject(evt.target.error);
          request.onsuccess = evt => resolve(evt.target.result);
          request.onupgradeneeded = evt => {
              const db = evt.target.result;

              if (!db.objectStoreNames.contains('users')) {
                  const userStore = db.createObjectStore('users', { keyPath: 'username' });
                  userStore.createIndex('by_email', 'email', { unique: true });
              }

              if (db.objectStoreNames.contains('score')) {
                  db.deleteObjectStore('score');
              }

              const scoreStore = db.createObjectStore('score', {
                  keyPath: 'id',
                  autoIncrement: true
              });

              scoreStore.createIndex('by_username', 'username', { unique: false });

              resolve(db);
          };
      });
  }

  function checkUsernameExists(db, username) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('users', 'readonly');
          const store = tx.objectStore('users');
          const request = store.get(username);
          request.onsuccess = evt => resolve(!!evt.target.result);
          request.onerror = err => reject(err.target.error);
      });
  }

  function checkEmailExists(db, email) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('users', 'readonly');
          const store = tx.objectStore('users');
          const index = store.index('by_email');
          const request = index.get(email);
          request.onsuccess = evt => resolve(!!evt.target.result);
          request.onerror = err => reject(err.target.error);
      });
  }

  function addUser(db, userObj) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('users', 'readwrite');
          const store = tx.objectStore('users');
          const request = store.add(userObj);
          request.onsuccess = () => resolve(true);
          request.onerror = event => reject(event.target.error);
      });
  }

  function getUserByEmail(db, email) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('users', 'readonly');
          const store = tx.objectStore('users');
          const index = store.index('by_email');
          const request = index.get(email);
          request.onsuccess = evt => resolve(evt.target.result || null);
          request.onerror = err => reject(err.target.error);
      });
  }

  function getUserRecord(db, username) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('users', 'readonly');
          const store = tx.objectStore('users');
          const req = store.get(username);
          req.onsuccess = evt => resolve(evt.target.result || null);
          req.onerror = err => reject(err.target.error);
      });
  }

  function getScoresForUser(db, username) {
      return new Promise((resolve, reject) => {
          const tx = db.transaction('score', 'readonly');
          const store = tx.objectStore('score');
          const index = store.index('by_username');
          const req = index.getAll(username);
          req.onsuccess = evt => resolve(evt.target.result || []);
          req.onerror = err => reject(err.target.error);
      });
  }

  async function saveBestScoreToIDB(username, newBestScore) {
    const db = await openIndexedDB();
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');

    const existingRecord = await new Promise((resolve, reject) => {
        const getReq = store.get(username);
        getReq.onsuccess = evt => resolve(evt.target.result || null);
        getReq.onerror = err => reject(err.target.error);
    });

    if (!existingRecord) {
        console.error(`User ${username} not found in IndexedDB.`);
        return;
    }

    console.log(`📂 Existing User Record Found:`, existingRecord);

    const isInitialBestScore = !existingRecord.bestScore || 
        (existingRecord.bestScore.moves === 0 && existingRecord.bestScore.time === 0);

    if (isInitialBestScore || 
        newBestScore.moves < existingRecord.bestScore.moves || 
        (newBestScore.moves === existingRecord.bestScore.moves && newBestScore.time < existingRecord.bestScore.time)) {

        existingRecord.bestScore = {
            moves: newBestScore.moves,
            time: newBestScore.time,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const putReq = store.put(existingRecord);
            putReq.onsuccess = () => {
                console.log(`Best Score Updated in IndexedDB:`, existingRecord.bestScore);
                resolve(true);
            };
            putReq.onerror = err => {
                console.error(`Error Updating Best Score:`, err);
                reject(err.target.error);
            };
        });
    } else {
        console.log(`New Score is Not Better. Keeping Existing Best Score.`);
    }
}



  async function saveFinalScoreToIDB(username, scoreValue) {
      const db = await openIndexedDB();
      const tx = db.transaction('score', 'readwrite');
      const store = tx.objectStore('score');
      const record = {
          username,
          score: scoreValue,
          timestamp: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
          const addReq = store.add(record);
          addReq.onsuccess = () => resolve(true);
          addReq.onerror = err => reject(err.target.error);
      });
  }

  return {
      openIndexedDB,
      getUserRecord,
      checkUsernameExists,
      checkEmailExists,
      addUser,
      getUserByEmail,
      getScoresForUser,
      saveBestScoreToIDB,
      saveFinalScoreToIDB
  };
}]);
