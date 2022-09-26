import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/* 
1. super.canActivate(context) in LocalAuthGuard extends AuthGuard("local")
2.  validate(email: string, password: string, done: CallableFunction) in LocalStrategy
3.    DB를 이용하여 user 검증. 성공하면 user를 가져온다.
4.    done(null, user)  // request에 user가 만들어 진다.
5.    request.user 가 만들어져 있다.
6. super.logIn(request) 
7.  serializeUser
8.    request.session에 userId를 써 넣는다.

[Nest] 32200  - 2022. 09. 25. 오후 11:43:21     LOG [NestApplication] Nest application successfully started +15ms
listening on port 3030
request.user:  undefined
super.canActivate(context) called.
validate(email: string, password: string, done: CallableFunction) called.
query: SELECT `Users`.`id` AS `Users_id`, `Users`.`email` AS `Users_email`, `Users`.`password` AS `Users_password` FROM `users` `Users` WHERE ( `Users`.`email` = ? ) AND ( `Users`.`deletedAt` IS NULL ) LIMIT 1 -- PARAMETERS: ["cient-100@client.com"]
super.canActivate(context) exited.
request.user: { id: 2, email: 'cient-100@client.com' }
request.session: Session {
  cookie: { path: '/', _expires: null, originalMaxAge: null, httpOnly: true }
}
super.logIn(request) called.
serializeUser--user:  { id: 2, email: 'cient-100@client.com' }
super.logIn(request) exited.
request.session: Session {
  cookie: { path: '/', _expires: null, originalMaxAge: null, httpOnly: true },
  passport: { user: 2 }
}
[Nest] 32200  - 2022. 09. 25. 오후 11:43:24
*/

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // super.canActivate(context)
    //
    console.log("request.user: ", context.switchToHttp().getRequest().user);
    console.log("super.canActivate(context) called.");
    const can = await super.canActivate(context);
    console.log("super.canActivate(context) exited.");
    if (can) {
      const request = context.switchToHttp().getRequest();
      console.log("request.user:", request.user);
      console.log("request.session:", request.session);
      console.log("super.logIn(request) called.");
      await super.logIn(request);
      console.log("super.logIn(request) exited.");
      console.log("request.session:", request.session);
    }

    return true;
  }
}
