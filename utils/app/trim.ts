import {WordTokenizer,Stemmer,PorterStemmer,LancasterStemmer} from 'natural';
import * as stopwords from 'stopword';
export const config = {
    runtime: 'edge',
    unstable_allowDynamic: ['/node_modules/underscore/modules/_setup.js']
  };
// Define constants
const PUNCTUATION: string[] = [".", ",", "'", '"', "!", "?", ";", ":", "-"];

const ARTICLES_PREPOSITIONS: {[key: string]: string[]} = {
    'eng': ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of']
};

const NEGATION_WORDS: {[key: string]: string[]} = {
    'eng': [
        'no',
        'nor',
        'not',
        'don',
        "dont",
        'ain',
        'aren',
        "arent",
        'couldn',
        "couldnt",
        'didn',
        "didnt",
        'doesn',
        "doesnt",
        'hadn',
        "hadnt",
        'hasn',
        "hasnt",
        'haven',
        "havent",
        'isn',
        "isnt",
        'mightn',
        "mightnt",
        'mustn',
        "mustnt",
        'needn',
        "neednt",
        'shan',
        "shant",
        'shouldn',
        "shouldnt",
        'wasn',
        "wasnt",
        'weren',
        "werent",
        'won',
        "wont",
        'wouldn',
        "wouldnt",
    ]
};

// Function to mimic Python's str.istitle()
function isTitle(s: string): boolean {
    const words = s.split(" ");
    return words.every(word => word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase());
}

export function trim(
    text: string, 
    stemmer: string | null = null, 
    language: stopwords.LanguageCode = 'eng', 
    removeSpaces: boolean = true, 
    removeStopwords: boolean = true, 
    removePunctuation: boolean = false
): string {
    let wordsToExclude: string[] = [];
    text = text.replace(/'/g, '');

    // Tokenize and filter punctuation if required
    let tokenized: string[] = new WordTokenizer().tokenize(text) || [];
    if (removePunctuation) {
        tokenized = tokenized.filter(word => !PUNCTUATION.includes(word));
    }

    // Remove stopwords if required
    if (removeStopwords) {
        const nltkStopwords = stopwords[language];
        const combined = [...nltkStopwords, ...ARTICLES_PREPOSITIONS[language]];
        const uniqueWords = Array.from(new Set(combined));
        wordsToExclude = uniqueWords.filter(word => !NEGATION_WORDS[language].includes(word));
        tokenized = stopwords.removeStopwords(tokenized, wordsToExclude);
    }

    let words = [...tokenized];

    if (stemmer) {
        let stemmerObj: Stemmer;
        if (stemmer == 'porter') {
            stemmerObj = PorterStemmer;
        } else if (stemmer == 'lancaster') {
            stemmerObj = LancasterStemmer;
        }
        tokenized = tokenized.map((word, i) => {
            let stemmed = stemmerObj.stem(word);
            if (isTitle(words[i])) {
                stemmed = stemmed.charAt(0).toUpperCase() + stemmed.slice(1).toLowerCase();
            } else if (words[i] === words[i].toUpperCase()) {
                stemmed = stemmed.toUpperCase();
            }
            return stemmed;
        });
    }

    return removeSpaces ? tokenized.join('') : tokenized.join(' ');
}