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

# static asset 저장하기

예를 들어 http://localhost:3095/uploads/Fig15.E301666854079567.png 를 브라우저 URL창에 입력하였을 겅우 path routing으로 인식하게 하지 말고 static file download로 인식하기를 원할 경우 main.ts에서

```js
app.useStaticAssets(
  process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '..', '..', 'uploads')
    : path.join(__dirname, '..', 'uploads'),
  {
    prefix: '/uploads',
  },
);
```

를 사용한다.

만약 정해진 위치에 디렉토리나 파일이 존재하지 않는다면 path routing으로 전환된다.

nest build 를 수행하면
production 이 빌드된다. 즉 /dist에 ts가 컴파일되어 저장된다.

nest start를 사용할 경우 production mode를 사용하려면 cross-env NODE_ENV=production으로 수행하여야 한다.
