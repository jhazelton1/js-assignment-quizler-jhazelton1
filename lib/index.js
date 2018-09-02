'use strict';

var _vorpal = require('vorpal');

var _vorpal2 = _interopRequireDefault(_vorpal);

var _inquirer = require('inquirer');

var _lib = require('./lib');

var _url = require('url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const cli = (0, _vorpal2.default)();

const askForQuestions = [{
  type: 'input',
  name: 'numQuestions',
  message: 'How many questions do you want in your quiz?',
  validate: input => {
    const pass = input.match(/^[1-9]{1}$|^[1-9]{1}[0-9]{1}$|^100$/);
    return pass ? true : 'Please enter a valid number!';
  }
}, {
  type: 'input',
  name: 'numChoices',
  message: 'How many choices should each question have?',
  validate: input => {
    const pass = input.match(/^(?:[2-4]|0[2-4]|4)$/);
    return pass ? true : 'Please enter a valid number!';
  }
}];

const promptToQuiz = data => (0, _lib.createPrompt)(data).reduce((arr, c) => {
  c['validate'] = input => {
    const pass = input.length > 2;
    return pass ? true : 'Enter a longer input!';
  };
  arr.push(c);
  return arr;
}, []);

const readMultipleFiles = (arr, n) => arr.reduce((all, file) => {
  all.push((0, _lib.readJsonFile)(`quiz/${file}.json`).then(data => JSON.parse(data)));
  return all;
}, []);

const createQuiz = title => (0, _inquirer.prompt)(askForQuestions).then(answer => (0, _inquirer.prompt)(promptToQuiz(answer))).then(quizData => (0, _lib.writeJsonFile)(`quiz/${title}.json`, JSON.stringify(quizData))).catch(err => console.log('Error creating the quiz.', err));

const takeQuiz = (title, output) => (0, _lib.readJsonFile)(`quiz/${title}.json`).then(data => (0, _lib.createQuestions)(JSON.parse(data))).then(quizData => (0, _inquirer.prompt)(quizData)).then(answers => (0, _lib.writeJsonFile)(`quiz/answers/${output}.json`, JSON.stringify(answers))).catch(err => console.log('Error taking the quiz.', err));

const takeRandomQuiz = (output, n, quizzes) => Promise.all(readMultipleFiles(quizzes)).then(data => data.reduce((all, quiz) => all.concat((0, _lib.chooseRandom)((0, _lib.createQuestions)(quiz), n)), [])).then(quizData => (0, _inquirer.prompt)(quizData)).then(randomQuiz => (0, _lib.writeJsonFile)(`quiz/answers/${output}.json`, JSON.stringify(randomQuiz)));

cli.command('create <fileName>', 'Creates a new quiz and saves it to the given fileName').action(function (input, callback) {
  return createQuiz(input.fileName);
});

cli.command('take <fileName> <outputFile>', 'Loads a quiz and saves the users answers to the given outputFile').action(function (input, callback) {
  return takeQuiz(input.fileName, input.outputFile);
});

cli.command('random <outputFile> <n> <fileNames...>', 'Loads a quiz or' + ' multiple quizes and selects a random number of questions from each quiz.' + ' Then, saves the users answers to the given outputFile').action(function (input, callback) {
  return takeRandomQuiz(input.outputFile, input.n, input.fileNames);
});

cli.delimiter(cli.chalk['yellow']('quizler>')).show();