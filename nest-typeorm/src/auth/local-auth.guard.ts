import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  // LocalStrategy.validate를 콜한다. 그리고 리턴되는  done(null, user)를 활용하여
  // request.user = user를 수행한다. 그 다음으로 아래가 수행된다.....
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = await super.canActivate(context);
    if (can) {
      const request = context.switchToHttp().getRequest();
      // console.log(
      //   '현재 이 request에는 user가 들어 있다. 확인해보자 LocalAuthGuard, request: ',
      //   request.user,
      // );

      // super.logIn(request)은 LocalSerializer.serializeUser를 수행시켜서
      // done(null, user.id)에 있는 user.id를 session에 저장한다. 그 다음,
      // user.id를 암호화하여 집어 넣은, 세션쿠키를 브라우져로 보낸다.

      // passport 로그인 이후 과정... 모든 요청에 대하여
      // 1. main.ts에서  app.use(session({...}))  passport.deserializeUser() 메서드를 매번 호출한다
      // 2. deserializeUser에서 req.session에 저장된 아이디로 데이터베이스에서 사용자 조회
      // 3. 조회된 사용자 전체 정보를 req.user 객체에 저장
      // 4. 이제부터 라우터에서 req.user를 공용적으로 사용 가능하게 된다.
      // reference: [NODE] 📚 Passport 모듈 사용법 (그림으로 처리 과정 💯 이해하기)
      // https://inpa.tistory.com/entry/NODE-%F0%9F%93%9A-Passport-%EB%AA%A8%EB%93%88-%EA%B7%B8%EB%A6%BC%EC%9C%BC%EB%A1%9C-%EC%B2%98%EB%A6%AC%EA%B3%BC%EC%A0%95-%F0%9F%92%AF-%EC%9D%B4%ED%95%B4%ED%95%98%EC%9E%90

      await super.logIn(request);
    }

    return true;
  }
}
