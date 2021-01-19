const { LinkedList, _Node } = require('../linked-list');

const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score',
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id });
  },

  // write services for getting next word(original) 
  // id, language_id (from language table)
  //correct count for that word
  //total score for user
  getNextWord(db, language_id) {
    return db
      .from('word')
      .select(
        'language_id',
        'original',
        'translation',
        'correct_count',
        'incorrect_count',
      )
      .where({ language_id });
  },

  ///write services for guess   
  //Check if the submitted answer is correct by comparing it with the translation in the database.
  checkGuess(db, language_id) {
    return db
      .from('word')
      .join('language', 'word.id', '=', 'language.head')
      .select('*')
      .where({ language_id });
  },

  // do I need one for the start of the list? language is only table with head column -- 
  getLanguageHead(db, language_id){
    return db
      .from('language')
      .join('word', 'word.language_id','=','language.id')
      .select('head')
      .groupBy('head')
      .where({language_id});
  },

  // Linked List?????? populate one here then make it do stuff in the router? 
  // linkedList(words, head) {}
  // Using the array of words taken from the database, we find each consecutive word
  // in the list based on either the head value(for the start of the list) or the next value of each word,
  // inserting each word to the end of the list
  createLinkedList(words, head) {
    const headObj = words.find(word => word.id === head);
    const headIndex = words.indexOf(headObj);
    const headNode = words.splice(headIndex,1);
    const list = new LinkedList();
    list.insertLast(headNode[0]);

    let nextId = headNode[0].next;
    let currentWord = words.find(word => word.id === nextId);
    list.insertLast(currentWord);
    nextId = currentWord.next;
    currentWord = words.find(word => word.id === nextId);

    while(currentWord !== null){
      list.insertLast(currentWord);
      nextId = currentWord.next;
      if(nextId === null){
        currentWord = null;
      } else {
        currentWord = words.find(word => word.id === nextId);
      }
    }
    return list;
  },


  updateWordsTable(db, words, language_id, total_score) {
    // create a transaction
    return db.transaction(async trx =>{
      return Promise.all([
        trx('language')
        .where({id: language_id})
        .update({
          total_score,
          head: words[0].id
        }),

        //loop through words array that is updated to match our list
        ...words.map((word, i) => {
          if(i + 1 >= words.length){
            word.next = null;
          } else {
            word.next = words[i + 1].id;
          }
          return trx('word')
            .where({id: word.id})
            .update({
              ...word
            })
        })
      ])
    })
  }
};



module.exports = LanguageService;
