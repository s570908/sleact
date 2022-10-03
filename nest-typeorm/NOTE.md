# Error installing bcrypt with npm

Solved: 잘된다.

https://stackoverflow.com/questions/29320201/error-installing-bcrypt-with-npm
I installed bcrypt-nodejs though it's already deprecated, and then removed it and installed bcrypt again. Like this, I Installed bcrypt successfully and it worked fine.

yarn add bcrypt-nodejs
yarn remove bcrypt-nodejs
yarn add bcrypt

# baseUrl과 originalUrl의 차이

https://morian-kim.tistory.com/3

# question: "classTransformer.plainToClass is not a function" when using simple validator in class (nestjs ValidationPipe) #1411

npm i class-transformer@0.4.0 works, class-transformer: ^0.4.0 this not working.
