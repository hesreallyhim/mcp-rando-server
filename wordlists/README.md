# Diceware Wordlists

This directory contains wordlists for generating passphrases (passwords) according to the ["Diceware" method](https://theworld.com/~reinhold/diceware.html).

Diceware is a method of creating a secure passphrase by randomly selecting words from a wordlist, wherein each word is associated with an N-digit numberical string composed of the numerals 1-6, and the user rolls N dice M times to pick M words from the list, which then becomes the passphrase - a set of M words (four or five is common) that provide a cryptogrhically strong password made up of words that can easily be memorized.

This directory constains the following wordlists, provided by the [Electronic Frontier Foundation (EFF)](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases):

- [large_wordlist.txt](large_wordlist.txt): 7776 words (5 dice)
- [short_wordlist.txt](short_wordlist.txt): 1296 words (4 dice)
- [short_wordlist_unique_prefixes.txt](short_wordlist_unique_prefixes.txt): 1296 words (4 dice) with unique prefixes, containing words that have a minimum edit distance of 3, potentially enabling software that could correct a typo in the passphrase without compromising security.

The EFF's wordlists have been curated to remove profanities, homophones, words that are difficult to spell, and to incorporate other optimizations to make them more suitable for passphrase generation and memorization.

The directory also contains the original wordlist provided by Arnold Reinhold:

- [original_reinhold_wordlist.txt](original_reinhold_wordlist.txt): 7776 words (5 dice)

For more information on the Diceware method, see the EFF's [Diceware page](https://www.eff.org/deeplinks/2016/07/new-wordlists-random-passphrases) and the original [Diceware page by Arnold Reinhold](https://theworld.com/~reinhold/diceware.html).
