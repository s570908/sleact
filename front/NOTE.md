# VSCode에서 발생하는 Delete `␍` eslint (prettier/prettier) 해결방법

.eslintrc에 다음을 추가한다.

```
rules: {
       'prettier/prettier': [
           'error',
           {
               endOfLine: 'auto',
           },
       ],
   },
```

# Webpack Dev Server

https://joshua1988.github.io/webpack-guide/devtools/webpack-dev-server.html#%ED%94%84%EB%A1%9D%EC%8B%9C-proxy-%EC%84%A4%EC%A0%95
