const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');
const { checkGuess } = require('./language-service');
const jsonParser = express.json();
const languageRouter = express.Router();
const { LinkedList, toArray, _Node } = require('../linked-list');

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      );

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        });

      req.language = language;
      next();
    } catch (error) {
      next(error);
    }
  });

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      );

      res.json({
        language: req.language,
        words,
      });
      next();
    } catch (error) {
      next(error);
    }
  });

// get next word I think... 
languageRouter
  .get('/head', async (req, res, next) => {
    // using get'/' as example for setup
    try {
      // only works in brackets - expect payload to be an array of objects, forces type of variable to be an array
      const [nextWord] = await LanguageService.getNextWord(
        req.app.get('db'),
        req.language.id,
      );
      // expected from front end: 
      // "nextWord": "Testnextword",
      // "wordCorrectCount": 222,
      // "wordIncorrectCount": 333,
      // "totalScore": 999

      res.json({
        // access nextWord from above & the column headers from migrations file
        nextWord: nextWord.original,
        wordCorrectCount: nextWord.correct_count,
        wordIncorrectCount: nextWord.incorrect_count,
        //have to access through req since nextWord is accessing only the words table
        totalScore: req.language.total_score
      });
      next();
    }
    catch (error) {
      next(error);
    }
  });




languageRouter
  .post('/guess', jsonParser, async (req, res, next) => {
    // get words from database
    //     // go to start of word list
    //     // create list of words
    //     // check guess - memory value
    //     // if guess is correct save to db?? 
    const guess = req.body.guess;
    if (!guess) {
      res.status(400).json({
        error: `Missing 'guess' in request body`,
      });
    }
    try {
      // fetch user's words from database
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      );
      // find start of user's word list
      const [{ head }] = await LanguageService.getLanguageHead(
        req.app.get('db'),
        req.language.id,
      );
      // create linked list of user's words
      const list = LanguageService.createLinkedList(words, head);
      const [checkNextWord] = await LanguageService.checkGuess(
        req.app.get('db'),
        req.language.id
      );

      ///if statement?? see if guess is right?
      if (checkNextWord.translation === guess) {
        // If user's guess is correct, we update the memory value of the current word, the move the word an appropriate number of
        //spaces back in the list, updating all affected nodes
        const newMemVal = list.head.value.memory_value * 2;
        list.head.value.memory_value = newMemVal;
        list.head.value.correct_count++;

        let curr = list.head;
        let countDown = newMemVal;
        while (countDown > 0 && curr.next !== null) {
          curr = curr.next;
          countDown--;
        }

        const temp = new _Node(list.head.value);

        // if current.next null - set temp val to null 
        if (curr.next === null) {
          temp.next = curr.next;
          curr.next = temp;
          list.head = list.head.next;
          curr.value.next = temp.value.id;
          temp.value.next = null;
        }
        // else if current has a next - set next val to temp val id
        else {
          temp.next = curr.next;
          curr.next = temp;
          list.head = list.head.next;
          curr.value.next = temp.value.id;
          temp.value.next = temp.next.value.id;
        }
        //increment total score 
        req.language.total_score++;
        await LanguageService.updateWordsTable(
          req.app.get('db'),
          toArray(list),
          req.language.id,
          req.language.total_score
        );
        res.json({
          nextWord: list.head.value.original,
          totalScore: req.language.total_score,
          wordCorrectCount: list.head.value.correct_count,
          wordIncorrectCount: list.head.value.incorrect_count,
          answer: temp.value.translation,
          isCorrect: true
        });
                
      } else {
        // If user's guess is incorrect, we reset the memory value of the current word to 1 and move the word back 1 space, 
        //updating all affected nodes
        list.head.value.memory_value = 1;
        list.head.value.incorrect_count++;

        let curr = list.head;
        let countDown = 1;
        while (countDown > 0) {
          curr = curr.next;
          countDown--;
        }

        const temp = new _Node(list.head.value);
        temp.next = curr.next;
        curr.next = temp;
        list.head = list.head.next;
        curr.value.next = temp.value.id;
        temp.value.next = temp.next.value.id;

        await LanguageService.updateWordsTable(
          // once our list is correct, we persist those changes to the databse
          req.app.get('db'),
          toArray(list),
          req.language.id,
          req.language.total_score
        );
        //same as above but set to false
        res.json({
          nextWord: list.head.value.original,
          totalScore: req.language.total_score,
          wordCorrectCount: list.head.value.correct_count,
          wordIncorrectCount: list.head.value.incorrect_count,
          answer: temp.value.translation,
          isCorrect: false
        });
      }
      next();
    }
    catch (error) {
      next(error);
    }
  });

module.exports = languageRouter;
