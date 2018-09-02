import vorpal from 'vorpal'
import { prompt } from 'inquirer'

import {
  chooseRandom,
  createPrompt,
  createQuestions,
  writeJsonFile,
  readJsonFile
} from './lib'
import { resolve } from 'url'

const cli = vorpal()

const askForQuestions = [
  {
    type: 'input',
    name: 'numQuestions',
    message: 'How many questions do you want in your quiz?',
    validate: input => {
      const pass = input.match(/^[1-9]{1}$|^[1-9]{1}[0-9]{1}$|^100$/)
      return pass ? true : 'Please enter a valid number!'
    }
  },
  {
    type: 'input',
    name: 'numChoices',
    message: 'How many choices should each question have?',
    validate: input => {
      const pass = input.match(/^(?:[2-4]|0[2-4]|4)$/)
      return pass ? true : 'Please enter a valid number!'
    }
  }
]

const promptToQuiz = data =>
  createPrompt(data).reduce((arr, c) => {
    c['validate'] = input => {
      const pass = input.length > 2
      return pass ? true : 'Enter a longer input!'
    }
    arr.push(c)
    return arr
  }, [])

const readMultipleFiles = (arr, n) =>
  arr.reduce((all, file) => {
    all.push(readJsonFile(`quiz/${file}.json`).then(data => JSON.parse(data)))
    return all
  }, [])

const createQuiz = title =>
  prompt(askForQuestions)
    .then(answer => prompt(promptToQuiz(answer)))
    .then(quizData =>
      writeJsonFile(`quiz/${title}.json`, JSON.stringify(quizData))
    )
    .catch(err => console.log('Error creating the quiz.', err))

const takeQuiz = (title, output) =>
  readJsonFile(`quiz/${title}.json`)
    .then(data => createQuestions(JSON.parse(data)))
    .then(quizData => prompt(quizData))
    .then(answers =>
      writeJsonFile(`quiz/answers/${output}.json`, JSON.stringify(answers))
    )
    .catch(err => console.log('Error taking the quiz.', err))

const takeRandomQuiz = (output, n, quizzes) =>
  Promise.all(readMultipleFiles(quizzes))
    .then(data =>
      data.reduce(
        (all, quiz) => all.concat(chooseRandom(createQuestions(quiz), n)),
        []
      )
    )
    .then(quizData => prompt(quizData))
    .then(randomQuiz =>
      writeJsonFile(`quiz/answers/${output}.json`, JSON.stringify(randomQuiz))
    )
    .catch(err => console.log('Error taking the random quiz.', err))

cli
  .command(
    'create <fileName>',
    'Creates a new quiz and saves it to the given fileName'
  )
  .action(function (input, callback) {
    return createQuiz(input.fileName)
  })

cli
  .command(
    'take <fileName> <outputFile>',
    'Loads a quiz and saves the users answers to the given outputFile'
  )
  .action(function (input, callback) {
    return takeQuiz(input.fileName, input.outputFile)
  })

cli
  .command(
    'random <outputFile> <n> <fileNames...>',
    'Loads a quiz or' +
      ' multiple quizes and selects a random number of questions from each quiz.' +
      ' Then, saves the users answers to the given outputFile'
  )
  .action(function (input, callback) {
    return takeRandomQuiz(input.outputFile, input.n, input.fileNames)
  })

cli.delimiter(cli.chalk['yellow']('quizler>')).show()
